package com.xelery.protocol;

import java.util.Hashtable;

public class DefaultProtocol implements IProtocol {

	@Override
	public Hashtable<String, String> parse(String text) {
		Hashtable<String,String> entity = new Hashtable<String,String>();
		entity.put("error", "true");
		int first_space_index = text.indexOf(' ');
        if(first_space_index < 0)
                return entity;
        String uniqueid=text.substring(0,first_space_index);
        String remaining_text = text.substring(first_space_index).trim();
        entity.put("uniqueid",uniqueid);

        int second_space_index = remaining_text.indexOf(' ');
        if(second_space_index < 0) {
                entity.put("command",remaining_text);
                return entity;
        }
        String command = remaining_text.substring(0,second_space_index);
        remaining_text = remaining_text.substring(second_space_index).trim();
		int commandIndex = Integer.parseInt(command);
		
		switch(commandIndex) {
		case REG_RESP:
		case RECV_SMS_RESP:
			if(remaining_text.equals("1")|| remaining_text.equals("0")) {
				entity.put("error", "false");
				entity.put("status", remaining_text);
			}
			break;
		case SEND_SMS_REQ:
			String[] tokens = remaining_text.split(" ", 3);
			if(tokens.length==3) {
				entity.put("error", "false");
				entity.put("from", tokens[0]);
				entity.put("to", tokens[1]);
				entity.put("message", tokens[2]);
			}
			break;
		}
		
        return entity;
	}

	@Override
	public String serialize(Hashtable<String, String> entity) {
		String serializedText = entity.get("uniqueid")+" "+entity.get("command");
		switch(Integer.parseInt(entity.get("command"))) {
		case RECV_SMS_REQ:
			serializedText = serializedText + " "+entity.get("from")+" "+entity.get("message");
			break;
		case REG_REQ:
			serializedText = serializedText + " "+entity.get("mobile_number");
			break;
		case SEND_SMS_RESP:
			serializedText = serializedText + " " +entity.get("status");
			break;
		}
		return serializedText;
	}

}
