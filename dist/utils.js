"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.doesFileExist = doesFileExist;
exports.handlerToFileDetails = handlerToFileDetails;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function doesFileExist(absFilePath) {
  return new Promise(resolve => {
    _fs.default.exists(absFilePath, resolve);
  });
}
/**
 * Takes the serverless.yml dir as the `serviceRoot` and the handler string that we specify in serverless.yml as `handler`
 * @example
 handlerFileDetails('/home/ubuntu/backend', 'src/index.handler');
 // {name: 'src/index.js', absPath: '/home/ubuntu/backend/src/index.js'}
 ```
 */


function handlerToFileDetails(_x, _x2) {
  return _handlerToFileDetails.apply(this, arguments);
}

function _handlerToFileDetails() {
  _handlerToFileDetails = _asyncToGenerator(function* (serviceRoot, handler) {
    const lastDotIndex = handler.lastIndexOf('.');
    if (!lastDotIndex) throw new Error('invalid handler name');
    const fileNameWithoutExt = handler.substring(0, lastDotIndex);
    const tsFileName = `${fileNameWithoutExt}.ts`;

    const tsFilePath = _path.default.join(serviceRoot, tsFileName);

    const tsFileExists = yield doesFileExist(tsFilePath);
    if (tsFileExists) return {
      name: tsFileName,
      absPath: tsFilePath
    };
    const jsFileName = `${fileNameWithoutExt}.js`;

    const jsFilePath = _path.default.join(serviceRoot, jsFileName);

    return {
      name: jsFileName,
      absPath: jsFilePath
    };
  });
  return _handlerToFileDetails.apply(this, arguments);
}