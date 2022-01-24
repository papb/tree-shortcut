import test from 'ava';
import { expectTypeOf } from 'expect-type';
import cloneDeep = require('lodash.clonedeep');
import isPlainObject = require('is-plain-obj');
import treeShortcut = require('../source');
import { TreeShortcut } from '../source/core';

test('`is-plain-obj` sanity check', t => {
	t.true(isPlainObject({}));
	t.false(isPlainObject(null));
	t.false(isPlainObject([]));
	t.false(isPlainObject(new Date()));
});

test('Basic usage', t => {
	const tree = {
		items: [
			{
				foo: { bar: [1, 2, 3] },
			},
			{
				foo: { bar: [4, 5], baz: true },
			},
			{
				foo: { baz: false },
			},
			{
				foo: null,
			},
		],
	};

	const result = treeShortcut(tree, 'foo', 'bar', 'foobar');

	const expectedResult = {
		items: [
			{
				foobar: [1, 2, 3],
			},
			{
				foobar: [4, 5],
			},
			{
				foobar: undefined,
			},
			{
				foobar: undefined,
			},
		],
	};

	expectTypeOf(result).toEqualTypeOf(expectedResult);
	expectTypeOf(result).toEqualTypeOf<{ items: Array<{ foobar: number[] | undefined }> }>();

	t.deepEqual(result, expectedResult);

	// Since `deepEqual` above does not differ `undefined` from missing, we do extra checks:
	t.is('foobar' in result.items[2]!, true);
	t.is('foobar' in result.items[3]!, true);
});

test('Basic usage with `as const`', t => {
	const tree = {
		items: [
			{
				foo: { bar: [1, 2, 3] },
			},
			{
				foo: { bar: [4, 5], baz: true },
			},
			{
				foo: { baz: false },
			},
			{
				foo: null,
			},
		],
	} as const;

	const result = treeShortcut(tree, 'foo', 'bar', 'foobar');

	const expectedResult: {
		readonly items: readonly [
			{
				readonly foobar: readonly [1, 2, 3];
			},
			{
				readonly foobar: readonly [4, 5];
			},
			{
				foobar: undefined;
			},
			{
				foobar: undefined;
			},
		];
	} = {
		items: [
			{
				foobar: [1, 2, 3],
			},
			{
				foobar: [4, 5],
			},
			{
				foobar: undefined,
			},
			{
				foobar: undefined,
			},
		],
	};

	expectTypeOf(result).toEqualTypeOf(expectedResult);

	t.deepEqual(result, expectedResult);

	// Since `deepEqual` above does not differ `undefined` from missing, we do extra checks:
	t.is('foobar' in result.items[2], true);
	t.is('foobar' in result.items[3], true);
});

test('Types are OK', t => {
	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: 123 }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bar', 'foo'>>()
		.toEqualTypeOf<{ foo: 123 }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bar', 'bar'>>()
		.toEqualTypeOf<{ bar: 123 }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: { foo: { bar: 123 } } } }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: { foo: { bar: 123 } } }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'aaa', 'bbb', 'ccc'>>()
		.toEqualTypeOf<{ foo: { bar: 123 } }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bbb', 'ccc'>>()
		.toEqualTypeOf<{ ccc: undefined }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: ReadonlyArray<{ bar: number }> }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: readonly number[] }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: 123; baz: 456 }; qux: 0 }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: 123; qux: 0 }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: 123; baz: 456 }; baz: 0 }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: 123 }>();

	type EmptyObject = Record<any, never>;

	// prettier-ignore
	expectTypeOf<TreeShortcut<[5, { foo: 'bar'; b: { c: [3, 4, EmptyObject] } }], 'b', 'c', 'x'>>()
		.toEqualTypeOf<[5, { foo: 'bar'; x: [3, 4, EmptyObject] }]>();

	t.pass();
});

test('Usage with crazy tree', t => {
	const crazyTree = [
		[{ a: { b: [[{ c: { d: [{ e: 1 }] } }]] } }],
		[true],
		{ foo: 'bar', b: { c: [3, 4, {}] } },
		[[[{ a: [{ b: { c: { d: [{}] } } }] }]]],
	];

	const crazyTreeConst = [
		[{ a: { b: [[{ c: { d: [{ e: 1 }] } }]] } }],
		[true],
		{ foo: 'bar', b: { c: [3, 4, {}] } },
		[[[{ a: [{ b: { c: { d: [{}] } } }] }]]],
	] as const;

	const newTree = treeShortcut(crazyTree, 'b', 'c', 'x');
	const newTreeConst = treeShortcut(crazyTreeConst, 'b', 'c', 'x');

	// prettier-ignore
	const expectedNewTree = [
		[{ a: { x: [[{ d: [{ e: 1 }] }]] } }],
		[true],
		{ foo: 'bar', x: [3, 4, {}] },
		[[[{ a: [{ x: { d: [{}] } }] }]]],
	];

	const expectedNewTreeConst = [
		[{ a: { x: [[{ d: [{ e: 1 }] }]] } }],
		[true],
		{ foo: 'bar', x: [3, 4, {}] },
		[[[{ a: [{ x: { d: [{}] } }] }]]],
	] as const;

	expectTypeOf(newTree).toEqualTypeOf(expectedNewTree);
	t.deepEqual(newTree, expectedNewTree);

	expectTypeOf(newTreeConst).toEqualTypeOf(expectedNewTreeConst);
	t.deepEqual(newTreeConst, expectedNewTreeConst);
});

test('Infers readonly modifier correctly', t => {
	type Tree0 = {
		a: [{ b: 1 }, { b: 2 }, { b: 3 }];
	};

	type Tree1 = {
		a: [{ readonly b: 1 }, { readonly b: 2 }, { readonly b: 3 }];
	};

	type Tree2 = {
		a: [{ readonly b: 1 }, { b: 2 }, { readonly b: 3 }];
	};

	type Tree3 = {
		a: [{ readonly b: 1 }, { readonly b: 2 }, { c: 3 }];
	};

	type Tree4 = {
		a: [{ readonly b: 1 }, { readonly b: 2 }, 123];
	};

	const tree0 = 0 as unknown as Tree0;
	const tree1 = 0 as unknown as Tree1;
	const tree2 = 0 as unknown as Tree2;
	const tree3 = 0 as unknown as Tree3;
	const tree4 = 0 as unknown as Tree4;

	const newTree0 = treeShortcut(tree0, 'a', 'b', 'foo');
	const newTree1 = treeShortcut(tree1, 'a', 'b', 'foo');
	const newTree2 = treeShortcut(tree2, 'a', 'b', 'foo');
	const newTree3 = treeShortcut(tree3, 'a', 'b', 'foo');
	const newTree4 = treeShortcut(tree4, 'a', 'b', 'foo');

	expectTypeOf(newTree0).toEqualTypeOf<{ foo: [1, 2, 3] }>();
	expectTypeOf(newTree1).toEqualTypeOf<{ readonly foo: [1, 2, 3] }>();
	expectTypeOf(newTree2).toEqualTypeOf<{ foo: [1, 2, 3] }>();
	expectTypeOf(newTree3).toEqualTypeOf<{ foo: [1, 2, undefined] }>();
	expectTypeOf(newTree4).toEqualTypeOf<{ foo: [1, 2, undefined] }>();

	t.pass();
});

test('Does not modify input', t => {
	const tree1 = [
		[{ a: { b: [[{ c: { d: [{ e: 1 }] } }]] } }],
		[true],
		{ foo: 'bar', b: { c: [3, 4, {}] } },
		[[[{ a: [{ b: { c: { d: [{}] } } }] }]]],
	];

	const tree2 = { aa: 1, bb: cloneDeep(tree1), cc: { dd: null } };

	const tree1memo = cloneDeep(tree1);
	const tree2memo = cloneDeep(tree2);

	const tree1output = treeShortcut(tree1, 'b', 'c', 'x');
	const tree2output = treeShortcut(tree2, 'b', 'c', 'x');

	// Sanity check for the test
	t.notDeepEqual(tree1output, tree1memo as any);
	t.notDeepEqual(tree2output, tree2memo as any);

	// Real test
	t.deepEqual(tree1, tree1memo);
	t.deepEqual(tree2, tree2memo);
});

test('Does not mess with non-plain objects', t => {
	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: { bar: Date }; qux: Date }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: Date; qux: Date }>();

	const date = new Date();

	const tree = [{ a: date, b: null, c: undefined, d: 4, e: { f: date } }];
	const expected = [{ a: date, b: null, c: undefined, d: 4, x: date }];

	const result = treeShortcut(tree, 'e', 'f', 'x');
	t.deepEqual(result, expected);

	// Since `deepEqual` above does not differ `undefined` from missing, we do an extra test
	t.is('c' in result[0]!, true);
});

test('Drops non-plain objects to undefined upon shortcutting', t => {
	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: 1 }, 'foo', 'whatever', 'bar'>>()
		.toEqualTypeOf<{ bar: undefined }>();

	// prettier-ignore
	expectTypeOf<TreeShortcut<{ foo: Date }, 'foo', 'setTime', 'bar'>>()
		.toEqualTypeOf<{ bar: undefined }>();

	const date = new Date();

	const tree = [{ foo: [1, { setTime: 2 }, date] }, date, 9];
	const expected = [{ baz: [undefined, 2, undefined] }, date, 9];

	const result = treeShortcut(tree, 'foo', 'setTime', 'baz');
	t.deepEqual(result, expected);
});

test('Leaves non-trees untouched', t => {
	expectTypeOf<TreeShortcut<Date, 'foo', 'bar', 'baz'>>().toEqualTypeOf<Date>();

	expectTypeOf<TreeShortcut<number, 'foo', 'bar', 'baz'>>().toEqualTypeOf<number>();

	// eslint-disable-next-line @typescript-eslint/ban-types
	expectTypeOf<TreeShortcut<null, 'foo', 'bar', 'baz'>>().toEqualTypeOf<null>();

	expectTypeOf<TreeShortcut<undefined, 'foo', 'bar', 'baz'>>().toEqualTypeOf<undefined>();

	const date = new Date();
	t.is(treeShortcut(date, 'a', 'b', 'c'), date);

	t.is(treeShortcut(true, 'a', 'b', 'c'), true);
	t.is(treeShortcut(null, 'a', 'b', 'c'), null);
	t.is(treeShortcut(undefined, 'a', 'b', 'c'), undefined); // eslint-disable-line @typescript-eslint/no-confusing-void-expression
	t.is(treeShortcut(0, 'a', 'b', 'c'), 0);
	t.is(treeShortcut('hello', 'a', 'b', 'c'), 'hello');
});
