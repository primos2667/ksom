import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: msgBody, image } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: subs, error } = await supabase.from('push_subscriptions').select('*');

    if (error) {
      console.error('Fetch subs error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscriptions yet', sent: 0 });
    }

    // ✅ Fix: Use require with ts-ignore to avoid declaration error
    let webpush: any;
    try {
      // @ts-ignore - web-push has no types, but works
      webpush = require('web-push');
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:ksom@knust.edu.gh',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );
    } catch (e: any) {
      console.log('web-push not installed. Run: npm install web-push');
      // Still return success for now - badge will work via setAppBadge in frontend
      return NextResponse.json({
        message: 'web-push not installed - install with npm install web-push',
        wouldSendTo: subs.length,
        note: 'For now, frontend badge still works when app open. Install web-push for background badge.'
      });
    }

    const payload = JSON.stringify({
      title: title || 'New on KSOM! 🚀',
      body: msgBody || 'New product posted!',
      image: image || '/ksom-icon.png',
      badge: 1,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      try {
        const subscription = sub.subscription || { endpoint: sub.endpoint, keys: sub.subscription?.keys };
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err: any) {
        console.error('Failed to send to', sub.endpoint, err.message);
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
        failed++;
      }
    }

    return NextResponse.json({ sent, failed, total: subs.length });
  } catch (e: any) {
    console.error('Push send error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
