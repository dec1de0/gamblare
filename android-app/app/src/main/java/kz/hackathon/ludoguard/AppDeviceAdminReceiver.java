package kz.hackathon.ludoguard;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;

public class AppDeviceAdminReceiver extends DeviceAdminReceiver {
    @Override public CharSequence onDisableRequested(Context context, Intent intent) {
        WebsiteAlert.notifySecurityEvent(context, "Пользователь пытается удалить приложение LudoGuard.");
        return "LudoGuard отправит экстренному контакту сигнал о попытке удаления приложения.";
    }
}
