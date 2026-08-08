package kz.hackathon.ludoguard;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class WebAppActivity extends Activity {
    private static final String WEB_URL = "https://gamblaregit.vercel.app/";
    private boolean resumedOnce;
    @Override public void onCreate(Bundle state) { super.onCreate(state); if (android.os.Build.VERSION.SDK_INT >= 33) { if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 20); else getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("notification_permission_granted", true).apply(); } FrameLayout root = new FrameLayout(this); root.setBackgroundColor(Color.rgb(248, 251, 246)); WebView web = new WebView(this); web.getSettings().setJavaScriptEnabled(true); web.getSettings().setDomStorageEnabled(true); web.getSettings().setDatabaseEnabled(true); web.addJavascriptInterface(new NativeBridge(), "LudoGuardNative"); CookieManager.getInstance().setAcceptCookie(true); web.setWebViewClient(new WebViewClient() { @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { String url = request.getUrl().toString(); if (WebsiteBlocklist.contains(url)) { redirectToApp(view, url); return true; } return false; } @Override public void onPageFinished(WebView view, String url) { if (WebsiteBlocklist.contains(url)) redirectToApp(view, url); } }); root.addView(web, new FrameLayout.LayoutParams(-1, -1)); web.loadUrl(WEB_URL); setContentView(root); }

    private void redirectToApp(WebView view, String url) { WebsiteAlert.notify(this, url); view.stopLoading(); view.postDelayed(() -> view.loadUrl(WEB_URL), 120); }

    private void startWebsiteVpn() {
        android.content.Intent prepare = WebsiteVpnService.prepare(this);
        if (prepare != null) { startActivityForResult(prepare, 41); return; }
        android.content.Intent service = new android.content.Intent(this, WebsiteVpnService.class);
        if (android.os.Build.VERSION.SDK_INT >= 26) startForegroundService(service); else startService(service);
    }

    private void stopWebsiteVpn() {
        android.content.Intent stop = new android.content.Intent(this, WebsiteVpnService.class).setAction(WebsiteVpnService.ACTION_STOP);
        startService(stop);
        stopService(new android.content.Intent(this, WebsiteVpnService.class));
    }

    private void enableUninstallGuard() {
        android.app.admin.DevicePolicyManager policy = (android.app.admin.DevicePolicyManager) getSystemService(DEVICE_POLICY_SERVICE);
        android.content.ComponentName receiver = new android.content.ComponentName(this, AppDeviceAdminReceiver.class);
        if (policy != null && !policy.isAdminActive(receiver)) {
            android.content.Intent intent = new android.content.Intent(android.app.admin.DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(android.app.admin.DevicePolicyManager.EXTRA_DEVICE_ADMIN, receiver);
            intent.putExtra(android.app.admin.DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Защита фиксирует попытку отключить LudoGuard и запускает сигнал безопасности.");
            startActivity(intent);
        }
    }

    private void setEmergencyPhone(String phone) {
        String normalized = phone == null ? "" : phone.replaceAll("[^0-9+]", "");
        if (normalized.matches("8\\d{10}")) normalized = "+7" + normalized.substring(1);
        else if (normalized.matches("7\\d{10}")) normalized = "+" + normalized;
        getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putString("emergency_phone", normalized).apply();
        if (android.os.Build.VERSION.SDK_INT >= 23 && checkSelfPermission("android.permission.SEND_SMS") != android.content.pm.PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{"android.permission.SEND_SMS"}, 21);
    }

    private void clearEmergencyPhone() { getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().remove("emergency_phone").apply(); }

    @Override protected void onResume() {
        super.onResume();
        if (!resumedOnce) { resumedOnce = true; return; }
        android.content.SharedPreferences prefs = getSharedPreferences("ludoguard_prefs", MODE_PRIVATE);
        long lastChange = prefs.getLong("site_filter_changed_at", 0);
        boolean monitoringSettled = System.currentTimeMillis() - lastChange > 15_000L;
        if (prefs.getBoolean("notification_permission_granted", false) && android.os.Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) WebsiteAlert.notifySecurityEvent(this, "Пользователь отключил разрешение на уведомления LudoGuard.");
        if (monitoringSettled && prefs.getBoolean("site_filter_expected", false) && !WebsiteVpnService.isMonitoringEnabled(this)) WebsiteAlert.notifySecurityEvent(this, "Пользователь отключил VPN-защиту LudoGuard.");
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (results.length > 0 && results[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            if (requestCode == 20) getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("notification_permission_granted", true).apply();
            if (requestCode == 21) getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("sms_permission_granted", true).apply();
        }
    }

    private final class NativeBridge {
        @JavascriptInterface public void setSiteMonitoringEnabled(boolean enabled) {
            runOnUiThread(() -> { getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("site_filter_expected", enabled).putLong("site_filter_changed_at", System.currentTimeMillis()).apply(); if (enabled) startWebsiteVpn(); else stopWebsiteVpn(); });
        }
        @JavascriptInterface public boolean isSiteMonitoringEnabled() { return WebsiteVpnService.isMonitoringEnabled(WebAppActivity.this); }
        @JavascriptInterface public int getCurrentStreakDays() { return WebsiteAlert.getCurrentStreakDays(WebAppActivity.this); }
        @JavascriptInterface public void sendAiHighRiskAlert() { WebsiteAlert.notifyAiHighRisk(WebAppActivity.this); }
        @JavascriptInterface public void enableUninstallGuard() { runOnUiThread(WebAppActivity.this::enableUninstallGuard); }
        @JavascriptInterface public void setEmergencyPhone(String phone) { runOnUiThread(() -> WebAppActivity.this.setEmergencyPhone(phone)); }
        @JavascriptInterface public void clearEmergencyPhone() { runOnUiThread(WebAppActivity.this::clearEmergencyPhone); }
    }
}
