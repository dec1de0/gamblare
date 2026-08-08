package kz.hackathon.ludoguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;

public class UsageMonitorService extends Service {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private String lastPackage = "";
    private final Runnable poller = new Runnable() { @Override public void run() { checkForegroundApp(); handler.postDelayed(this, 3000); } };
    @Override public void onCreate() { super.onCreate(); createChannel(); startForeground(7, notification()); handler.post(poller); }
    private void checkForegroundApp() {
        UsageStatsManager manager = (UsageStatsManager) getSystemService(USAGE_STATS_SERVICE); long now = System.currentTimeMillis(); UsageEvents events = manager.queryEvents(now - 10000, now); UsageEvents.Event event = new UsageEvents.Event();
        while (events.hasNextEvent()) { events.getNextEvent(event); if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) { String pkg = event.getPackageName(); if (!pkg.equals(lastPackage) && AppBlocklist.contains(pkg)) { lastPackage = pkg; Intent intent = new Intent(this, InterventionActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP); intent.putExtra("package", pkg); startActivity(intent); } lastPackage = pkg; } }
    }
    private Notification notification() { Intent intent = new Intent(this, MainActivity.class); PendingIntent pending = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT); return new Notification.Builder(this, "ludoguard").setContentTitle("LudoGuard защищает тебя").setContentText("Мониторинг приложений активен").setSmallIcon(android.R.drawable.ic_lock_idle_lock).setContentIntent(pending).setOngoing(true).build(); }
    private void createChannel() { if (Build.VERSION.SDK_INT >= 26) ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(new NotificationChannel("ludoguard", "LudoGuard", NotificationManager.IMPORTANCE_LOW)); }
    @Override public void onDestroy() { handler.removeCallbacks(poller); super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }
}
