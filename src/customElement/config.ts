export type Config = Readonly<{
  apiKey: string;
  linkedItemsElementCodename: string;
}>;

export const isConfig = (value: Readonly<Record<string, unknown>> | null): value is Config =>
  value !== null &&
  typeof value.apiKey === "string" && value.apiKey.length > 0 &&
  typeof value.linkedItemsElementCodename === "string" && value.linkedItemsElementCodename.length > 0;
