export type AnyKey = keyof any;
export type AnyPlainObject = Record<AnyKey, unknown>;
export type AnyArray = readonly any[];

export type Simplify<T> = T extends any ? { [K in keyof T]: T[K] } : never;

// prettier-ignore
export type IfExactlyTrue<T, ThenType, ElseType> = [T] extends [true] ? [true] extends [T] ? ThenType : ElseType : ElseType;
