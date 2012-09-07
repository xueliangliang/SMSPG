package com.xelery.smspg_agent;



import com.xelery.service.LocalService;

import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.view.Menu;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.view.View.OnClickListener;

public class MainActivity extends Activity {
	
	private EditText phoneEdt;
	private EditText serverEdt;
	private Button startServiceBtn;
	private Button stopServiceBtn;
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        phoneEdt = (EditText) findViewById(R.id.phoneEdt);
        serverEdt = (EditText) findViewById(R.id.serverEdt);
        startServiceBtn = (Button) findViewById(R.id.startServiceBtn);
        startServiceBtn.setOnClickListener(new OnClickListener() {

			@Override
			public void onClick(View v) {
				Intent i = new Intent();
				i.setAction(LocalService.SERVICE_COMMAND);
				i.putExtra("COMMAND", "start");
				i.putExtra("PHONE_NUMBER", phoneEdt.getText().toString());
				i.putExtra("SERVER", serverEdt.getText().toString());
				sendBroadcast(i);
			}
        	
        });

        stopServiceBtn = (Button) findViewById(R.id.stopServiceBtn);
        stopServiceBtn.setOnClickListener(new OnClickListener() {

			@Override
			public void onClick(View v) {
				Intent i = new Intent();
				i.setAction(LocalService.SERVICE_COMMAND);
				i.putExtra("COMMAND", "stop");
				sendBroadcast(i);
			}
        	
        });
        final Intent local_service = new Intent(this, LocalService.class);
        startService(local_service);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.activity_main, menu);
        return true;
    }
}
