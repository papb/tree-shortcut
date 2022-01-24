# tree-shortcut ![Build Status](https://github.com/papb/tree-shortcut/workflows/CI/badge.svg) [![install size](https://packagephobia.com/badge?p=tree-shortcut)](https://packagephobia.com/result?p=tree-shortcut)

> Simplify an object tree with a shortcut. TypeScript supported.

## Install

```
$ npm install tree-shortcut
```

## Purpose

This module allows you to simplify a tree structure (i.e., any recursive object/array structure) by replacing objects with the value of one of its keys. For example, you may want to convert `[{ a: 1, b: 2 }, { a: 3, d: 4 }]` into `[1, 3]` (replacing each object by its value on `'a'`).

This module provides a `treeShortcut` function that takes a tree and a simple _shortcut description_ and returns a deeply-cloned tree with a little change: the nested access of your choice is replaced by a shortcut. This allows you to simplify a complex tree of data, skipping information that you do not need.

The _shortcut description_ is a set of three strings:

-   `shortcutTriggerProp`: The name of the property in which the shortcut begins
-   `shortcutTargetProp`: The name of the nested property, target of the shortcut
-   `shortcutName`: The name of the new property that will replace `shortcutTriggerProp`, whose value will be the one of the target property.

The provided object is unchanged.

The example below will make this clear.

_You can also read the [detailed algorithm description](https://github.com/papb/tree-shortcut#detailed-algorithm-description) if you want._

## Example

```js
const treeShortcut = require('tree-shortcut');

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

const newTree = treeShortcut(tree, 'foo', 'bar', 'foobar');

console.log(newTree);
//=> {
//     items: [
//         {
//             foobar: [1, 2, 3]
//         },
//         {
//             foobar: [4, 5]
//         },
//         {
//             foobar: undefined
//         },
//         {
//             foobar: undefined
//         }
//     ]
// }
```

## API

### treeShortcut(tree, shortcutTriggerProp, shortcutTargetProp, shortcutName)

#### tree

Type: Anything

If it is indeed a tree (i.e. an array or plain object), it will be copied and modified with the shortcut. Otherwise, it will be returned unchanged.

#### shortcutTriggerProp

Type: `string`

The name of the prop which will trigger the shortcut.

#### shortcutTargetProp

Type: `string`

The name of the child prop which will be used as target of the shortcut.

#### shortcutName

Type: `string`

The name of the new prop to replace the `shortcutTriggerProp` in the parent object where the shortcut was triggered.

## Detailed algorithm description

The `treeShortcut(tree, shortcutTriggerProp, shortcutTargetProp, shortcutName)` will do the following:

1.  If `tree` is an array, shallow-clone it and recurse on each element. Otherwise:
2.  If `tree` is not a plain object, just return the input (`tree`) unchanged. Otherwise:
3.  If `tree` does not have a key named `shortcutTriggerProp`, shallow-clone it and recurse on each key-value pair. Otherwise:
4.  Shallow-clone the `tree` object into `tree_clone`;
5.  If `tree_clone` has a key named `shortcutName`, delete it;
6.  For each (shallow) property in `tree_clone`:

    -   If its name is `shortcutTriggerProp`, rename it to `shortcutName` and then:

        a. If its `value` is a plain object, replace it with `value[shortcutTargetProp]`. Otherwise:

        b. If its `value` is an array, recurse on its elements running steps `a`, `b` and `c`. Otherwise:

        c. If its `value` is neither an array nor a plain object, replace it with `undefined`.

        -   Example: `{ a: 1 }` becomes `value[shortcutTargetProp]`;
        -   Example: `[{ a: 1 }, { a: 2 }]` becomes `[value[0][shortcutTargetProp], value[1][shortcutTargetProp]]`;
        -   Example: `[{ a: 1 }, 2]` becomes `[value[0][shortcutTargetProp], undefined]`;
        -   Example: `[null, undefined, new Date()]` becomes `[undefined, undefined, undefined]`;

    -   Otherwise, recurse (i.e. call `treeShortcut`) on the value of the property;

7.  Return `tree_clone`.

## TypeScript support

This module supports TypeScript by default. The return type of the `treeShortcut` method is properly constructed.

Note: the new shortcut property will be set to `readonly` if (and only if) the inner property was `readonly`. If the inner property was deep into an array, the new shortcut property will be set to `readonly` if (and only if) the inner property was `readonly` on all leaves of that array.

Example:

```ts
import treeShortcut = require('tree-shortcut');

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

const newTree = treeShortcut(tree, 'foo', 'bar', 'foobar');
type NewTreeType = typeof newTree;
//=> {
//     items: Array<{ foobar: number[] | undefined }>;
// }

const tree2 = {
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

const newTree2 = treeShortcut(tree2, 'foo', 'bar', 'foobar');
type NewTree2Type = typeof newTree2;
//=> {
//     readonly items: readonly [{
//         readonly foobar: readonly [1, 2, 3];
//     }, {
//         readonly foobar: readonly [4, 5];
//     }, {
//         foobar: undefined;
//     }, {
//         foobar: undefined;
//     }];
// }
```

## Related

-   [`direct-deep-map`](https://github.com/papb/direct-deep-map): Deep map values in a tree directly on the desired places, with strong TypeScript support. Original tree is unchanged.

## License

MIT © [Pedro Augusto de Paula Barbosa](https://github.com/papb)
