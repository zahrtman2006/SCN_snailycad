import * as Prisma from "@prisma/client";
import * as Types from "../index";
import { APITextChannel } from "discord-api-types/v10";

/**
 * @method GET
 * @route /admin/manage/cad-settings
 */
export type GetCADSettingsData = Types.cad;

/**
 * @method PUT
 * @route /admin/manage/cad-settings
 */
export type PutCADSettingsData = Prisma.cad & {
  features: Record<Types.Feature, boolean>;
  miscCadSettings: Types.MiscCadSettings | null;
  apiToken: Types.ApiToken | null;
};

/**
 * @method PUT
 * @route /admin/manage/cad-settings/features
 */
export type PutCADFeaturesData = PutCADSettingsData;

/**
 * @method PUT
 * @route /admin/manage/cad-settings/misc
 */
export type PutCADMiscSettingsData = Types.MiscCadSettings;

/**
 * @method PUT
 * @route /admin/manage/cad-settings/default-permissions
 */
export type PutCADDefaultPermissionsData = Types.AutoSetUserProperties;

/**
 * @method PUT
 * @route /admin/manage/cad-settings/api-token
 */
export type PutCADApiTokenData = Types.ApiToken | null;

/**
 * @method DELETE
 * @route /admin/manage/cad-settings/api-token
 */
export type DeleteCADApiTokenData = Types.ApiToken;

/** discord settings */
/**
 * @method GET
 * @route /admin/manage/cad-settings/discord/roles
 */
export type GetCADDiscordRolesData = Prisma.DiscordRole[];

/**
 * @method POST
 * @route /admin/manage/cad-settings/discord/roles
 */
export type PostCADDiscordRolesData = Prisma.DiscordRoles & {
  adminRoles?: Prisma.DiscordRole[];
  leoRoles?: Prisma.DiscordRole[];
  leoSupervisorRoles?: Prisma.DiscordRole[];
  emsFdRoles?: Prisma.DiscordRole[];
  dispatchRoles?: Prisma.DiscordRole[];
  towRoles?: Prisma.DiscordRole[];
  taxiRoles?: Prisma.DiscordRole[];
  courthouseRoles?: Prisma.DiscordRole[];
  roles?: Prisma.DiscordRole[];
};

/**
 * @method GET
 * @route /admin/manage/cad-settings/discord/webhooks
 */
export type GetCADDiscordWebhooksData = Required<Pick<APITextChannel, "id" | "name">>[];

/**
 * @method POST
 * @route /admin/manage/cad-settings/discord/webhooks
 */
export type PostCADDiscordWebhooksData = Types.MiscCadSettings;

/**
 * @method GET
 * @route /admin/manage/cad-settings/blacklisted-words
 */
export interface GetBlacklistedWordsData {
  totalCount: number;
  blacklistedWords: Prisma.BlacklistedWord[];
}

/**
 * @method POST
 * @route /admin/manage/cad-settings/blacklisted-words
 */
export type PostBlacklistedWordsData = Prisma.BlacklistedWord[];

/**
 * @method DELETE
 * @route /admin/manage/cad-settings/blacklisted-words/:wordId
 */
export type DeleteBlacklistedWordsData = boolean;
