/**
* TCP Protocol
*
* - Register
*   - <UNIQUEID> REG_REQ <MOBILE_NUMBER> \4\4
*   - <UNIQUEID> REG_RESP <STATUS>
*
* - Receive SMS
*   - <UNIQUEID> RECV_SMS_REQ <FROM> <TO> <MESSAGE> \4\4
*   - <UNIQUEID> RECV_SMS_RESP <STATUS> \4\4
*
* - Send SMS
*   - <UNIQUEID> SEND_SMS_REQ <FROM> <TO> <MESSAGE> \4\4
*   - <UNIQUEID> SEND_SMS_RESP <STATUS> \4\4
*
* - UNIQUEID can use current time stamp in millisec
* 
* - COMMANDS
*   - RECV_SMS_REQ : 1
*   - RECV_SMS_RESP: 2
*   - SEND_SMS_REQ : 3
*   - SEND_SMS_RESP: 4
*   - REG_REQ      : 1000
*   - REG_RESP	   : 1001
*
* - STATUS
*   - 0    ERROR
*   - 1    SUCCESS
*
*/

var constants = require('./constants.js');
var protocol = require('./protocol.js');
var net = require('net');
var activeSocket;

/**
* Data structure to store connected session and mobile number mapping
*/

var connections={};

var server = net.createServer(function(c) { //'connection' listener
  console.log('server connected');
  var chunkBuffer = '';

  c.on('data', function(data) {
	var text = chunkBuffer+data.toString();
	if(text.indexOf(constants.END_OF_COMMAND) >0) {
		var endswith_token = false;
		if(text.indexOf(constants.END_OF_COMMAND,text.length-constants.END_OF_COMMAND)!==-1) {
			//ends with END_OF_COMMAND
			endswith_token = true;
		}
		var tokens = text.split(constants.END_OF_COMMAND) 
		for(var i=0;i<tokens.length;i++) {
			if(i === tokens.length-1
				&& !endswith_token) {
				chunkBuffer = tokens[i];
				break;
			}
			entity = protocol.parse(tokens[i]);
			if(!entity.error) {
				console.log('command received:');
				console.log(entity);
				switch(entity.command) {
				case constants.REG_REQ:
				connections[entity.mobile_number] = c;
				var reg_resp = {uniqueid:entity.uniqueid,command:constants.REG_RESP,status:1};
				c.write(protocol.serialize(reg_resp)+constants.END_OF_COMMAND);
				break;
				case constants.RECV_SMS_REQ:
				var recv_sms_resp = {uniqueid:entity.uniqueid,command:constants.RECV_SMS_RESP,status:1};
				//TODO add sms receiver handler
				c.write(protocol.serialize(recv_sms_resp)+constants.END_OF_COMMAND);
				break;
				case constants.SEND_SMS_RESP:
				c.emit('send_sms_respreceived_'+entity.uniqueid,entity);
				break;
				}
			}
		}
	}else {
		chunkBuffer = chunkBuffer + text;
	}
  });

  function remove_socket(c) {
	if(connections !== undefined && Object.keys(connections).length >0) {
		for(var key in connections) {
			var obj = connections[key];
			if(c===obj) {	
				delete connections[key];
			}
		}
	}
  }
  c.on('error',remove_socket);
  c.on('end',remove_socket);
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
	if(connections !== undefined && Object.keys(connections).length >0) {
		//find the from mapping's socket, if it is not defined, it will choose a random
		var send_sms_req = {uniqueid:(new Date()).getTime(),command:constants.SEND_SMS_REQ,from:query.from,to:query.to,message:query.message};
		var uniqueid = send_sms_req.uniqueid;
		if(connections[query.from] !== undefined) {
			activeSocket = connections[query.from];
			console.log(query.from+" mapping socket selected.");
		}else {
			var keys = Object.keys(connections);
			var key = keys[Math.floor((Math.random()*keys.length))];
			send_sms_req.from = key;
			activeSocket = connections[key];
			console.log(key+" socket selected.");
		}
		console.log("Socket Write");
		activeSocket.write(protocol.serialize(send_sms_req)+constants.END_OF_COMMAND);
		var callback = function(text){
	          console.log('send_sms_respreceived_'+uniqueid+' event received');
		  res.end(entity.status+'\n');
		  activeSocket.removeListener('send_sms_respreceived_'+uniqueid,callback);
		}
		activeSocket.on('send_sms_respreceived_'+uniqueid,callback);
	}else {
		res.end('No mobile agent connected!\n');
	}
  }catch(err) {
	console.log(err);
  }
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
