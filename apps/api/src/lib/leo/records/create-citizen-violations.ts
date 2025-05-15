import { Feature } from "@prisma/client";
import { upsertRecord } from "./upsert-record";
import { z } from "zod";
import { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";

interface Options {
  cad: { features?: Record<Feature, boolean> };
  data: z.infer<typeof CREATE_TICKET_SCHEMA>[];
  citizenId: string;
}

export async function createCitizenViolations(options: Options) {
  try {
    await Promise.all(
      options.data.map((violation) =>
        upsertRecord({
          data: { ...violation, citizenId: options.citizenId },
          recordId: null,
          cad: options.cad,
        }),
      ),
    );
  } catch {
    /* empty */
  }
}
