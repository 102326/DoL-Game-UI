package org.dolui.host5.neutralprobe;
import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.*;
import java.io.*;
public final class ProbeActivity extends Activity {
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  WebView view = new WebView(this);
  view.getSettings().setJavaScriptEnabled(true);
  view.getSettings().setAllowFileAccess(false);
  view.getSettings().setAllowContentAccess(false);
  view.getSettings().setBlockNetworkLoads(true);
  view.setWebChromeClient(new WebChromeClient(){ @Override public boolean onConsoleMessage(ConsoleMessage m) { if(m.message().startsWith("SW41 ")) Log.i("Host5Probe",m.message()); return true; }});
  view.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r){return true;}

  });
  setContentView(view);
  try (InputStream input = getAssets().open("index.html"); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
   byte[] buffer = new byte[8192]; int n; while ((n = input.read(buffer)) != -1) bytes.write(buffer, 0, n);
   view.loadDataWithBaseURL("https://host5.invalid/", bytes.toString("UTF-8"), "text/html", "UTF-8", null);
  } catch (IOException e) { throw new IllegalStateException("Missing probe asset", e); }
 }
}
