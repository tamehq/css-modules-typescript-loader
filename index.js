const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

const bannerMessage =
  '// This file is automatically generated by css-modules-typescript-loader.\n// Please do not change this file!';

const getNoDeclarationFileError = cssModuleInterfaceFilename =>
  new Error(
    `Generated type declaration does not exist. Run webpack and commit the type declaration for '${cssModuleInterfaceFilename}'`
  );

const getTypeMismatchError = cssModuleInterfaceFilename =>
  new Error(
    `Generated type declaration file is outdated. Run webpack and commit the updated type declaration for '${cssModuleInterfaceFilename}'`
  );

const cssModuleToNamedExports = cssModuleKeys => {
  return cssModuleKeys.map(key => `export const ${key}: string;`).join('\n');
};

const filenameToTypingsFilename = filename => {
  const dirName = path.dirname(filename);
  const baseName = path.basename(filename);
  return path.join(dirName, `${baseName}.d.ts`);
};

const generateNamedExports = cssModuleKeys => {
  const namedExports = cssModuleToNamedExports(cssModuleKeys);
  return `${namedExports}
`;
};

const validModes = ['emit', 'verify'];

module.exports = function(content, ...rest) {
  const callback = this.async();

  const filename = this.resourcePath;
  const { mode = 'emit' } = loaderUtils.getOptions(this) || {};
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode option: ${mode}`);
  }

  const cssModuleInterfaceFilename = filenameToTypingsFilename(filename);

  const keyRegex = /"([^\\"]+)":/g;
  let match;
  const cssModuleKeys = [];

  while ((match = keyRegex.exec(content))) {
    if (cssModuleKeys.indexOf(match[1]) < 0) {
      cssModuleKeys.push(match[1]);
    }
  }

  cssModuleDefinition = `${bannerMessage}\n${generateNamedExports(
    cssModuleKeys
  )}`;

  if (mode === 'verify') {
    fs.readFile(
      cssModuleInterfaceFilename,
      { encoding: 'utf-8' },
      (err, fileContents) => {
        if (err) {
          const error =
            err.code === 'ENOENT'
              ? getNoDeclarationFileError(cssModuleInterfaceFilename)
              : err;
          return callback(error);
        }

        if (cssModuleDefinition !== fileContents) {
          return callback(getTypeMismatchError(cssModuleInterfaceFilename));
        }

        return callback(null, content, ...rest);
      }
    );
  } else {
    fs.writeFile(
      cssModuleInterfaceFilename,
      cssModuleDefinition,
      { encoding: 'utf-8' },
      err => {
        if (err) {
          return callback(err);
        } else {
          return callback(null, content, ...rest);
        }
      }
    );
  }
};