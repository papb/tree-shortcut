import { isPlainObject, AnyPlainObject } from './is-plain-object';

type AnyArray = readonly any[];
type PropOrNever<O, Prop> = Prop extends string | number ? (O extends Record<Prop, any> ? O[Prop] : never) : never;
type PropOrUndef<O, Prop extends string> = O extends Record<Prop, any> ? O[Prop] : undefined;
type PropOrUndefEnteringArrayIfNeeded<O, Prop extends string> = O extends AnyArray
	? { [K in keyof O]: PropOrUndefEnteringArrayIfNeeded<O[K], Prop> }
	: PropOrUndef<O, Prop>;

type ReplaceInUnion<U, OldType, NewType> = OldType extends U ? Exclude<U, OldType> | NewType : U;

export type TreeShortcut<
	T,
	PropName extends string,
	InnerPropName extends string,
	ShortcutName extends string,
> =
	T extends any // Force distribution over unions
		? PropName extends keyof T
			? {
				[K in ReplaceInUnion<keyof T, PropName, ShortcutName>]: K extends ShortcutName
					? PropOrUndefEnteringArrayIfNeeded<T[PropName], InnerPropName>
					: TreeShortcut<PropOrNever<T, K>, PropName, InnerPropName, ShortcutName>;
			}
			: T extends AnyArray | AnyPlainObject
				// Due to the distribution above, here T will not be `AnyArray | AnyPlainObject`,
				// since if it were, it would have distributed. This is important since
				// `keyof ([1] | { a: 1 })` is `never`, while we want a distribution over `0` and `'a'`
				? { [K in keyof T]: TreeShortcut<T[K], PropName, InnerPropName, ShortcutName> }
				: T
		: never;

function pick(tree: any, field: string): any {
	if (Array.isArray(tree)) return tree.map(x => pick(x, field));
	if (!isPlainObject(tree)) return tree;
	return tree[field];
}

function treeShortcutHelper(tree: any, from: string, to: string, name: string): any {
	if (Array.isArray(tree)) return tree.map(x => treeShortcutHelper(x, from, to, name));
	if (!isPlainObject(tree)) return tree;

	const keys = Object.keys(tree);
	const result: any = {};

	for (const key of keys) {
		if (key !== from) {
			result[key] = treeShortcutHelper(tree[key], from, to, name);
		}
	}

	if (keys.includes(from)) {
		result[name] = pick(tree[from], to);
	}

	return result;
}

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
