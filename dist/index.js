"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _makeDir = _interopRequireDefault(require("make-dir"));

var _fs = require("mz/fs");

var _compiler = _interopRequireDefault(require("./compiler"));

var _parseServiceConfig = _interopRequireDefault(require("./parse-service-config"));

var _zipper = _interopRequireDefault(require("./zipper"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class ServerlessPlugin {
  constructor(serverless, options) {
    _defineProperty(this, "serverless", void 0);

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "hooks", void 0);

    this.serverless = serverless;
    this.options = options;
    this.hooks = {
      'before:package:createDeploymentArtifacts': this.package.bind(this),
      'before:package:finalize': this.packageFinalize.bind(this)
    };
  }

  packageFinalize() {
    this.serverless.cli.log('packageFinalize');
  }

  package() {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.serverless.cli.log('running ncc');

      const {
        servicePath
      } = _this.serverless.config;
      const slsService = _this.serverless.service;
      const globalNccConfig = slsService && slsService.custom && slsService.custom.ncc || {};

      const dotServerlessPath = _path.default.join(servicePath, '.serverless');

      yield (0, _makeDir.default)(dotServerlessPath);
      const packageFilesConfig = yield (0, _parseServiceConfig.default)(_this.serverless);
      const packagingPromises = packageFilesConfig.filter(Boolean).map(
      /*#__PURE__*/
      function () {
        var _ref = _asyncToGenerator(function* (pkg) {
          const {
            zip,
            files,
            perFunctionNccConfig = {}
          } = pkg;
          const nccConfig = Object.assign({}, globalNccConfig, perFunctionNccConfig);
          const {
            includeAssets = []
          } = nccConfig; // For now pass all ncc options directly to ncc. This has the benefit of testing out new
          // ncc releases and changes quickly. Later it would be nice to add a validation step in between.

          const codeCompilePromises = files.map(({
            absPath
          }) => (0, _compiler.default)(_objectSpread({
            inputFilePath: absPath
          }, nccConfig)));
          const compiledCodes = yield Promise.all(codeCompilePromises);
          const compiledAssets = yield Promise.all(includeAssets.map(
          /*#__PURE__*/
          function () {
            var _ref2 = _asyncToGenerator(function* (name) {
              const fullpath = _path.default.join(servicePath, name);

              return {
                name,
                source: yield (0, _fs.readFile)(fullpath),
                permissions: (yield (0, _fs.stat)(fullpath)).mode
              };
            });

            return function (_x2) {
              return _ref2.apply(this, arguments);
            };
          }()));
          const zipperFiles = createZipperFiles(files, compiledCodes, compiledAssets.filter(Boolean));
          yield (0, _zipper.default)({
            zipPath: zip.absPath,
            zipContents: zipperFiles
          });
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
      setArtifacts(_this.serverless, packageFilesConfig);
      yield Promise.all(packagingPromises);
      return undefined;
    })();
  }

}

exports.default = ServerlessPlugin;

function createZipperFiles(files, compiledCodes, compiledAssets = []) {
  if (files.length !== compiledCodes.length) {
    throw new Error('Expecting NCC output for all files.');
  }

  const content = [];
  compiledAssets.forEach(({
    name,
    source,
    permissions
  }) => {
    return content.push({
      name,
      mode: permissions,
      data: source
    });
  });
  files.forEach((file, index) => {
    const compilerOutput = compiledCodes[index];
    content.push({
      data: compilerOutput.code,
      // here we're replacing files with `.ts` extensions to `.js`
      // as the `data` in the above live will already be a compiled JS file
      name: file.name.replace(/.ts$/, '.js')
    });

    if (compilerOutput.map) {
      content.push({
        data: compilerOutput.map,
        // Make sure to rename the map the same way as the compiled output.
        name: file.name.replace(/.ts$/, '.map.js')
      });
    }

    if (compilerOutput.assets) {
      // Assets are relative to the 'code' file. But because of keeping the file
      // structure in the zip output all assets need to be written to the same directory.
      // The 'lastIndexOf() + 1' makes sure to keep the trailing slash.
      const path = file.name.substring(0, file.name.lastIndexOf('/') + 1);
      Object.keys(compilerOutput.assets).forEach(assetName => {
        if (!Object.prototype.hasOwnProperty.call(compilerOutput.assets, assetName)) {
          return;
        }

        content.push({
          data: compilerOutput.assets[assetName].source,
          name: `${path}${assetName}`,
          mode: compilerOutput.assets[assetName].permissions
        });
      });
    }
  });
  return content;
}

function setArtifacts(serverless, serviceFilesConfigArr) {
  const individually = !!_lodash.default.get(serverless, 'service.package.individually');

  if (!individually) {
    _lodash.default.set(serverless, 'service.package.artifact', serviceFilesConfigArr[0].zip.absPath);
  } else {
    for (const cnf of serviceFilesConfigArr) {
      if (!cnf) {
        continue;
      }

      const {
        functionName,
        zip
      } = cnf;

      if (!functionName) {
        throw new Error('functionName cannot be empty when packaging individually');
      }

      const slsFunction = serverless.service.getFunction(functionName);

      _lodash.default.set(slsFunction, 'package.artifact', zip.absPath);
    }
  }
}

module.exports = exports.default;
//# sourceMappingURL=index.js.map