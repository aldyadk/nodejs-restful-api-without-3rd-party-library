const repl = require("repl");

repl.start({
  prompt: "> ",
  eval: function(str) {
    console.log("at the evaluation stage", str);
    if (str.indexOf("fizz") > -1) {
      console.log("buzz");
    }
  },
});
