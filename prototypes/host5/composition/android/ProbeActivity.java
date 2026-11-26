package org.dolui.host5.neutralprobe;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.DocumentsContract;
import android.util.Log;
import android.webkit.*;
import java.io.*;
public final class ProbeActivity extends Activity {
 private static final int PICK_TTF = 41;
 private static final String DOCUMENTS = "org.dolui.host5.neutralprobe.fonts";
 private ValueCallback<Uri[]> pendingFile;
 private void finishFile(Uri selected) {
  ValueCallback<Uri[]> callback = pendingFile;
  pendingFile = null;
  if (callback != null) callback.onReceiveValue(selected == null ? null : new Uri[]{selected});
 }
 @Override protected void onActivityResult(int request, int result, Intent data) {
  super.onActivityResult(request, result, data);
  if (request != PICK_TTF) return;
  Uri selected = result == RESULT_OK && data != null ? data.getData() : null;
  // Only our neutral document may leave the system picker for this WebView.
  Uri allowed = DocumentsContract.buildDocumentUri(DOCUMENTS, "mono");
  finishFile(allowed.equals(selected) ? selected : null);
 }
 @Override protected void onDestroy() { finishFile(null); super.onDestroy(); }
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  WebView view = new WebView(this);
  view.getSettings().setJavaScriptEnabled(true);
  view.getSettings().setAllowFileAccess(false);
  view.getSettings().setAllowContentAccess(false);
  view.getSettings().setBlockNetworkLoads(true);
  final boolean ttfPicker = getIntent().getBooleanExtra("ttfPicker", false)
    && getPackageManager().resolveContentProvider(DOCUMENTS, 0) != null;
  if (ttfPicker && getIntent().getBooleanExtra("inspectProbe", false))
   WebView.setWebContentsDebuggingEnabled(true);
  view.getSettings().setDomStorageEnabled(ttfPicker);
  view.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onConsoleMessage(ConsoleMessage m) { if(m.message().startsWith("SW41 ")) Log.i("Host5Probe",m.message()); return true; }
   @Override public boolean onShowFileChooser(WebView source, ValueCallback<Uri[]> result, FileChooserParams params) {
    if (!ttfPicker || params.getMode() != FileChooserParams.MODE_OPEN) return false;
    if (pendingFile != null) { result.onReceiveValue(null); return true; }
    pendingFile = result;
    Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("font/ttf");
    pick.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
    pick.putExtra(DocumentsContract.EXTRA_INITIAL_URI, DocumentsContract.buildDocumentUri(DOCUMENTS, "root"));
    try { startActivityForResult(pick, PICK_TTF); }
    catch (ActivityNotFoundException e) { finishFile(null); }
    return true;
   }
  });
  view.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r){return true;}

  });
  setContentView(view);
  try (InputStream input = getAssets().open("index.html"); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
   byte[] buffer = new byte[8192]; int n; while ((n = input.read(buffer)) != -1) bytes.write(buffer, 0, n);
   String html = bytes.toString("UTF-8");
   String material = getIntent().getStringExtra("material");
   if ("live".equals(material) || "static".equals(material)) {
    html = html.replaceFirst("<html ", "<html data-material=\"" + material + "\" ");
   }
   view.loadDataWithBaseURL("https://host5.invalid/", html, "text/html", "UTF-8", null);
  } catch (IOException e) { throw new IllegalStateException("Missing probe asset", e); }
 }
}
