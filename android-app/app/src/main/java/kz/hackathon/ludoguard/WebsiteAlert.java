package kz.hackathon.ludoguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

public final class WebsiteAlert {
    private WebsiteAlert() {}
    public static void notify(Context context, String url) {
        resetStreak(context);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel("website-alerts", "Website alerts", NotificationManager.IMPORTANCE_HIGH));
        Notification notification = new Notification.Builder(context, "website-alerts").setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle("LudoGuard заметил рискованный сайт").setContentText("Открыт домен из списка защиты. Сделай паузу.").setAutoCancel(true).build();
        manager.notify((int) System.currentTimeMillis(), notification);
        sendSms(context, "Открыт рискованный сайт: " + url);
    }

    public static void notifySecurityEvent(Context context, String event) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel("website-alerts", "Website alerts", NotificationManager.IMPORTANCE_HIGH));
        Notification notification = new Notification.Builder(context, "website-alerts").setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle("LudoGuard: сигнал безопасности").setContentText(event).setAutoCancel(true).build();
        manager.notify((int) System.currentTimeMillis(), notification);
        sendSms(context, event);
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
        android.content.SharedPreferences prefs = context.getSharedPreferences("ludoguard_prefs", Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        if (now - prefs.getLong("last_ai_high_risk_at", 0) < 15 * 60_000L) return;
        prefs.edit().putLong("last_ai_high_risk_at", now).apply();
        notifySecurityEvent(context, "Высокий риск по диалогу с AI. Нужна проверка состояния пользователя.");
    }

    private static void resetStreak(Context context) { context.getSharedPreferences("ludoguard_prefs", Context.MODE_PRIVATE).edit().putLong("last_risk_event_at", System.currentTimeMillis()).apply(); }

    private static void sendSms(Context context, String event) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 23 && context.checkSelfPermission("android.permission.SEND_SMS") != android.content.pm.PackageManager.PERMISSION_GRANTED) return;
            if (!context.getPackageManager().hasSystemFeature(android.content.pm.PackageManager.FEATURE_TELEPHONY_MESSAGING)) return;
            String phone = context.getSharedPreferences("ludoguard_prefs", Context.MODE_PRIVATE).getString("emergency_phone", "");
            if (phone == null || !phone.matches("\\+\\d{10,15}")) return;
            String text = "LudoGuard SOS: " + event + ". Проверьте, всё ли в порядке.";
            android.telephony.SmsManager manager = android.telephony.SmsManager.getDefault();
            java.util.ArrayList<String> parts = manager.divideMessage(text);
            manager.sendMultipartTextMessage(phone, null, parts, null, null);
        } catch (Exception ignored) {
        }
    }
}
