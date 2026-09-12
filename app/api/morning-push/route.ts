import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: news } = await supabase.from('morning_news').select('*').order('created_at', { ascending: false }).limit(1);
    const latestNews = news?.[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newProductsCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
    const title = latestNews ? `☀️ ${latestNews.title.slice(0, 45)}` : 'Your Morning News - Begin your Day Knowing your Way!';
    const body = latestNews
      ? `${latestNews.summary.slice(0, 80)}... + ${newProductsCount || 0} new items today! Tap to read.`
      : `Good morning from Prima! ☀️ ${newProductsCount || 0} new items on KSOM + top news inside. Tap to open!`;
    const { data: subs } = await supabase.from('push_subscriptions').select('*');
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'No push subscriptions yet - students need to enable notifications first!', hint: 'Students must click Enable Notifications at bottom of homepage', title, body, sent: 0 });
    }
    let webpush: any;
    try {
      webpush = require('web-push');
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:ksom@knust.edu.gh',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );
    } catch (e: any) {
      return NextResponse.json({ message: 'web-push not installed', fix: 'Run: npm install web-push', wouldSendTo: subs.length, title, body });
    }
    const payload = JSON.stringify({
      title,
      body,
      image: latestNews?.image_url || '/ksom-icon.png',
      badge: 1,
      url: '/',
      newsId: latestNews?.id,
    });
    let sent = 0, failed = 0;
    for (const sub of subs) {
      try {
        const subscription = sub.subscription || { endpoint: sub.endpoint, keys: sub.subscription?.keys };
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        failed++;
      }
    }
    return NextResponse.json({ success: true, sent, failed, total: subs.length, title, body, news: latestNews?.title, time: new Date().toLocaleString('en-GH', { timeZone: 'Africa/Accra' }) + ' Ghana Time', note: '7AM daily push - students get morning news!' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
export async function POST(req: NextRequest) { return GET(req); }
