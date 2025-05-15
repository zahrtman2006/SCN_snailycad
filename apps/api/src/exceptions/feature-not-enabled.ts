import { ResponseErrorObject } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { IsFeatureEnabledOptions } from "middlewares/is-enabled";

export class FeatureNotEnabled extends BadRequest implements ResponseErrorObject {
  headers = {};
  errors = {};

  constructor(options: IsFeatureEnabledOptions) {
    super("featureNotEnabled");
    this.errors = { message: "featureNotEnabled", data: options };
  }
}
