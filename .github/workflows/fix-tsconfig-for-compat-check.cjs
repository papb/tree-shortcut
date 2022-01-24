const JSON5 = require('json5');
const fs = require('fs');

const tsconfig = JSON5.parse(fs.readFileSync('original-tsconfig.json', 'utf8'));

delete tsconfig.compilerOptions.exactOptionalPropertyTypes;
delete tsconfig.compilerOptions.noFallthroughCasesInSwitch;
delete tsconfig.compilerOptions.noImplicitOverride;
delete tsconfig.compilerOptions.noImplicitReturns;
delete tsconfig.compilerOptions.noPropertyAccessFromIndexSignature;
delete tsconfig.compilerOptions.noUncheckedIndexedAccess;
delete tsconfig.compilerOptions.noUnusedLocals;
delete tsconfig.compilerOptions.noUnusedParameters;
delete tsconfig.compilerOptions.useUnknownInCatchVariables;

console.log(JSON.stringify(tsconfig, undefined, '\t'));
