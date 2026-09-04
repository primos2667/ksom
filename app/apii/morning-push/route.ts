import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get latest morning news
    const { data: news } = await supabase.from('morning_news').select('*').order('created_at', { ascending: false }).limit(1);
    const latestNews = news?.[0];

    // Get today's new products count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newProductsCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());

    // Build push payload - BAIT!
    const title = latestNews ? `☀️ ${latestNews.title.slice(0, 40)}...` : '☀️ Your Morning News is ready!';
    const body = latestNews
      ? `${latestNews.summary.slice(0, 60)}... + ${newProductsCount || 0} new items on KSOM! Tap to read.`
      : `Good morning! ${newProductsCount || 0} new items on KSOM + top news inside. Tap to open!`;

    const { data: subs } = await supabase.from('push_subscriptions').select('*');
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subs yet - students need to enable notifications first', title, body, sent: 0 });
    }

    let webpush: any;
    try {
      webpush = require('web-push');
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:ksom@knust.edu.gh',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );
    } catch (e) {
      return NextResponse.json({ message: 'web-push not installed - run: npm install web-push', wouldSendTo: subs.length, title, body });
    }

    const payload = JSON.stringify({
      title,
      body,
      image: latestNews?.image_url || '/ksom-icon.png',
      badge: 1,
      url: '/',
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

    return NextResponse.json({ success: true, sent, failed, total: subs.length, title, body, news: latestNews?.title });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
