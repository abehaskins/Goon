'use strict';
var path = require('path');
var spawn = require('child_process').spawn;

var Container = function (binary, opts, req, res) {
  this.getRawArguments = _getRawArguments;
  this.getBinaryArguments = _getBinaryArguments;
  this.run = _run;
  this.log = _log;
  this.execute = _execute;

  this._print = _print;
  this._respond = _respond;

  opts || (opts={});
  opts.redirects || (opts.redirects={});
  opts.argument_prefix || (opts.argument_prefix="-")

  this.opts = opts;
  this.binary = path.resolve(binary);
};

function _getRawArguments(req) {
  var query, contentType = req.get('content-type');

  this.log('type:'+contentType);

  switch (contentType) {
  case 'application/json':
    query = req.body;
    break;

  case 'application/x-www-form-urlencoded':
    query = req.body;
    break;

  default:
    query = req.query;
  }

  return query;
}

function _getBinaryArguments(rawArgs) {
  var binArgs = [];

  this.log('stdin:' + JSON.stringify(rawArgs));
  if (this.opts.pass_raw_json) {
    binArgs.push("-json=" + JSON.stringify(rawArgs));
  } else {
    for (var key in rawArgs) {
      var redirectedKey = (this.opts.redirects[key] || key)
      binArgs.push(this.opts.argument_prefix + redirectedKey + "=" + rawArgs[key]);
    }
  }

  return binArgs;
}

function _log(msg) {
  if (this.opts.verbose) {
    this._print(msg);
  }
}

function _print(msg) {
  console.log(msg);
}

function _run(req, res) {
  var rawArgs, binArgs;

  rawArgs = this.getRawArguments(req);
  binArgs = this.getBinaryArguments(rawArgs);

  this.execute(this.binary, binArgs, res);
}

function _execute(binary, binArgs, res) {
  var proc, running, self = this, output = "";
  proc = spawn(binary, binArgs);

  running = true;

  proc.stdout.on('data', function (data) {
    self.log('stdout: ' + data);
    output += data;
  });

  proc.stderr.on('data', function (data) {
    self.log('stderr: ' + data);
    if (running) self._respond(data.toString(), 1, res);
    running = false;
  });

  proc.on('close', function (code) {
    self.log(output);
    if (running) self._respond(output.toString(), code, res);
    running = false;
  });
}

function _respond(output, code, res) {
  switch (code) {
  case 0:
    res.status(200).send(output);
    break;
  case 1:
    res.status(500).json({error: true, msg: "Binary returned error exit code."});
    break;
  case 2:
    res.status(500).json({error: true, msg: "Binary returned error exit code."});
    break;
  default:
    res.status(500).json({error: true, msg: "Binary returned non-standard exit code."})
    break;
  }
}

exports.enable = function (funcs, binary, options) {
  var container = new Container(binary, options);
  funcs[binary] = function (req, res) {
    container.run(res);
  }
  return container;
}
