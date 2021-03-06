var http = require('http');

var options = {
  host: 'localhost',
  port: 1337,
  path: '/sendsms?from=1231231&to=1231231&message=hello%20world',
  method: 'GET',
  timeout: 30000
};

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.setTimeout(30000);

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write('data\n');
req.write('data\n');
req.end();
