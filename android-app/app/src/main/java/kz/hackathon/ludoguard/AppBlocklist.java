package kz.hackathon.ludoguard;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public final class AppBlocklist {
    private AppBlocklist() {}
    public static final Set<String> PACKAGES = new HashSet<>(Arrays.asList(
            "kz.olimpbet.app", "kz.fonbet.app", "kz.betgames.app",
            "com.parimatch.app", "com.bet365", "com.xbet", "com.mostbet"
    ));
    public static boolean contains(String packageName) { return PACKAGES.contains(packageName); }
}
