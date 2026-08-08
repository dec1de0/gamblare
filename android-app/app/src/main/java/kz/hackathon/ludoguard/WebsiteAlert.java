package kz.hackathon.ludoguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

public final class WebsiteAlert {
    private static final String SERVER = "https://gamblaregit.vercel.app/api/monitor/site-event";
    private WebsiteAlert() {}
    public static void notify(Context context, String url) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel("website-alerts", "Website alerts", NotificationManager.IMPORTANCE_HIGH));
        Notification notification = new Notification.Builder(context, "website-alerts").setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle("LudoGuard заметил рискованный сайт").setContentText("Открыт домен из списка защиты. Сделай паузу.").setAutoCancel(true).build();
        manager.notify((int) System.currentTimeMillis(), notification);
        new Thread(() -> sendRemoteEvent("Открыт рискованный сайт: " + url), "ludoguard-site-event").start();
    }

    public static void notifySecurityEvent(Context context, String event) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel("website-alerts", "Website alerts", NotificationManager.IMPORTANCE_HIGH));
        Notification notification = new Notification.Builder(context, "website-alerts").setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle("LudoGuard: сигнал безопасности").setContentText(event).setAutoCancel(true).build();
        manager.notify((int) System.currentTimeMillis(), notification);
        new Thread(() -> sendRemoteEvent(event), "ludoguard-security-event").start();
    }

    private static void sendRemoteEvent(String event) {
        java.net.HttpURLConnection connection = null;
        try {
            connection = (java.net.HttpURLConnection) new java.net.URL(SERVER).openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            String clean = event.replace("\\", "").replace("\"", "");
            byte[] body = ("{\"event\":\"" + clean + "\",\"deviceId\":\"android-demo\"}").getBytes(java.nio.charset.StandardCharsets.UTF_8);
            connection.getOutputStream().write(body);
            connection.getResponseCode();
        } catch (Exception ignored) {
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}
