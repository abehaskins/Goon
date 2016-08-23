var chai = require("chai");
var path = require('path');
var Goon = require('../index');

function noOp() {}

function getMockRequest() {
  var req = {
    contentType: "",
    get: function () {
      return req.contentType
    }
  };

  return req;
}

var done = function () {process.stdout.write('✓');}

chai.should();

(function ShouldCallExecuteWithCorrectBinaryAndNoArguments() {
  var exp = {};
  var con = Goon.enable(exp, "test", {});
  var ran = false;
  var req = getMockRequest();
  req.contentType = "application/json";

  con.execute = function (binary, binargs) {
    binargs.should.eql([]);
    binary.should.eql(path.resolve("./test"));
    ran = true;
  }

  con.run(req, {});
  ran.should.equal(true);
  done()
})();

(function ShouldCallExecuteWithCorrectBinaryAndJSONBodyArguments() {
  var exp = {};
  var con = Goon.enable(exp, "test", {});
  var ran = false;
  var req = getMockRequest();
  req.contentType = "application/json";
  req.body = {"x": 1};

  con.execute = function (binary, binargs) {
    binargs.should.eql(["-x=1"]);
    binary.should.eql(path.resolve("./test"));
    ran = true;
  }

  con.run(req, {});
  ran.should.equal(true);
  done()
})();

(function ShouldCallExecuteWithCorrectBinaryAndFormEncodedArguments() {
  var exp = {};
  var con = Goon.enable(exp, "test", {});
  var ran = false;
  var req = getMockRequest();
  req.contentType = "application/x-www-form-urlencoded";
  req.body = {"x": 1};

  con.execute = function (binary, binargs) {
    binargs.should.eql(["-x=1"]);
    binary.should.eql(path.resolve("./test"));
    ran = true;
  }

  con.run(req, {});
  ran.should.equal(true);
  done()
})();

(function ShouldCallExecuteWithCorrectBinaryAndQueryArguments() {
  var exp = {};
  var con = Goon.enable(exp, "test", {});
  var ran = false;
  var req = getMockRequest();
  req.query = {"x": 1};

  con.execute = function (binary, binargs) {
    binargs.should.eql(["-x=1"]);
    binary.should.eql(path.resolve("./test"));
    ran = true;
  }

  con.run(req, {});
  ran.should.equal(true);
  done()
})();

(function ShouldCallExecuteWithCorrectBinaryAndRedirectedQueryArguments() {
  var exp = {};
  var con = Goon.enable(exp, "test", {redirects: {
    x: "cats"
  }});
  var ran = false;
  var req = getMockRequest();
  req.query = {"x": 1};

  con.execute = function (binary, binargs) {
    binargs.should.eql(["-cats=1"]);
    binary.should.eql(path.resolve("./test"));
    ran = true;
  }

  con.run(req, {});
  ran.should.equal(true);
  done()
})();

(function ShouldCallExecuteWithCorrectBinaryAndRawJSONWhenFlagged() {
  var exp = {};
  var con = Goon.enable(exp, "test", {pass_raw_json: true});
  var ran = false;
  var req = getMockRequest();
  req.contentType = "application/json";
  req.body = {"x": 1};

  con.execute = function (binary, binargs) {
    binargs.join('').should.eql("-json={\"x\":1}");
    binary.should.eql(path.resolve("./test"));
    ran = true;
  }

  con.run(req, {});
  ran.should.equal(true);
  done()
})();

(function ShouldNotLogWhenVerboseIsDisabled() {
  var exp = {};
  var con = Goon.enable(exp, "test", {verbose: false});
  var logCount = 0;
  var req = getMockRequest();
  req.query = {"x": 1};

  con.execute = noOp;
  con._print = function () {
    logCount++;
  }

  con.run(req, {});
  logCount.should.equal(0);
  done()
})();

(function ShouldLogWhenVerboseIsEnabled() {
  var exp = {};
  var con = Goon.enable(exp, "test", {verbose: true});
  var logCount = 0;
  var req = getMockRequest();
  req.query = {"x": 1};

  con.execute = noOp;
  con._print = function (msg) {
    logCount++;
  }

  con.run(req, {});
  logCount.should.equal(2);
  done()
})();


(function ShouldRunBinary() {
  var exp = {};
  var con = Goon.enable(exp, "tests/mock_binary", {argument_prefix: "--"});
  var req = getMockRequest();
  req.query = {"code": 1};

  con._respond = function (output, code, res) {
    output.should.equal("\n");
    code.should.equal(1);
    done()
  }

  con.run(req, {});
})();

(function ShouldCatchBinaryWithError() {
  var exp = {};
  var con = Goon.enable(exp, "tests/mock_binary", {argument_prefix: "--"});
  var req = getMockRequest();
  req.query = {code: 2, content: "plain"};

  var res = {
    status: function (httpStatusCode) {
      httpStatusCode.should.equal(500);
      return {
        json: function (obj) {
          obj.should.eql({error: true, msg: "Binary returned error exit code."});
          done();
        }
      }
    }
  };

  con.run(req, res);
})();

// TEST VERBOSE ERRORS
