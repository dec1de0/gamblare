package kz.hackathon.ludoguard;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class InterventionActivity extends Activity {
    @Override public void onCreate(Bundle state) { super.onCreate(state); LinearLayout page = new LinearLayout(this); page.setOrientation(LinearLayout.VERTICAL); page.setGravity(Gravity.CENTER); page.setPadding(28, 28, 28, 28); page.setBackgroundColor(Color.rgb(248, 251, 246));
        TextView symbol = new TextView(this); symbol.setText("✦"); symbol.setTextSize(52); symbol.setTextColor(Color.rgb(145, 186, 65)); symbol.setGravity(Gravity.CENTER); page.addView(symbol);
        TextView title = new TextView(this); title.setText("Ты в порядке?"); title.setTextSize(30); title.setTextColor(Color.rgb(24, 35, 31)); title.setGravity(Gravity.CENTER); page.addView(title);
        TextView copy = new TextView(this); copy.setText("Мы заметили букмекерское приложение. Давай сделаем паузу на 30 секунд."); copy.setTextSize(15); copy.setTextColor(Color.GRAY); copy.setGravity(Gravity.CENTER); page.addView(copy);
        TextView timer = new TextView(this); timer.setTextSize(42); timer.setTextColor(Color.rgb(24, 35, 31)); timer.setGravity(Gravity.CENTER); page.addView(timer);
        Button ok = new Button(this); ok.setText("Да, я в порядке"); ok.setOnClickListener(v -> finish()); page.addView(ok);
        Button help = new Button(this); help.setText("Мне нужна помощь"); help.setOnClickListener(v -> { timer.setText("Контакт уведомлён (demo)"); }); page.addView(help); setContentView(page);
        new CountDownTimer(30000, 1000) { public void onTick(long left) { timer.setText(String.format("00:%02d", left / 1000)); } public void onFinish() { timer.setText("Время вышло"); } }.start();
    }
}
