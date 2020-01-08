"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createZip;

var _fs = _interopRequireDefault(require("fs"));

var _archiver = _interopRequireDefault(require("archiver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function createZip(_x) {
  return _createZip.apply(this, arguments);
}

function _createZip() {
  _createZip = _asyncToGenerator(function* ({
    zipPath,
    zipContents
  }) {
    const zipStream = _fs.default.createWriteStream(zipPath);

    const archive = (0, _archiver.default)('zip', {
      zlib: {
        level: 9
      }
    });
    return new Promise((resolve, reject) => {
      // listen for all archive data to be written
      // 'close' event is fired only when a file descriptor is involved
      zipStream.on('close', () => {
        const totalBytes = archive.pointer();
        console.log(`${totalBytes} total bytes`);
        console.log('archiver has been finalized and the output file descriptor has closed.');
        resolve({
          totalBytes
        });
      }); // This event is fired when the data source is drained no matter what was the data source.
      // It is not part of this library but rather from the NodeJS Stream API.
      // @see: https://nodejs.org/api/stream.html#stream_event_end

      zipStream.on('end', () => {
        console.log('Data has been drained');
      }); // good practice to catch warnings (ie stat failures and other non-blocking errors)

      archive.on('warning', err => {
        if (err.code === 'ENOENT') {// log warning
        } else {
          // throw error
          throw err;
        }
      }); // good practice to catch this error explicitly

      archive.on('error', err => {
        console.error('archive error', err);
        reject(err);
      }); // pipe archive data to the file

      archive.pipe(zipStream);

      for (const zipContent of zipContents) {
        archive.append(zipContent.data, {
          name: zipContent.name,
          mode: zipContent.mode
        });
      }

      archive.finalize();
    });
  });
  return _createZip.apply(this, arguments);
}

module.exports = exports.default;
//# sourceMappingURL=zipper.js.map