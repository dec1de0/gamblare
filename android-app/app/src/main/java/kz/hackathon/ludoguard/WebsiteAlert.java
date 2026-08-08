package kz.hackathon.ludoguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

public final class WebsiteAlert {
    private static final String CHANNEL_ID = "website-alerts";
    private static final long SITE_COOLDOWN_MS = 30 * 60_000L;
    private static final long SECURITY_COOLDOWN_MS = 30 * 60_000L;
    private static final long AI_COOLDOWN_MS = 15 * 60_000L;

    private WebsiteAlert() {}

    public static void notify(Context context, String url) {
        resetStreak(context);
        if (!shouldAlert(context, "site", SITE_COOLDOWN_MS)) return;
        showNotification(context, "LudoGuard заметил рискованный сайт", "Открыт домен из списка защиты. Сделай паузу.");
        sendSms(context, "site", "Открыт рискованный сайт: " + url);
    }

    public static void notifySecurityEvent(Context context, String event) {
        String category = categoryFor(event);
        long cooldown = "ai".equals(category) ? AI_COOLDOWN_MS : SECURITY_COOLDOWN_MS;
        if (!shouldAlert(context, category, cooldown)) return;
        showNotification(context, "LudoGuard: сигнал безопасности", event);
        sendSms(context, category, event);
    }

    public static int getCurrentStreakDays(Context context) {
        android.content.SharedPreferences prefs = context.getSharedPreferences("ludoguard_prefs", Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        long lastEvent = prefs.getLong("last_risk_event_at", 0);
        long started = prefs.getLong("streak_started_at", 0);
        if (started == 0) { prefs.edit().putLong("streak_started_at", now).apply(); return 1; }
        if (lastEvent > 0) return (int) ((now - lastEvent) / 86_400_000L);
        return Math.max(1, (int) ((now - started) / 86_400_000L) + 1);
    }

    public static void notifyAiHighRisk(Context context) {
        notifySecurityEvent(context, "Высокий риск по диалогу с AI. Нужна проверка состояния пользователя.");
    }

    private static void resetStreak(Context context) {
        context.getSharedPreferences("ludoguard_prefs", Context.MODE_PRIVATE)
                .edit().putLong("last_risk_event_at", System.currentTimeMillis()).apply();
    }

    private static String categoryFor(String event) {
        String value = event == null ? "" : event.toLowerCase();
        if (value.contains("высокий риск")) return "ai";
        if (value.contains("удал")) return "uninstall";
        if (value.contains("vpn")) return "vpn";
        if (value.contains("разрешени")) return "permission";
        return "security";
    }

    private static boolean shouldAlert(Context context, String category, long cooldownMs) {
        android.content.SharedPreferences prefs = context.getSharedPreferences("ludoguard_prefs", Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        String key = "last_alert_" + category;
        if (now - prefs.getLong(key, 0) < cooldownMs) return false;
        prefs.edit().putLong(key, now).apply();
        return true;
    }

    private static void showNotification(Context context, String title, String message) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Сигналы LudoGuard", NotificationManager.IMPORTANCE_HIGH));
        }
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);
        Notification notification = builder.setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title).setContentText(message).setAutoCancel(true).build();
        manager.notify((int) System.currentTimeMillis(), notification);
    }

    private static void sendSms(Context context, String category, String event) {
        try {
            if (Build.VERSION.SDK_INT >= 23 && context.checkSelfPermission("android.permission.SEND_SMS") != android.content.pm.PackageManager.PERMISSION_GRANTED) return;
            if (!context.getPackageManager().hasSystemFeature(android.content.pm.PackageManager.FEATURE_TELEPHONY_MESSAGING)) return;
            String phone = context.getSharedPreferences("ludoguard_prefs", Context.MODE_PRIVATE).getString("emergency_phone", "");
            if (phone == null || !phone.matches("\\+\\d{10,15}")) return;
            String text = "LudoGuard SOS: " + event + ". Проверьте, всё ли в порядке.";
            android.telephony.SmsManager manager = android.telephony.SmsManager.getDefault();
            java.util.ArrayList<String> parts = manager.divideMessage(text);
            manager.sendMultipartTextMessage(phone, null, parts, null, null);
        } catch (Exception ignored) {
            // SMS can fail without breaking the local protection or the user interface.
        }
    }
}
