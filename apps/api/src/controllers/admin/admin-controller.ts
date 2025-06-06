import { Controller } from "@tsed/di";
import { Get, Description, ContentType } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { glob } from "glob";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import { Res, UseBefore } from "@tsed/common";
import { IsAuth } from "middlewares/auth/is-auth";
import { Prisma, WhitelistStatus } from "@prisma/client";
import { UsePermissions } from "middlewares/use-permissions";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { GetAdminDashboardData } from "@snailycad/types/api";
import { request } from "undici";
import { getCADVersion } from "@snailycad/utils/version";

export const ONE_DAY = 60 * 60 * 24;

@Controller("/admin")
@ContentType("application/json")
export class AdminController {
  private changelogBody: string | null = null;

  @Get("/")
  @UseBefore(IsAuth)
  @Description("Get simple CAD stats")
  @UsePermissions({
    permissions: [
      ...defaultPermissions.allDefaultAdminPermissions,
      ...defaultPermissions.defaultCourthousePermissions,
      Permissions.ManageAwardsAndQualifications,
    ],
  })
  async getData(@Res() res: Res): Promise<GetAdminDashboardData> {
    const [activeUsers, pendingUsers, bannedUsers] = await prisma.$transaction([
      prisma.user.count({ where: { whitelistStatus: WhitelistStatus.ACCEPTED } }),
      prisma.user.count({ where: { whitelistStatus: WhitelistStatus.PENDING } }),
      prisma.user.count({ where: { banned: true } }),
    ]);

    const [createdCitizens, citizensInBolo, arrestCitizens, deadCitizens] =
      await prisma.$transaction([
        prisma.citizen.count(),
        prisma.bolo.count({ where: { type: "PERSON" } }),
        prisma.citizen.count({ where: { Record: { some: { type: "ARREST_REPORT" } } } }),
        prisma.citizen.count({ where: { dead: true } }),
      ]);

    const [vehicles, impoundedVehicles, vehiclesInBOLO] = await prisma.$transaction([
      prisma.registeredVehicle.count(),
      prisma.registeredVehicle.count({ where: { impounded: true } }),
      prisma.bolo.count({ where: { type: "VEHICLE" } }),
    ]);

    const filters:
      | Pick<Prisma.OfficerWhereInput, "status">[]
      | Pick<Prisma.EmsFdDeputyWhereInput, "status">[] = [
      { status: { shouldDo: "SET_OFF_DUTY" } },
      { status: { is: null } },
    ];

    const [officerCount, onDutyOfficers, suspendedOfficers] = await prisma.$transaction([
      prisma.officer.count(),
      prisma.officer.count({ where: { NOT: { OR: filters } } }),
      prisma.officer.count({ where: { suspended: true } }),
    ]);

    const [emsDeputiesCount, onDutyEmsDeputies, suspendedEmsFDDeputies] = await prisma.$transaction(
      [
        prisma.emsFdDeputy.count(),
        prisma.emsFdDeputy.count({ where: { NOT: { OR: filters } } }),
        prisma.emsFdDeputy.count({ where: { suspended: true } }),
      ],
    );

    res.setHeader(
      "Cache-Control",
      `private, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_DAY / 2}`,
    );

    const imageData = await this.imageData().catch(() => null);

    return {
      activeUsers,
      pendingUsers,
      bannedUsers,

      createdCitizens,
      citizensInBolo,
      arrestCitizens,
      deadCitizens,

      officerCount,
      onDutyOfficers,
      suspendedOfficers,

      emsDeputiesCount,
      onDutyEmsDeputies,
      suspendedEmsFDDeputies,

      vehicles,
      impoundedVehicles,
      vehiclesInBOLO,
      imageData: imageData ?? {
        count: 0,
        totalSize: 0,
      },
    };
  }

  @Get("/changelog")
  @Description("Get the changelog from GitHub.")
  async getChangelog(@Res() res: Res) {
    try {
      if (this.changelogBody) {
        return this.changelogBody;
      }

      const version = await getCADVersion();

      if (!version?.currentVersion) {
        return null;
      }

      const response = await request(
        `https://api.github.com/repos/SnailyCAD/snaily-cadv4/releases/tags/${version.currentVersion}`,
        { headers: { "user-agent": "SnailyCAD", accept: "application/vnd.github+json" } },
      );

      res.setHeader(
        "Cache-Control",
        `private, max-age=${ONE_DAY} stale-while-revalidate=${ONE_DAY / 2}`,
      );

      const body = (await response.body.json()) as { body: string };

      this.changelogBody = body.body;
      const json = body.body;
      return json;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error(e);
      }
      return null;
    }
  }

  private async imageData() {
    try {
      const path = join(__dirname, "../../../", "public");
      const items = await glob(`${path}/**/*.*`);
      let totalSize = 0;

      await Promise.all(
        items.map(async (item) => {
          const { size } = await stat(join(item));
          totalSize += size;
        }),
      );

      return { count: items.length, totalSize };
    } catch {
      return null;
    }
  }
}
