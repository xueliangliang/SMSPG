package com.xelery.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.util.Date;
import java.util.Hashtable;
import java.util.Timer;
import java.util.TimerTask;

import com.xelery.protocol.DefaultProtocol;
import com.xelery.protocol.IProtocol;

import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.IBinder;
import android.widget.Toast;

import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.util.Log;

public class LocalService extends Service {
	public static final String SERVICE_COMMAND = "xelery.service.command";
	public static final String APP_SHARED_PREFS = "xelery.shared.preference";

	private Socket nsocket; // Network Socket
	private InputStream nis; // Network Input Stream
	private OutputStream nos; // Network Output Stream

	private SmsReceiver mSmsReceiver;
	private ServiceCommandReceiver mServiceCommandReceiver;
	private IProtocol protocolImp = new DefaultProtocol();

	private String phoneNumber;
	private String server;

	private boolean isRegistered = false;

	private SharedPreferences mSharedPreferences = null;

	@Override
	public IBinder onBind(Intent intent) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void onCreate() {
		super.onCreate();
		mSharedPreferences = getSharedPreferences(APP_SHARED_PREFS,
				Context.MODE_PRIVATE);
		Toast.makeText(LocalService.this, "My Local Service started",
				Toast.LENGTH_LONG).show();
		mSmsReceiver = new SmsReceiver();
		IntentFilter intentFilterSMS = new IntentFilter();
		intentFilterSMS.addAction("android.provider.Telephony.SMS_RECEIVED");
		this.registerReceiver(mSmsReceiver, intentFilterSMS);
		mServiceCommandReceiver = new ServiceCommandReceiver();
		IntentFilter intentFilterServiceCommand = new IntentFilter();
		intentFilterServiceCommand.addAction(SERVICE_COMMAND);
		this.registerReceiver(mServiceCommandReceiver,
				intentFilterServiceCommand);
		if (mSharedPreferences.contains("PHONE_NUMBER")
				&& mSharedPreferences.contains("SERVER")) {
			phoneNumber = mSharedPreferences.getString("PHONE_NUMBER", "");
			server = mSharedPreferences.getString("SERVER", "");
			if (!phoneNumber.equals("") && !server.equals("")) {
				try {
					start();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}

	private void start() throws IOException {
		SocketAddress sockaddr = new InetSocketAddress(server, 33322);
		nsocket = new Socket();
		nsocket.connect(sockaddr, 5000); // 10 second connection timeout
		if (nsocket.isConnected()) {
			nis = nsocket.getInputStream();
			nos = nsocket.getOutputStream();
		}
		// Register First
		Hashtable<String, String> reg_req = new Hashtable<String, String>();
		reg_req.put("uniqueid", new Date().getTime() + "");
		reg_req.put("command", IProtocol.REG_REQ + "");
		reg_req.put("mobile_number", phoneNumber);
		nos.write((protocolImp.serialize(reg_req)+IProtocol.END_OF_COMMAND).getBytes());
		// Wait for response or request；
		int c = 0;
		StringBuffer sb = new StringBuffer();
		while((c = nis.read())!= -1){
			sb.append((char)c);
			if(sb.toString().endsWith(IProtocol.END_OF_COMMAND)) {
				Hashtable<String,String> entity = protocolImp.parse(sb.toString().substring(0, sb.length()-IProtocol.END_OF_COMMAND.length()));
				if(entity.get("error").equals("false")) {
					int commandIndex = Integer.parseInt(entity.get("command"));
					switch(commandIndex) {
					case IProtocol.REG_RESP:
						if(entity.get("status").equals("1")) {
							isRegistered = true;
							Log.i("SMSPG","Mobile agent registered "+server+" with mobile "+phoneNumber);
						}
						break;
					case IProtocol.RECV_SMS_RESP:
						Log.i("SMSPG","Message passed to server:"+entity.get("uniqueid")+" "+entity.get("status"));
						break;
					case IProtocol.SEND_SMS_REQ:
						sendSMS(entity.get("to"), entity.get("message"));
						break;
					}
				}
			}
		}
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
		stop();
		Toast.makeText(LocalService.this, "My Local Service ended",
				Toast.LENGTH_LONG).show();
	}

	private void stop() {
		// Remove shared preference
		mSharedPreferences.edit().clear();
		mSharedPreferences.edit().commit();
		if (mSmsReceiver != null) {
			this.unregisterReceiver(mSmsReceiver);
		}
		if (mServiceCommandReceiver != null) {
			this.unregisterReceiver(mServiceCommandReceiver);
		}
	}

	public boolean sendSMS(String number, String text) {
		try {
			SmsManager smsManager = SmsManager.getDefault();
			smsManager.sendTextMessage(number, null, text, null, null);
			return true;
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
	}

	public class ServiceCommandReceiver extends BroadcastReceiver {
		@Override
		public void onReceive(Context context, Intent intent) {
			Bundle bundle = intent.getExtras();
			String command = bundle.getString("COMMAND");
			if (command.equalsIgnoreCase("start")) {
				if (isRegistered) {
					// if the service is still registering with backend server,
					// stop first
					stop();
				}
				phoneNumber = bundle.getString("PHONE_NUMBER");
				server = bundle.getString("SERVER");
				// Save into shared preference
				mSharedPreferences.edit()
						.putString("PHONE_NUMBER", phoneNumber);
				mSharedPreferences.edit().putString("SERVER", server);
				mSharedPreferences.edit().commit();
				try {
					start();
				} catch (IOException e) {
					e.printStackTrace();
					Toast.makeText(LocalService.this,
							"My Local Service cannot start due to IOException",
							Toast.LENGTH_LONG).show();
				}
			} else if (command.equalsIgnoreCase("stop")) {
				stop();
			}
		}
	}

	public class SmsReceiver extends BroadcastReceiver {

		@Override
		public void onReceive(Context context, Intent intent) {
			Bundle bundle = intent.getExtras();

			// (protocol description unit)
			Object[] _pdus = (Object[]) bundle.get("pdus");

			/*
			 * get messages
			 */
			SmsMessage[] message = new SmsMessage[_pdus.length];

			/*
			 * create messages from pdus
			 */
			for (int i = 0; i < _pdus.length; i++) {
				message[i] = SmsMessage.createFromPdu((byte[]) _pdus[i]);

			}

			for (SmsMessage currentMessage : message) {
				if (nsocket != null && nsocket.isConnected() && isRegistered) {
					// Notify Server there is new message received
					Hashtable<String, String> recv_sms_req = new Hashtable<String, String>();
					recv_sms_req.put("uniqueid", new Date().getTime() + "");
					recv_sms_req.put("command", IProtocol.RECV_SMS_REQ + "");
					recv_sms_req.put("from",
							currentMessage.getDisplayOriginatingAddress());
					recv_sms_req.put("to", phoneNumber);
					recv_sms_req.put("message",
							currentMessage.getDisplayMessageBody());
					try {
						nos.write((protocolImp.serialize(recv_sms_req) + IProtocol.END_OF_COMMAND)
								.getBytes());
					} catch (IOException e) {
						stop();
						e.printStackTrace();
						break;
					}
				}
			}
		}
	}
}
