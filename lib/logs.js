const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const lib = {};

lib.baseDir = path.join(__dirname, "/../.logs/");

lib.append = function(file, string, cb) {
  fs.open(`${lib.baseDir}/${file}.log`, "a", function(err, fileDescriptor) {
    if (!err && fileDescriptor) {
      fs.appendFile(fileDescriptor, string + "\n", function(err) {
        if (!err) {
          fs.close(fileDescriptor, function(err) {
            if (!err) {
              cb(null);
            } else {
              cb("Could close the file that being appended");
            }
          });
        } else {
          cb("Could append the file");
        }
      });
    } else {
      cb("Could not open file for appending");
    }
  });
};

lib.list = function(includeCompressedLogs, cb) {
  fs.readdir(lib.baseDir, function(err, data) {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach(function(fileName) {
        if (fileName.indexOf(".log") > -1) {
          trimmedFileNames.push(fileName.replace(".log", ""));
        }
        if (fileName.indexOf(".gz.b64") > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace(".gz.b64", ""));
        }
      });
      cb(null, trimmedFileNames);
    } else {
      cb(err, data);
    }
  });
};

lib.compress = function(logId, newFileId, cb) {
  const sourceFile = logId + ".log";
  const destinationFile = newFileId + ".gz.b64";
  fs.readFile(`${lib.baseDir}/${sourceFile}`, "utf8", function(
    err,
    inputString
  ) {
    if (!err && inputString) {
      zlib.gzip(inputString, function(err, buffer) {
        if (!err && buffer) {
          fs.open(`${lib.baseDir}/${destinationFile}`, "wx", function(
            err,
            fileDescriptor
          ) {
            if (!err && fileDescriptor) {
              fs.writeFile(fileDescriptor, buffer.toString("base64"), function(
                err
              ) {
                if (!err) {
                  fs.close(fileDescriptor, function(err) {
                    if (!err) {
                      cb(null);
                    } else {
                      cb(err);
                    }
                  });
                } else {
                  cb(err);
                }
              });
            } else {
              cb(err);
            }
          });
        } else {
          cb(err);
        }
      });
    } else {
      cb(err);
    }
  });
};

lib.decompress = function(fileId, cb) {
  const fileName = fileId + ".gz.b64";
  fs.readFile(`${lib.baseDir}/${fileName}`, "utf8", function(err, string) {
    if (!err && string) {
      const inputBuffer = Buffer.from(string, "base64");
      zlib.unzip(inputBuffer, function(err, buffer) {
        if (!err && buffer) {
          const string = buffer.toString();
          cb(null, string);
        } else {
          cb(err);
        }
      });
    } else {
      cb(err);
    }
  });
};

lib.truncate = function(logId, cb) {
  const fileName = logId + ".log";
  fs.truncate(`${lib.baseDir}/${fileName}`, 0, function(err) {
    if (!err) {
      cb(null);
    } else {
      cb(err);
    }
  });
};

module.exports = lib;
