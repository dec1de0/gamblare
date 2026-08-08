package kz.hackathon.ludoguard;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public final class WebsiteBlocklist {
    private WebsiteBlocklist() {}
    public static final Set<String> DOMAINS = new HashSet<>(Arrays.asList(
            "parimatch.kz", "parimatch.com", "1xbet.kz", "1xbet.com", "olimpbet.kz", "olimpbet.com",
            "fonbet.kz", "fonbet.com", "betgames.kz", "mostbet.kz", "mostbet.com", "melbet.com",
            "betwinner.com", "leon.ru", "bet365.com", "betandyou.com", "marathonbet.com",
            "pin-up.bet", "888starz.com", "gg.bet", "vbet.kz"
    ));
    public static boolean contains(String value) {
        String normalized = value.toLowerCase().trim();
        for (String domain : DOMAINS) {
            if (normalized.equals(domain) || normalized.endsWith("." + domain) || normalized.contains("://" + domain)) return true;
        }
        return false;
    }
}
