import { AssignedUnit, ShouldDoType } from "@prisma/client";
import { Call911 } from "@prisma/client";
import { findUnit } from "~/lib/leo/findUnit";
import { prisma } from "~/lib/data/prisma";
import { Socket } from "~/services/socket-service";
import { manyToManyHelper } from "~/lib/data/many-to-many";
import { z } from "zod";
import { ASSIGNED_UNIT } from "@snailycad/schemas";
import { createAssignedText } from "./utils/create-assigned-text";
import { getNextActive911CallId } from "./get-next-active-911-call";
import { assignedUnitsInclude } from "~/utils/leo/includes";

interface Options {
  call: Call911 & { assignedUnits: AssignedUnit[] };
  unitIds: z.infer<typeof ASSIGNED_UNIT>[];
  maxAssignmentsToCalls: number;
  socket?: Socket;
}

export async function assignUnitsTo911Call(options: Options) {
  const disconnectConnectArr = manyToManyHelper(
    options.call.assignedUnits.map((u) =>
      String(u.officerId || u.emsFdDeputyId || u.combinedLeoId),
    ),
    options.unitIds.map((v) => v.id),
    { showUpsert: false },
  );

  const disconnectedUnits: NonNullable<Awaited<ReturnType<typeof handleDeleteAssignedUnit>>>[] = [];
  const connectedUnits: NonNullable<Awaited<ReturnType<typeof handleDeleteAssignedUnit>>>[] = [];

  await Promise.all(
    disconnectConnectArr.map(async (data) => {
      const deletionId = "disconnect" in data && data.disconnect?.id;
      const creationId = "connect" in data && data.connect?.id;

      if (deletionId) {
        const callData = await handleDeleteAssignedUnit({ unitId: deletionId, call: options.call });
        if (!callData) return;
        disconnectedUnits.push(callData);
        return callData;
      }

      if (creationId) {
        const isPrimary = options.unitIds.find((v) => v.id === creationId)?.isPrimary;
        const callData = await handleCreateAssignedUnit({
          unitId: creationId,
          isPrimary: isPrimary ?? false,
          maxAssignmentsToCalls: options.maxAssignmentsToCalls,
          call: options.call,
        });
        if (!callData) return;

        connectedUnits.push(callData.assignedUnit);
        return callData.call;
      }

      return null;
    }),
  );

  const translationData = createAssignedText({
    disconnectedUnits,
    connectedUnits,
  });
  await prisma.$transaction(
    translationData.map((data) =>
      prisma.call911Event.create({
        data: {
          call911Id: options.call.id,
          translationData: data as any,
          description: data.key,
        },
      }),
    ),
  );

  if (options.socket) {
    await options.socket.emitUpdateOfficerStatus();
    await options.socket.emitUpdateDeputyStatus();
  }
}

export async function handleDeleteAssignedUnit(
  options: Omit<HandleCreateAssignedUnitOptions, "maxAssignmentsToCalls" | "isPrimary">,
) {
  const prismaNames = {
    officerId: "officer",
    emsFdDeputyId: "emsFdDeputy",
    combinedLeoId: "combinedLeoUnit",
    combinedEmsFdId: "combinedEmsFdUnit",
  } as const;

  const assignedUnit = await prisma.assignedUnit.findFirst({
    where: {
      call911Id: options.call.id,
      OR: [
        { officerId: options.unitId },
        { emsFdDeputyId: options.unitId },
        { combinedLeoId: options.unitId },
        { combinedEmsFdId: options.unitId },
      ],
    },
    include: assignedUnitsInclude.include,
  });
  if (!assignedUnit) return;

  const unit = await prisma.assignedUnit.delete({ where: { id: assignedUnit.id } });

  for (const type in prismaNames) {
    const key = type as keyof typeof prismaNames;
    const unitId = unit[key];
    const prismaName = prismaNames[key];

    if (unitId) {
      // @ts-expect-error they have the same properties for updating
      await prisma[prismaName].update({
        where: { id: unitId },
        data: {
          activeCallId: await getNextActive911CallId({
            callId: options.call.id,
            type: "unassign",
            unit: { id: options.unitId },
          }),
        },
      });
    }
  }

  return assignedUnit;
}

interface HandleCreateAssignedUnitOptions {
  unitId: string;
  call: Call911;
  maxAssignmentsToCalls: number;
  isPrimary: boolean;
}

async function handleCreateAssignedUnit(options: HandleCreateAssignedUnitOptions) {
  const { unit, type } = await findUnit(options.unitId, {
    NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
  });
  const types = {
    leo: "officerId",
    "ems-fd": "emsFdDeputyId",
    "combined-leo": "combinedLeoId",
    "combined-ems-fd": "combinedEmsFdId",
  };

  if (!unit) {
    return;
  }

  const assignmentCount = await prisma.assignedUnit.count({
    where: {
      [types[type]]: unit.id,
      call911: { ended: false },
    },
  });

  if (assignmentCount >= options.maxAssignmentsToCalls) {
    // skip this officer
    return;
  }

  const prismaNames = {
    leo: "officer",
    "ems-fd": "emsFdDeputy",
    "combined-leo": "combinedLeoUnit",
    "combined-ems-fd": "combinedEmsFdUnit",
  } as const;
  const prismaModelName = prismaNames[type];

  const status = await prisma.statusValue.findFirst({
    where: { shouldDo: ShouldDoType.SET_ASSIGNED },
  });

  if (status) {
    // @ts-expect-error ignore
    await prisma[prismaModelName].update({
      where: { id: unit.id },
      data: { statusId: status.id },
    });
  }

  // @ts-expect-error they have the same properties for updating
  await prisma[prismaModelName].update({
    where: { id: unit.id },
    data: {
      activeCallId: await getNextActive911CallId({
        callId: options.call.id,
        type: "assign",
        unit,
      }),
    },
  });

  if (options.isPrimary) {
    await prisma.assignedUnit.updateMany({
      where: { call911Id: options.call.id },
      data: { isPrimary: false },
    });
  }

  const assignedUnit = await prisma.assignedUnit.create({
    data: {
      isPrimary: options.isPrimary,
      call911Id: options.call.id,
      [types[type]]: unit.id,
    },
    include: assignedUnitsInclude.include,
  });

  return {
    call: prisma.call911.update({
      where: { id: options.call.id },
      data: { assignedUnits: { connect: { id: assignedUnit.id } } },
    }),
    assignedUnit,
  };
}
