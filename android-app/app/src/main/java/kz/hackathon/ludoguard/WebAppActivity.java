package kz.hackathon.ludoguard;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;

public class WebAppActivity extends Activity {
    private static final String WEB_URL = "https://gamblaregit.vercel.app/";
    @Override public void onCreate(Bundle state) { super.onCreate(state); if (android.os.Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 20); LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(248, 251, 246)); TextView bar = new TextView(this); bar.setText("✦  LUDOGUARD  ·  web-приложение"); bar.setTextSize(12); bar.setTextColor(Color.rgb(24, 35, 31)); bar.setPadding(20, 18, 20, 18); root.addView(bar); WebView web = new WebView(this); web.getSettings().setJavaScriptEnabled(true); web.getSettings().setDomStorageEnabled(true); web.getSettings().setDatabaseEnabled(true); web.addJavascriptInterface(new NativeBridge(), "LudoGuardNative"); CookieManager.getInstance().setAcceptCookie(true); web.setWebViewClient(new WebViewClient() { @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { String url = request.getUrl().toString(); if (WebsiteBlocklist.contains(url)) { redirectToApp(view, url); return true; } return false; } @Override public void onPageFinished(WebView view, String url) { if (WebsiteBlocklist.contains(url)) redirectToApp(view, url); } }); root.addView(web, new LinearLayout.LayoutParams(-1, 0, 1)); web.loadUrl(WEB_URL); setContentView(root); }

    private void redirectToApp(WebView view, String url) { WebsiteAlert.notify(this, url); view.stopLoading(); view.postDelayed(() -> view.loadUrl(WEB_URL), 120); }

    private void startWebsiteVpn() {
        android.content.Intent prepare = WebsiteVpnService.prepare(this);
        if (prepare != null) { startActivityForResult(prepare, 41); return; }
        android.content.Intent service = new android.content.Intent(this, WebsiteVpnService.class);
        if (android.os.Build.VERSION.SDK_INT >= 26) startForegroundService(service); else startService(service);
    }

    private final class NativeBridge {
        @JavascriptInterface public void setSiteMonitoringEnabled(boolean enabled) {
            runOnUiThread(() -> { if (enabled) startWebsiteVpn(); else stopService(new android.content.Intent(WebAppActivity.this, WebsiteVpnService.class)); });
        }
    }
}
