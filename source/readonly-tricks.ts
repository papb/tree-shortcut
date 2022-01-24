import type { AnyKey, AnyPlainObject, Simplify } from './basic-types';

// prettier-ignore
type IfStrictEqualForSimpleObjectsIncludingReadonlyAnalysisHelper<A1, A2, ThenType, ElseType> =
	// Credit: https://github.com/millsp/ts-toolbelt/blob/91aef20a67da686fda397051f467b00a43db6591/src/Any/Equals.ts
	(<A>() => A extends A2 ? 1 : 0) extends (<A>() => A extends A1 ? 1 : 0) ?
		(<A>() => A extends A1 ? 1 : 0) extends (<A>() => A extends A2 ? 1 : 0) ?
			ThenType
		: ElseType
	: ElseType;

// prettier-ignore
type IfStrictEqualForSimpleObjectsIncludingReadonlyAnalysis<X extends AnyPlainObject, Y extends AnyPlainObject, ThenType, ElseType> =
	IfStrictEqualForSimpleObjectsIncludingReadonlyAnalysisHelper<Simplify<X>, Simplify<Y>, ThenType, ElseType>;

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/naming-convention
type _IfIsReadonlyKey<T extends AnyPlainObject, Key extends keyof T, ThenType, ElseType> =
	IfStrictEqualForSimpleObjectsIncludingReadonlyAnalysis<{ readonly [K in Key]: T[K] }, { [K in Key]: T[K] }, ThenType, ElseType>

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/naming-convention
type _IfIsWritableKey<T extends AnyPlainObject, Key extends keyof T, ThenType, ElseType> =
	IfStrictEqualForSimpleObjectsIncludingReadonlyAnalysis<{ -readonly [K in Key]: T[K] }, { [K in Key]: T[K] }, ThenType, ElseType>

// prettier-ignore
type IfIsReadonlyKeyStrict<T extends AnyPlainObject, Key extends keyof T, ThenType, ElseType> =
	_IfIsReadonlyKey<T, Key, _IfIsWritableKey<T, Key, ElseType, ThenType>, ElseType>;

// prettier-ignore
export type IfIsReadonlyKey<T, Key extends AnyKey, ThenType, ElseType> =
	[T] extends [AnyPlainObject] ?
		[Key] extends [keyof T] ?
			IfIsReadonlyKeyStrict<T, Key, ThenType, ElseType>
		: ElseType
	: ElseType

/// export type GetReadonlyKeys<T extends AnyPlainObject> = { [K in keyof T]: IfIsReadonlyKeyStrict<T, K, K, never> }[keyof T];
/// export type GetWritableKeys<T extends AnyPlainObject> = { [K in keyof T]: IfIsReadonlyKeyStrict<T, K, never, K> }[keyof T];

/// export type IsReadonlyKey<T extends AnyPlainObject, Key extends keyof T> = IfIsReadonlyKeyStrict<T, Key, true, false>;
/// export type IsWritableKey<T extends AnyPlainObject, Key extends keyof T> = IfIsReadonlyKeyStrict<T, Key, false, true>;

/// // prettier-ignore
/// export type PlainObjectWithOnlyTheseKeysReadonly<T extends AnyPlainObject, KeysToBeReadonly extends keyof T> =
/// 	T extends any ?
/// 		Simplify<
/// 			{ readonly [K in KeysToBeReadonly]: T[K] } &
/// 			{ -readonly [K in Exclude<keyof T, KeysToBeReadonly>]: T[K] }
/// 		>
/// 	: never;
