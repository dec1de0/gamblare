package kz.hackathon.ludoguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.HashMap;
import java.util.Map;

public class WebsiteVpnService extends VpnService {
    public static final String ACTION_STOP = "kz.hackathon.ludoguard.STOP_WEBSITE_MONITORING";
    private static final int NOTIFICATION_ID = 9;
    private static final String CHANNEL_ID = "website-monitor";
    private ParcelFileDescriptor vpn;
    private Thread worker;
    private volatile boolean running;
    private boolean voluntaryStop;
    private final Map<String, Long> lastAlerts = new HashMap<>();

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            voluntaryStop = true;
            stopMonitoring();
            return START_NOT_STICKY;
        }
        startForeground(NOTIFICATION_ID, buildNotification());
        if (vpn == null) startVpn();
        return START_NOT_STICKY;
    }

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Мониторинг сайтов", NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(channel);
        }
        Intent open = new Intent(this, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pending = PendingIntent.getActivity(this, 0, open, flags);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        return builder.setContentTitle("Gamblare: мониторинг активен")
                .setContentText("Проверяем DNS-домены и отправляем тревожный сигнал при совпадении")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setOngoing(true)
                .setContentIntent(pending)
                .build();
    }
    private void startVpn() {
        try {
            // Android sends system DNS queries to this virtual resolver. The service
            // can then inspect every regular DNS query before forwarding it upstream.
            vpn = new Builder().setSession("Gamblare website protection").addAddress("10.0.0.2", 32).addRoute("10.0.0.1", 32).addDnsServer("10.0.0.1").establish();
            running = true;
            getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("site_filter_enabled", true).apply();
            worker = new Thread(this::readPackets, "ludoguard-dns"); worker.start();
        } catch (Exception ignored) { getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("site_filter_enabled", false).apply(); stopSelf(); }
    }

    private void readPackets() {
        try (FileInputStream input = new FileInputStream(vpn.getFileDescriptor()); FileOutputStream output = new FileOutputStream(vpn.getFileDescriptor())) {
            byte[] packet = new byte[32767];
            while (running) { int length = input.read(packet); if (length > 0) handlePacket(packet, length, output); }
        } catch (Exception ignored) { }
    }

    private void handlePacket(byte[] packet, int length, FileOutputStream output) {
        if (length < 28 || (packet[0] & 0xf0) != 0x40) return;
        int ipHeader = (packet[0] & 0x0f) * 4; if (packet[9] != 17 || length < ipHeader + 8) return;
        int sourcePort = u16(packet, ipHeader); int destPort = u16(packet, ipHeader + 2); if (destPort != 53) return;
        int dnsOffset = ipHeader + 8; int dnsLength = length - dnsOffset; String domain = readName(packet, dnsOffset + 12, dnsOffset + dnsLength);
        if (domain.isEmpty()) return;
        try {
            byte[] responseDns;
            if (WebsiteBlocklist.contains(domain)) { responseDns = blockedResponse(packet, dnsOffset, dnsLength); alertOnce(domain); }
            else { responseDns = forwardDns(packet, dnsOffset, dnsLength); }
            byte[] response = ipUdpPacket(packet, ipHeader, sourcePort, responseDns); output.write(response); output.flush();
        } catch (Exception ignored) { }
    }

    private byte[] forwardDns(byte[] source, int offset, int length) throws Exception {
        DatagramSocket socket = new DatagramSocket(); protect(socket); socket.setSoTimeout(1800); DatagramPacket query = new DatagramPacket(source, offset, length, java.net.InetAddress.getByName("1.1.1.1"), 53); socket.send(query); byte[] answer = new byte[4096]; DatagramPacket response = new DatagramPacket(answer, answer.length); socket.receive(response); socket.close(); byte[] result = new byte[response.getLength()]; System.arraycopy(answer, 0, result, 0, result.length); return result;
    }

    private byte[] blockedResponse(byte[] source, int offset, int length) { byte[] answer = new byte[length]; System.arraycopy(source, offset, answer, 0, length); answer[2] = (byte) 0x81; answer[3] = (byte) 0x83; answer[6] = 0; answer[7] = 0; return answer; }
    private byte[] ipUdpPacket(byte[] request, int ipHeader, int sourcePort, byte[] dns) { int total = 20 + 8 + dns.length; byte[] result = new byte[total]; result[0] = 0x45; result[2] = (byte) (total >> 8); result[3] = (byte) total; result[8] = 64; result[9] = 17; System.arraycopy(request, 16, result, 12, 4); System.arraycopy(request, 12, result, 16, 4); result[20] = 0; result[21] = 53; result[22] = (byte) (sourcePort >> 8); result[23] = (byte) sourcePort; int udpLength = 8 + dns.length; result[24] = (byte) (udpLength >> 8); result[25] = (byte) udpLength; System.arraycopy(dns, 0, result, 28, dns.length); int checksum = checksum(result, 0, 20); result[10] = (byte) (checksum >> 8); result[11] = (byte) checksum; return result; }
    private int checksum(byte[] data, int offset, int length) { long sum = 0; for (int i = offset; i < offset + length; i += 2) sum += ((data[i] & 255) << 8) | (i + 1 < offset + length ? data[i + 1] & 255 : 0); while ((sum >> 16) != 0) sum = (sum & 65535) + (sum >> 16); return (int) (~sum & 65535); }
    private int u16(byte[] data, int offset) { return ((data[offset] & 255) << 8) | (data[offset + 1] & 255); }
    private String readName(byte[] data, int offset, int end) { StringBuilder result = new StringBuilder(); int position = offset; while (position < end) { int size = data[position++] & 255; if (size == 0) break; if (size > 63 || position + size > end) return ""; if (result.length() > 0) result.append('.'); result.append(new String(data, position, size)); position += size; } return result.toString(); }
    private void alertOnce(String domain) { long now = System.currentTimeMillis(); Long last = lastAlerts.get(domain); if (last != null && now - last < 60_000) return; lastAlerts.put(domain, now); WebsiteAlert.notify(this, domain); }
    private void stopMonitoring() {
        running = false;
        getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("site_filter_enabled", false).apply();
        try { if (vpn != null) vpn.close(); } catch (Exception ignored) {}
        vpn = null;
        stopForeground(true);
        stopSelf();
    }
    public static boolean isMonitoringEnabled(android.content.Context context) { return context.getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).getBoolean("site_filter_enabled", false); }
    @Override public void onRevoke() { if (!voluntaryStop) { WebsiteAlert.notifySecurityEvent(this, "Пользователь пытается отключить VPN-защиту Gamblare."); getSharedPreferences("ludoguard_prefs", MODE_PRIVATE).edit().putBoolean("site_filter_expected", false).apply(); } stopMonitoring(); super.onRevoke(); }
    @Override public void onDestroy() { stopMonitoring(); super.onDestroy(); }
    @Override public android.os.IBinder onBind(Intent intent) { return super.onBind(intent); }
}
