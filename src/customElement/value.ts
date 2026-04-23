// This element is read-only and stores no value.
export type Value = Readonly<Record<string, never>>;

export const parseValue = (_input: string | null): Value | null | "invalidValue" => null;
