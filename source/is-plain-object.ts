import isPlainObject_ = require('is-plain-obj');

export function isPlainObject(value: any): value is Record<string | number | symbol, unknown> {
	return isPlainObject_(value);
}
