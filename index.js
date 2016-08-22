'use strict';
var spawn = require('child_process').spawn;

function getData(req) {
  var query;

  console.log('type', req.get('content-type'));
  switch (req.get('content-type')) {
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

function log(opts, msg) {
  if (opts.debug) {
    console.log(msg);
  }
}

var container = function (binary, opts, req, res) {
  var proc, output, args, data;

  opts = opts || {};
  output = "";
  args = [];
  data = getData(req);

  log(opts, 'stdin:' + JSON.stringify(data));
  if (opts.expects_json) {
    args.push("-json=" + JSON.stringify(data));
  } else {
    for (var key in data) {
      args.push("-" + key + "=" + data[key]);
    }
  }

  proc = spawn('./' + binary, args);

  proc.stdout.on('data', function (data) {
    log(opts, 'stdout: ' + data);
    output += data;
  });

  proc.stderr.on('data', function (data) {
    log(opts, 'stderr: ' + data);
    res.status(500);
  });

  proc.on('close', function (code) {
    log(opts, output);

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
  });
};

exports.enable = function (funcs, binary, options) {
  funcs[binary] = function (req, res) {
    container(binary, options, req, res);
  }
}
