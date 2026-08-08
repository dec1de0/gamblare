package kz.hackathon.ludoguard;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public final class WebsiteBlocklist {
    private WebsiteBlocklist() {}
    public static final Set<String> DOMAINS = new HashSet<>(Arrays.asList("parimatch.kz", "1xbet.kz", "olimpbet.kz", "fonbet.kz", "betgames.kz", "mostbet.kz"));
    public static boolean contains(String url) { String value = url.toLowerCase(); for (String domain : DOMAINS) if (value.contains(domain)) return true; return false; }
}
