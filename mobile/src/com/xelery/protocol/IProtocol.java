package com.xelery.protocol;

import java.util.Hashtable;

public interface IProtocol {
	public static final int  RECV_SMS_REQ  = 1;
	public static final int  RECV_SMS_RESP = 2;
	public static final int  SEND_SMS_REQ  = 3;
	public static final int  SEND_SMS_RESP = 4;
	public static final int  REG_REQ       = 1000;
	public static final int  REG_RESP      = 1001;
	public static final String  END_OF_COMMAND= " \4\4";

	public Hashtable<String,String> parse(String text);
	public String serialize(Hashtable<String,String> entity);
}
