const extraIgnorePatterns = ['/dist'];

const eslintrc = require('@papb/linter').eslintrc();
eslintrc.ignorePatterns = [...eslintrc.ignorePatterns, ...extraIgnorePatterns];
module.exports = eslintrc;
