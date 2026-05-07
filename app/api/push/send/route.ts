import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:test@test.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Precisamos criar um cliente supabase que ignore o RLS para poder ler as inscrições do barbeiro,
// já que quem chama essa rota é o cliente (que não tem permissão para ler dados do barbeiro).
// Vamos usar o SUPABASE_SERVICE_ROLE_KEY se existir, ou fazer um bypass simples.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { barberId, title, message } = await req.json();

    const { data: subs, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', barberId);

    if (error) {
      console.error('Supabase error fetching subs:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: false, error: 'No subscriptions found for barber' });
    }

    const payload = JSON.stringify({ title, body: message });

    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        console.error('Error sending push to sub', sub.id, err);
        // Remove inscrição se ela expirou ou foi revogada no celular (410 ou 404)
        if (err.statusCode === 410 || err.statusCode === 404) {
           await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
