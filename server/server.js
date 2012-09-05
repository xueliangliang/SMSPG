/**
* TCP Protocol
*
* - Receive SMS
*   - <UNIQUEID> RECV_SMS_REQ <FROM> <MESSAGE>
*   - <UNIQUEID> RECV_SMS_RESP <STATUS>  
*
* - Send SMS
*   - <UNIQUEID> SEND_SMS_REQ <FROM> <TO> <MESSAGE>
*   - <UNIQUEID> SEND_SMS_RESP <STATUS>
*
* - UNIQUEID can use current time stamp in millisec
* 
* - COMMANDS
*   - RECV_SMS_REQ : 1
*   - RECV_SMS_RESP: 2
*   - SEND_SMS_REQ : 3
*   - SEND_SMS_RESP: 4

* - STATUS
*   - 0    ERROR
*   - 1    SUCCESS
*
*/

var RECV_SMS_REQ  = 1;
var RECV_SMS_RESP = 2;
var SEND_SMS_REQ  = 3;
var SEND_SMS_RESP = 4;

var net = require('net');
var activeSocket;
var server = net.createServer(function(c) { //'connection' listener
  console.log('server connected');
  c.on('end', function() {
    delete activeSocket;
    console.log('server disconnected');
  });
  c.write('hello\r\n');
  activeSocket = c;
});
server.listen(8124, function() { //'listening' listener
  console.log('server bound');
});
//Web Service Interface

/** 
* Web Protocol
*
* - Send SMS
*   URL: /sendsms?from=<from>&to=<to>&message=<message>
*/
var http = require('http');

var url = require('url');
var querystring = require('querystring');

http.createServer(function (req, res) {
  var srvUrl = url.parse(req.url);
  var query = querystring.parse(srvUrl.query);
  

  try{
	if(activeSocket !== undefined) {
		console.log("Socket Write");
		activeSocket.write((new Date()).getTime()+" "+SEND_SMS_REQ+" "+query.from+" "+query.to+" "+query.message+"\r\n");
	}
  }catch(err) {
	console.log(err);
  }
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
