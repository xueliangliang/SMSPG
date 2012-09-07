var constants = require('./constants.js');

function parse(text) {
	var entity = {error:true};
        var first_space_index = text.indexOf(' ');
	if(first_space_index < 0) 
		return entity;
	var uniqueid=text.substring(0,first_space_index);
	var remaining_text = text.substring(first_space_index).trim();
	entity.uniqueid = uniqueid;
	
	var second_space_index = remaining_text.indexOf(' ');
	if(second_space_index < 0) {
		entity.command = remaining_text;
		return entity;
	}
	var command = remaining_text.substring(0,second_space_index);
	remaining_text = remaining_text.substring(second_space_index).trim();
	entity.command  = parseInt(command);
	if(isNaN(entity.command)) {
		entity.command = '';
		return entity;
	}
	
	switch(entity.command) {
	case constants.RECV_SMS_REQ:
	var tokens = remaining_text.split(' ', 2);
	if(tokens.length == 3) {
		entity.from = tokens[0];
		entity.to = tokens[1];
		entity.message = tokens[2];
		entity.error = false;
	}
	break;
	case constants.SEND_SMS_RESP:
	if(remaining_text === "1" || remaining_text ==="0") {
		entity.status = remaining_text;
		entity.error  = false;
	}
	break;
	case constants.REG_REQ:
	var re = /\+?\d+-?\d*$/;
	if(remaining_text.match(re)) {
		entity.mobile_number = remaining_text;
		entity.error = false;
	}
	break;
	}
	
	return entity; 	
}

function serialize(entity) {
	var serialized_text = "";
	serialized_text = entity.uniqueid+" "+entity.command;
	switch(entity.command) {
	case constants.RECV_SMS_RESP:
	case constants.REG_RESP:
	serialized_text = serialized_text+" "+entity.status;
	break;
	case constants.SEND_SMS_REQ:
	serialized_text = serialized_text+" "+entity.from+" "+entity.to+" "+entity.message;
	break;
	}
	return serialized_text;
}

exports.parse = parse;
exports.serialize = serialize;
