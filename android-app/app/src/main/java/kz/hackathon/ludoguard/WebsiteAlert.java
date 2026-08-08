package kz.hackathon.ludoguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

public final class WebsiteAlert {
    private WebsiteAlert() {}
    public static void notify(Context context, String url) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel("website-alerts", "Website alerts", NotificationManager.IMPORTANCE_HIGH));
        Notification notification = new Notification.Builder(context, "website-alerts").setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle("LudoGuard заметил рискованный сайт").setContentText("Открыт домен из списка защиты. Сделай паузу.").setAutoCancel(true).build();
        manager.notify((int) System.currentTimeMillis(), notification);
    }
}
