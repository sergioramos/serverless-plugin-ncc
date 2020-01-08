"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseServiceConfig;

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function parseServiceConfig(serverless) {
  const individually = !!_lodash.default.get(serverless, 'service.package.individually');

  if (individually) {
    return packageIndividually(serverless);
  }

  return packageAllTogether(serverless);
}

function packageIndividually(_x) {
  return _packageIndividually.apply(this, arguments);
}

function _packageIndividually() {
  _packageIndividually = _asyncToGenerator(function* (serverless) {
    const {
      servicePath
    } = serverless.config; // @ts-ignore

    const functions = serverless.service.functions;

    const serviceFilesConfigArrPromises = _lodash.default.map(functions,
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(function* ({
        name: serviceName,
        handler,
        custom = {}
      }, functionName) {
        if (custom && custom.ncc && custom.ncc.enabled === false) {
          return;
        }

        const {
          name: fileName,
          absPath: filePath
        } = yield (0, _utils.handlerToFileDetails)(servicePath, handler);
        const zipName = `${serviceName}.zip`;

        const zipPath = _path.default.join(servicePath, `.serverless/${zipName}`);

        return {
          perFunctionNccConfig: _lodash.default.get(custom, 'ncc', {}),
          functionName,
          zip: {
            absPath: zipPath,
            name: zipName
          },
          files: [{
            name: fileName,
            absPath: filePath
          }]
        };
      });

      return function (_x3, _x4) {
        return _ref.apply(this, arguments);
      };
    }());

    const serviceFilesConfigArr = yield Promise.all(serviceFilesConfigArrPromises);
    return serviceFilesConfigArr.filter(Boolean);
  });
  return _packageIndividually.apply(this, arguments);
}

function packageAllTogether(_x2) {
  return _packageAllTogether.apply(this, arguments);
}

function _packageAllTogether() {
  _packageAllTogether = _asyncToGenerator(function* (serverless) {
    const {
      servicePath
    } = serverless.config;
    const zipName = `${serverless.service.getServiceName()}.zip`;

    const zipPath = _path.default.join(servicePath, `.serverless/${zipName}`); // @ts-ignore


    const functions = Object.values(serverless.service.functions);
    const filesPromises = functions.map(
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(function* ({
        handler
      }) {
        const {
          name,
          absPath
        } = yield (0, _utils.handlerToFileDetails)(servicePath, handler);
        return {
          name,
          absPath
        };
      });

      return function (_x5) {
        return _ref2.apply(this, arguments);
      };
    }());
    const files = yield Promise.all(filesPromises);
    return [{
      zip: {
        name: zipName,
        absPath: zipPath
      },
      files
    }];
  });
  return _packageAllTogether.apply(this, arguments);
}

module.exports = exports.default;
//# sourceMappingURL=parse-service-config.js.map