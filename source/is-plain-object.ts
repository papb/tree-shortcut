import isPlainObject_ = require('is-plain-obj');

export type AnyPlainObject = Record<string | number | symbol, unknown>;

export function isPlainObject(value: any): value is AnyPlainObject {
	return isPlainObject_(value);
}
