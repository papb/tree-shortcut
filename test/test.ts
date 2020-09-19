import test from 'ava';
import { expectTypeOf } from 'expect-type';
import cloneDeep = require('lodash.clonedeep');
import { isPlainObject } from '../source/is-plain-object';
import treeShortcut = require('../source');
import { TreeShortcut } from '../source/core';

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
		],
	} as const;

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
		],
	} as const;

	expectTypeOf(result).toEqualTypeOf(expectedResult);

	t.deepEqual(result, expectedResult);

	// Since `deepEqual` above does not differ `undefined` from missing, we do an extra test
	t.is('foobar' in result.items[2], true);
});

test('Types are OK', t => {
	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: 123 }>();

	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bar', 'foo'>>()
		.toEqualTypeOf<{ foo: 123 }>();

	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bar', 'bar'>>()
		.toEqualTypeOf<{ bar: 123 }>();

	expectTypeOf<TreeShortcut<{ foo: { bar: { foo: { bar: 123 } } } }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: { foo: { bar: 123 } } }>();

	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'aaa', 'bbb', 'ccc'>>()
		.toEqualTypeOf<{ foo: { bar: 123 } }>();

	expectTypeOf<TreeShortcut<{ foo: { bar: 123 } }, 'foo', 'bbb', 'ccc'>>()
		.toEqualTypeOf<{ ccc: undefined }>();

	expectTypeOf<TreeShortcut<{ foo: ReadonlyArray<{ bar: number }> }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: readonly number[] }>();

	expectTypeOf<TreeShortcut<{ foo: { bar: 123; baz: 456 }; qux: 0 }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: 123; qux: 0 }>();

	expectTypeOf<TreeShortcut<{ foo: { bar: 123; baz: 456 }; baz: 0 }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: 123 }>();

	type EmptyObject = Record<any, never>;

	expectTypeOf<TreeShortcut<[5, { foo: 'bar'; b: { c: [3, 4, EmptyObject] } }], 'b', 'c', 'x'>>()
		.toEqualTypeOf<[5, { foo: 'bar'; x: [3, 4, EmptyObject] }]>();

	t.pass();
});

test('Usage with crazy tree', t => {
	const crazyTree = [
		[
			{ a: { b: [[{ c: { d: [{ e: 1 }] } }]] } },
		],
		[true],
		{ foo: 'bar', b: { c: [3, 4, {}] } },
		[[[
			{ a: [{ b: { c: { d: [{}] } } }] },
		]]],
	];

	const crazyTreeConst = [
		[
			{ a: { b: [[{ c: { d: [{ e: 1 }] } }]] } },
		],
		[true],
		{ foo: 'bar', b: { c: [3, 4, {}] } },
		[[[
			{ a: [{ b: { c: { d: [{}] } } }] },
		]]],
	] as const;

	const newTree = treeShortcut(crazyTree, 'b', 'c', 'x');
	const newTreeConst = treeShortcut(crazyTreeConst, 'b', 'c', 'x');

	const expectedNewTree = [
		[
			{ a: { x: [[{ d: [{ e: 1 }] }]] } },
		],
		[true],
		{ foo: 'bar', x: [3, 4, {}] },
		[[[
			{ a: [{ x: { d: [{}] } }] },
		]]],
	];

	const expectedNewTreeConst = [
		[
			{ a: { x: [[{ d: [{ e: 1 }] }]] } },
		],
		[true],
		{ foo: 'bar', x: [3, 4, {}] },
		[[[
			{ a: [{ x: { d: [{}] } }] },
		]]],
	] as const;

	expectTypeOf(newTree).toEqualTypeOf(expectedNewTree);
	t.deepEqual(newTree, expectedNewTree);

	expectTypeOf(newTreeConst).toEqualTypeOf(expectedNewTreeConst);
	t.deepEqual(newTreeConst, expectedNewTreeConst);
});

test('Does not modify input', t => {
	const tree1 = [
		[
			{ a: { b: [[{ c: { d: [{ e: 1 }] } }]] } },
		],
		[true],
		{ foo: 'bar', b: { c: [3, 4, {}] } },
		[[[
			{ a: [{ b: { c: { d: [{}] } } }] },
		]]],
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
	expectTypeOf<TreeShortcut<{ foo: { bar: Date }; qux: Date }, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<{ baz: Date; qux: Date }>();

	const date = new Date();

	// `is-plain-object` sanity check
	t.true(isPlainObject({}));
	t.false(isPlainObject(null));
	t.false(isPlainObject(date));

	const tree = [{ a: date, b: null, c: undefined, d: 4, e: { f: date } }];
	const expected = [{ a: date, b: null, c: undefined, d: 4, x: date }];

	t.deepEqual(
		treeShortcut(tree, 'e', 'f', 'x'),
		expected,
	);
});

test('Leaves non-trees untouched', t => {
	expectTypeOf<TreeShortcut<Date, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<Date>();

	expectTypeOf<TreeShortcut<number, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<number>();

	expectTypeOf<TreeShortcut<null, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<null>();

	expectTypeOf<TreeShortcut<undefined, 'foo', 'bar', 'baz'>>()
		.toEqualTypeOf<undefined>();

	const date = new Date();
	t.is(treeShortcut(date, 'a', 'b', 'c'), date);

	t.is(treeShortcut(true, 'a', 'b', 'c'), true);
	t.is(treeShortcut(null, 'a', 'b', 'c'), null);
	t.is(treeShortcut(undefined, 'a', 'b', 'c'), undefined);
	t.is(treeShortcut(0, 'a', 'b', 'c'), 0);
	t.is(treeShortcut('hello', 'a', 'b', 'c'), 'hello');
});
