package kz.hackathon.ludoguard;

import android.app.Activity;
import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String PREFS = "ludoguard_prefs";
    private SharedPreferences prefs;
    private LinearLayout root;
    private int green = Color.rgb(168, 201, 77);
    private int dark = Color.rgb(24, 35, 31);

    @Override public void onCreate(Bundle state) { super.onCreate(state); startActivity(new Intent(this, WebAppActivity.class)); finish(); }

    private TextView text(String value, int size) { TextView view = new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(dark); view.setPadding(0, 8, 0, 8); return view; }
    private Button button(String value) { Button button = new Button(this); button.setText(value); button.setAllCaps(false); return button; }
    private LinearLayout page() { LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setPadding(28, 28, 28, 28); layout.setBackgroundColor(Color.rgb(248, 251, 246)); return layout; }
    private void mount(LinearLayout page) { root = page; ScrollView scroll = new ScrollView(this); scroll.addView(root); setContentView(scroll); }

    private void showConsent() {
        LinearLayout page = page(); TextView logo = text("GAMBLARE", 20); logo.setTextColor(dark); page.addView(logo);
        page.addView(text("Твоя поддержка рядом", 30)); page.addView(text("Gamblare помогает заметить рискованный момент и сделать паузу. Сайт-мониторинг работает через локальный VPN: приложение проверяет только DNS-домены, HTTPS-содержимое не читается.", 15));
        EditText contact = new EditText(this); contact.setHint("Telegram ID экстренного контакта (демо)"); page.addView(contact);
        Button agree = button("Согласен и продолжить"); agree.setOnClickListener(v -> { prefs.edit().putBoolean("consent", true).putString("contact", contact.getText().toString()).apply(); showHome(); }); page.addView(agree);
        TextView note = text("Можно изменить или отозвать согласие в настройках телефона. Уведомления контакту пока работают в demo-режиме.", 11); note.setTextColor(Color.GRAY); page.addView(note); mount(page);
    }

    private void showHome() {
        LinearLayout page = page(); TextView header = text("GAMBLARE", 14); header.setTextColor(dark); page.addView(header);
        TextView title = text("Привет, Арман", 28); page.addView(title); page.addView(text("ЗАЩИТА АКТИВНА", 11));
        TextView status = text("✓   Сегодня ты держишься\n\nМониторинг сайтов запускается вручную и работает в demo-режиме", 18); status.setTextColor(Color.WHITE); status.setBackgroundColor(dark); status.setPadding(24, 24, 24, 24); page.addView(status);
        Button usage = button("Открыть настройки Usage Access"); usage.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))); page.addView(usage);
        Button vpn = button("Включить VPN-мониторинг сайтов"); vpn.setOnClickListener(v -> startWebsiteVpn()); page.addView(vpn);
        Button start = button("Мониторить сайты внутри приложения"); start.setOnClickListener(v -> { startActivity(new Intent(this, WebAppActivity.class)); Toast.makeText(this, "WebView-мониторинг активен", Toast.LENGTH_SHORT).show(); }); page.addView(start);
        Button signal = button("Симулировать тревожный сигнал"); signal.setOnClickListener(v -> startActivity(new Intent(this, InterventionActivity.class))); page.addView(signal);
        Button community = button("Открыть web-версию внутри приложения"); community.setOnClickListener(v -> startActivity(new Intent(this, WebAppActivity.class))); page.addView(community);
        Button reset = button("Отозвать согласие и очистить настройки"); reset.setOnClickListener(v -> { prefs.edit().clear().apply(); stopService(new Intent(this, UsageMonitorService.class)); stopService(new Intent(this, WebsiteVpnService.class)); showConsent(); }); page.addView(reset);
        mount(page);
    }

    private void startWebsiteVpn() {
        Intent prepare = WebsiteVpnService.prepare(this);
        if (prepare != null) {
            startActivityForResult(prepare, 41);
            return;
        }
        Intent service = new Intent(this, WebsiteVpnService.class);
        if (android.os.Build.VERSION.SDK_INT >= 26) startForegroundService(service); else startService(service);
        Toast.makeText(this, "VPN-мониторинг сайтов включён", Toast.LENGTH_SHORT).show();
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 41 && resultCode == RESULT_OK) startWebsiteVpn();
    }

    private boolean hasUsageAccess() { AppOpsManager ops = (AppOpsManager) getSystemService(Context.APP_OPS_SERVICE); int mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), getPackageName()); return mode == AppOpsManager.MODE_ALLOWED; }
}
