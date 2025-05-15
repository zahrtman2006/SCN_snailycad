import { SlateElements, Text } from "./types";
import { BaseEditor, Descendant } from "slate";
import { ReactEditor } from "slate-react";
import { HistoryEditor } from "slate-history";

export type SlateEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
  interface CustomTypes {
    Element: SlateElements;
    Text: Text;
  }
}

export * from "./types";
export { slateDataToString } from "./slate-data-to-string";
export type { Descendant };
