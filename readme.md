# tree-shortcut ![Build Status](https://github.com/papb/tree-shortcut/workflows/CI/badge.svg) [![install size](https://packagephobia.com/badge?p=tree-shortcut)](https://packagephobia.com/result?p=tree-shortcut)

> Simplify an object tree with a shortcut. TypeScript supported.


## Install

```
$ npm install tree-shortcut
```


## Purpose

This module provides a `treeShortcut` function that takes a tree (any recursive object/array structure) and a simple *shortcut description* and returns a deeply-cloned tree with a little change: the nested access of your choice is replaced by a shortcut. This allows you to simplify a complex tree of data, skipping information that you do not need.

The *shortcut description* is a set of three strings:

* `shortcutTriggerProp`: The name of the property in which the shortcut begins
* `shortcutTargetProp`: The name of the nested property, target of the shortcut
* `shortcutName`: The name of the new property that will replace `shortcutTriggerProp`, whose value will be the one of the target property.

The provided object is unchanged.

The example below will make this clear.


## Example

```js
const treeShortcut = require('tree-shortcut');

const tree = {
    items: [
        {
            foo: { bar: [1, 2, 3] }
        },
        {
            foo: { bar: [4, 5], baz: true }
        },
        {
            foo: { baz: false }
        }
    ]
}

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
//         }
//     ]
// }
```


## API

### treeShortcut(tree, shortcutTriggerProp, shortcutTargetProp, shortcutName)

#### tree

Type: Array or plain object

The tree to be copied and modified.

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

* Shallow-clone the `tree` object/array
* For each (shallow) property in the `tree`:
    * If its value is not an object (nor an array), do nothing;
    * Otherwise:
        * If its name is `shortcutTriggerProp`:
            * Change the property name to `shortcutName`
                * Note: if there was already a property named `shortcutName`, it would be overwritten
            * Change the property value from `value` to `value[shortcutTargetProp]`
        * Otherwise, repeat this algorithm recursively in the property value
* Return the cloned object/array


## TypeScript support

This module supports TypeScript by default. The return type of the `treeShortcut` method is properly constructed. Example:

```ts
import treeShortcut = require('tree-shortcut');

const tree = {
    items: [
        {
            foo: { bar: [1, 2, 3] }
        },
        {
            foo: { bar: [4, 5], baz: true }
        },
        {
            foo: { baz: false }
        }
    ]
};

const newTree = treeShortcut(tree, 'foo', 'bar', 'foobar');
type NewTreeType = typeof newTree;
//=> {
//     items: {
//         foobar: number[] | undefined;
//     }[];
// }

const tree2 = {
    items: [
        {
            foo: { bar: [1, 2, 3] }
        },
        {
            foo: { bar: [4, 5], baz: true }
        },
        {
            foo: { baz: false }
        }
    ]
} as const;

const newTree2 = treeShortcut(tree2, 'foo', 'bar', 'foobar');
type NewTree2Type = typeof newTree2;
//=> {
//     readonly items: readonly [{
//         foobar: readonly [1, 2, 3];
//     }, {
//         foobar: readonly [4, 5];
//     }, {
//         foobar: undefined;
//     }];
// }
```


## License

MIT © [Pedro Augusto de Paula Barbosa](https://github.com/papb)
