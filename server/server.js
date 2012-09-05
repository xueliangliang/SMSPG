/**
* TCP Protocol
*
* - Receive SMS
*   - <UNIQUEID> RECV_SMS_REQ <FROM> <MESSAGE_LENGHT> <MESSAGE>\4\4
*   - <UNIQUEID> RECV_SMS_RESP <STATUS> \4\4
*
* - Send SMS
*   - <UNIQUEID> SEND_SMS_REQ <FROM> <TO> <MESSAGE_LENGTH> <MESSAGE>\4\4
*   - <UNIQUEID> SEND_SMS_RESP <STATUS>\4\4
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
  activeSocket = c;
  c.on('data', function(data) {
	var text = data.toString();
	console.log('Data Received:'+text);
	var uniqueid=text.substring(0,text.indexOf(' '));
	c.emit('data'+uniqueid,text);
  });
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
  

  res.writeHead(200, {'Content-Type': 'text/plain'});
  try{
	if(activeSocket !== undefined) {
		console.log("Socket Write");
		var uniqueid = (new Date()).getTime();
		activeSocket.write(uniqueid+" "+SEND_SMS_REQ+" "+query.from+" "+query.to+" "+query.message+"\r\n");
		var callback = function(text){
	          console.log('data'+uniqueid+' event received');
		  res.end(text+'\n');
		  activeSocket.removeListener('data'+uniqueid,callback);
		}
		activeSocket.on('data'+uniqueid,callback);
	}
  }catch(err) {
	console.log(err);
  }
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
