import isPlainObject = require('is-plain-obj');

import type { AnyKey, AnyPlainObject, AnyArray, Simplify, IfExactlyTrue } from './basic-types';
import type { IfIsReadonlyKey } from './readonly-tricks';

type PropOrUndef<O, Prop extends string> = O extends Record<Prop, any> ? O[Prop] : undefined;

// prettier-ignore
type PropOrUndefEnteringArrayIfNeededButOnlyOnPlainObjects<O, Prop extends string> =
	O extends AnyArray ?
		{ [K in keyof O]: PropOrUndefEnteringArrayIfNeededButOnlyOnPlainObjects<O[K], Prop> }
	:
		O extends AnyPlainObject ? PropOrUndef<O, Prop> : undefined;

// prettier-ignore
type UnionOfDeepArrayValues<T> =
	T extends any ?
		T extends AnyArray ? UnionOfDeepArrayValues<T[number & keyof T]> : T
	: never

// prettier-ignore
type IfIsReadonlyKeyOnEachUnionItem<T, Key extends AnyKey, ThenType, ElseType> =
	IfExactlyTrue<T extends any ? IfIsReadonlyKey<T, Key, true, false> : never, ThenType, ElseType>;

// prettier-ignore
export type TreeShortcut<
	T,
	PropName extends string,
	InnerPropName extends string,
	ShortcutName extends string
> =
	T extends any ? // Force distribution over unions
		// Here T can't have the form `AnyArray | AnyPlainObject` or similar (because it was already distributed above). This is
		// important since `keyof ([1] | { a: 1 })` is `never`, while we want a distribution over `0` and `'a'`.
		T extends AnyPlainObject ?
			PropName extends keyof T ?
				Simplify<
					Omit<
						{
							// We need this trick with `Omit` and `never` values because this mapping must be homomorphic (`{ [K in keyof T]: ... }`).
							// Otherwise, even more gymnastics would be necessary.
							// See https://github.com/microsoft/TypeScript-Website/blob/f189f5bcb676dcf6ff04966192593fa40942c62f/packages/documentation/copy/en/reference/Advanced%20Types.md
							// That's why we can't just use `[K in Exclude<keyof T, PropName | ShortcutName>]:` directly.
							[K in keyof T]:
								K extends PropName | ShortcutName ?
									never
								:
									TreeShortcut<T[K], PropName, InnerPropName, ShortcutName>;
						},
						PropName | ShortcutName
					> &
					IfIsReadonlyKeyOnEachUnionItem<
						UnionOfDeepArrayValues<T[PropName]>,
						InnerPropName,
						// eslint-disable-next-line no-multi-spaces
						{  readonly [K in ShortcutName]: PropOrUndefEnteringArrayIfNeededButOnlyOnPlainObjects<T[PropName], InnerPropName> },
						{ -readonly [K in ShortcutName]: PropOrUndefEnteringArrayIfNeededButOnlyOnPlainObjects<T[PropName], InnerPropName> }
					>
				>
			:
				{ [K in keyof T]: TreeShortcut<T[K], PropName, InnerPropName, ShortcutName> }
		:
			T extends AnyArray ?
				{ [K in keyof T]: TreeShortcut<T[K], PropName, InnerPropName, ShortcutName> }
			:
				T
	:
		never

function deepPluckPlainObjects(tree: any, key: string): any {
	if (Array.isArray(tree)) return tree.map(x => deepPluckPlainObjects(x, key));
	if (!isPlainObject(tree)) return undefined; // Yield undefined on purpose on non-plain-objects, even though `Date` for example would have a `setTime` prop.
	return tree[key]; // May return undefined, which is the desired behavior if happens
}

function treeShortcutHelper(tree: any, from: string, to: string, name: string): any {
	if (Array.isArray(tree)) return tree.map(x => treeShortcutHelper(x, from, to, name));
	if (!isPlainObject(tree)) return tree;

	const keys = Object.keys(tree);
	const result: any = {};

	const hasFromKey = keys.includes(from);

	if (!hasFromKey) {
		// Just recurse.

		for (const key of keys) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			result[key] = treeShortcutHelper(tree[key], from, to, name);
		}

		return result;
	}

	// Recurse over the other keys.
	// Optimization: we don't need to visit `tree[name]` because it will be overwritten by the shortcut.
	for (const key of keys) {
		if (key !== from && key !== name) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			result[key] = treeShortcutHelper(tree[key], from, to, name);
		}
	}

	// Apply the shortcut.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	result[name] = deepPluckPlainObjects(tree[from], to);

	return result;
}

// prettier-ignore
export function treeShortcut<
	Tree,
	ShortcutTriggerProp extends string,
	ShortcutTargetProp extends string,
	ShortcutName extends string,
>(
	tree: Tree,
	shortcutTriggerProp: ShortcutTriggerProp,
	shortcutTargetProp: ShortcutTargetProp,
	shortcutName: ShortcutName,
): TreeShortcut<Tree, ShortcutTriggerProp, ShortcutTargetProp, ShortcutName> {
	return treeShortcutHelper(tree, shortcutTriggerProp, shortcutTargetProp, shortcutName);
}
