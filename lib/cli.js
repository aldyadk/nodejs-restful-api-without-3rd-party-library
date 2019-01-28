const readline = require("readline");
const util = require("util");
const debug = util.debuglog("cli");
const events = require("events");
const os = require("os");
const v8 = require("v8");
const _data = require("./data");
const _logs = require("./logs");
const helpers = require("./helpers");

const cli = {};

class _events extends events {}
const e = new _events();

e.on("exit", function(str) {
  cli.responders.exit();
})
  .on("man", function(str) {
    cli.responders.help();
  })
  .on("help", function(str) {
    cli.responders.help();
  })
  .on("stats", function(str) {
    cli.responders.stats();
  })
  .on("list users", function(str) {
    cli.responders.listUsers();
  })
  .on("more user info", function(str) {
    cli.responders.moreUserInfo(str);
  })
  .on("list checks", function(str) {
    cli.responders.listChecks(str);
  })
  .on("more check info", function(str) {
    cli.responders.moreCheckInfo(str);
  })
  .on("list logs", function(str) {
    cli.responders.listLogs();
  })
  .on("more log info", function(str) {
    cli.responders.moreLogInfo(str);
  });

cli.responders = {};

cli.responders.exit = function() {
  // console.log("You asked for exit");
  process.exit(0);
};

cli.responders.help = function() {
  // console.log("You asked for help");
  const commands = {
    exit: "Kill the CLI and the rest of the application",
    man: "Show this help page",
    help: "Alias of the 'man' command",
    stats:
      "Get statistics of the underlying operating system and resource utilization",
    "list users":
      "Show a list of all the registered (undeleted) users in the system",
    "more user info --{userId}": "Show details of the specified user",
    "list checks --up --down":
      "Show a list of all the active checks in the system, including their state. The '--up' and '--down' flags are both optional",
    "more check info --{checkId}": "Show details of the specified check",
    "list logs":
      "Show a list of all the log files available to be read (compressed only)",
    "more log info --{fileName}": "Show details of the specified log file",
  };

  cli.horizontalLine();
  cli.centered("CLI MANUAL");
  cli.horizontalLine();
  cli.verticalSpace(2);

  for (let key in commands) {
    if (commands.hasOwnProperty(key)) {
      const value = commands[key];
      let line = "\x1b[33m" + key + "\x1b[0m";
      let padding = 60 - line.length;
      for (let i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }

  cli.verticalSpace();
  cli.horizontalLine();
};

cli.verticalSpace = function(lines) {
  lines = typeof lines === "number" && lines > 0 ? lines : 1;
  for (let i = 0; i < lines; i++) {
    console.log("");
  }
};

cli.horizontalLine = function() {
  const width = process.stdout.columns;
  let line = "";
  for (let i = 0; i < width; i++) {
    line += "-";
  }
  console.log(line);
};

cli.centered = function(string) {
  string =
    typeof string === "string" && string.trim().length > 0 ? string.trim() : "";
  const width = process.stdout.columns;
  const leftPadding = Math.floor((width - string.length) / 2);
  let line = "";
  for (let i = 0; i < leftPadding; i++) {
    line += " ";
  }
  line += string;
  console.log(line);
};

cli.responders.stats = function() {
  // console.log("You asked for stats");
  const stats = {
    "Load Average": os.loadavg().join(" "),
    "CPU Count": os.cpus().length,
    "Free Memory": os.freemem(),
    "Current Malloced Memory": v8.getHeapStatistics().malloced_memory,
    "Peak Malloced Memory": v8.getHeapStatistics().peak_malloced_memory,
    "Allocated Heap Used (%)":
      Math.round(
        (v8.getHeapStatistics().used_heap_size /
          v8.getHeapStatistics().total_heap_size) *
          100
      ) + " %",
    "Available Heap Allocated (%)":
      Math.round(
        (v8.getHeapStatistics().total_heap_size /
          v8.getHeapStatistics().heap_size_limit) *
          100
      ) + " %",
    Uptime: os.uptime() + " Seconds",
  };

  cli.horizontalLine();
  cli.centered("SYSTEM STATISTICS");
  cli.horizontalLine();
  cli.verticalSpace(2);

  for (let key in stats) {
    if (stats.hasOwnProperty(key)) {
      const value = stats[key];
      let line = "\x1b[33m" + key + "\x1b[0m";
      let padding = 60 - line.length;
      for (let i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }

  cli.verticalSpace();
  cli.horizontalLine();
};

cli.responders.listUsers = function() {
  // console.log("You asked to list users");
  _data.list("users", function(err, userIds) {
    if (!err && userIds && userIds.length > 0) {
      cli.verticalSpace();
      userIds.forEach(function(userId) {
        _data.read("users", userId, function(err, userData) {
          if (!err && userData) {
            const numberOfChecks =
              typeof userData.checks === "object" &&
              userData.checks instanceof Array &&
              userData.checks.length > 0
                ? userData.checks.length
                : 0;
            const line = `Name: ${userData.firstName} ${
              userData.lastName
            } Phone: ${userData.phone} Checks: ${numberOfChecks}`;
            console.log(line);
            cli.verticalSpace();
          }
        });
      });
    }
  });
};

cli.responders.moreUserInfo = function(str) {
  // console.log("You asked for more user info", str);
  const arr = str.split("--");
  const userId =
    typeof arr[1] === "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (userId) {
    _data.read("users", userId, function(err, userData) {
      if (!err && userData) {
        delete userData.hashedPassword;
        cli.verticalSpace();
        console.dir(userData, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

cli.responders.listChecks = function(str) {
  // console.log("You asked to list checks", str);
  _data.list("checks", function(err, checkIds) {
    if (!err && checkIds && checkIds.length > 0) {
      cli.verticalSpace();
      checkIds.forEach(function(checkId) {
        _data.read("checks", checkId, function(err, checkData) {
          let includeCheck = false;
          const lowerString = str.toLowerCase();
          const state =
            typeof checkData.state === "string" ? checkData.state : "down";
          const stateOrUnknown =
            typeof checkData.state === "string" ? checkData.state : "unknown";
          if (
            lowerString.indexOf(`--${state}`) > -1 ||
            (lowerString.indexOf("--down") === -1 &&
              lowerString.indexOf("--up") === -1)
          ) {
            const line = `ID: ${
              checkData.id
            } ${checkData.method.toUpperCase()} ${checkData.protocol}://${
              checkData.url
            } State: ${stateOrUnknown}`;
            console.log(line);
            cli.verticalSpace();
          }
        });
      });
    }
  });
};

cli.responders.moreCheckInfo = function(str) {
  // console.log("You asked for more check info", str);
  const arr = str.split("--");
  const checkId =
    typeof arr[1] === "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (checkId) {
    _data.read("checks", checkId, function(err, checkData) {
      if (!err && checkData) {
        cli.verticalSpace();
        console.dir(checkData, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

cli.responders.listLogs = function() {
  // console.log("You asked to list logs");
  _logs.list(true, function(err, logFileNames) {
    if (!err && logFileNames && logFileNames.length > 0) {
      cli.verticalSpace();
      logFileNames.forEach(function(logFileName) {
        if (logFileName.indexOf("-") > -1) {
          console.log(logFileName);
          cli.verticalSpace();
        }
      });
    }
  });
};

cli.responders.moreLogInfo = function(str) {
  // console.log("You asked for more log info", str);
  const arr = str.split("--");
  const logFileName =
    typeof arr[1] === "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (logFileName) {
    cli.verticalSpace();
    _logs.decompress(logFileName, function(err, stringData) {
      if (!err && stringData) {
        const resultArr = stringData.split("\n");
        resultArr.forEach(function(jsonString) {
          const logObject = helpers.parseJsonToObject(jsonString);
          if (logObject && JSON.stringify(logObject) !== "{}") {
            console.dir(logObject, { colors: true });
            cli.verticalSpace();
          }
        });
      }
    });
  }
};

cli.processInput = function(str) {
  str = typeof str === "string" && str.trim().length > 0 ? str.trim() : false;

  if (str) {
    const uniqueInput = [
      "exit",
      "man",
      "help",
      "stats",
      "list users",
      "more user info",
      "list checks",
      "more check info",
      "list logs",
      "more log info",
    ];

    let matchFound = false;
    let counter = 0;
    uniqueInput.some(function(input) {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        e.emit(input, str);
        return true;
      }
    });

    if (!matchFound) {
      console.log("Sorry, try again");
    }
  }
};

cli.init = function() {
  console.log("\x1b[35m%s\x1b[0m", "The CLI is running");
  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "uptime-monitoring > ",
  });

  _interface.prompt();

  _interface.on("line", function(str) {
    cli.processInput(str);
    _interface.prompt();
  });

  _interface.on("close", function() {
    process.exit(0);
  });
};

module.exports = cli;
