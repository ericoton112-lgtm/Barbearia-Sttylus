'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ProfessionalDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: appts } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client:profiles!client_id (full_name),
          service:services!service_id (name)
        `)
        .eq('barber_id', user.id)
        .gte('appointment_date', today + 'T00:00:00')
        .lte('appointment_date', today + 'T23:59:59')
        .order('appointment_date', { ascending: true });

      if (appts) setAppointments(appts);
      setLoading(false);

      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    setSyncing(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BFVMa0nULV7_Yu2LcL0Di5eyXdtnMzCZml-QWX7kHzHa8Pw_EmtPhE0v432Enkd_KJSWnZkcl1ThKO1Js_wIxH8";
        
        const oldSub = await registration.pushManager.getSubscription();
        if (oldSub) await oldSub.unsubscribe();

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(vapidPublicKey)
        });

        const subJson = sub.toJSON();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
          await supabase.from('push_subscriptions').insert({
            user_id: user.id,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth
          });
        }
        setIsSubscribed(true);
        alert('Sincronizado!');
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div style={{background:'#131313', color:'white', height:'100vh', display:'flex', alignItems:'center', justifyCenter:'center'}}>Carregando...</div>;

  return (
    <div style={{background:'#131313', color:'white', minHeight:'100vh', padding:'20px', fontFamily:'sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
        <h1 style={{fontSize:'20px', fontWeight:'bold'}}>STYLLUS PRO</h1>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'; }} style={{color:'red', background:'none', border:'none'}}>Sair</button>
      </header>

      <main>
        {!isSubscribed && (
          <div style={{background:'#1e3a8a', padding:'15px', borderRadius:'10px', marginBottom:'20px'}}>
            <p style={{fontSize:'14px', fontWeight:'bold', margin:'0 0 10px 0'}}>Ativar Avisos Sonoros</p>
            <button 
              onClick={handleRequestPermission}
              style={{width:'100%', background:'white', color:'black', padding:'10px', borderRadius:'5px', fontWeight:'bold', border:'none'}}
            >
              {syncing ? 'CONECTANDO...' : 'ATIVAR AGORA'}
            </button>
          </div>
        )}

        {isSubscribed && <p style={{color:'#22c55e', fontSize:'12px', marginBottom:'20px'}}>✅ Notificações Ativas</p>}

        <h2 style={{fontSize:'16px', borderBottom:'1px solid #333', paddingBottom:'10px', marginBottom:'15px'}}>AGENDA DE HOJE</h2>
        
        {appointments.length === 0 ? (
          <p style={{color:'#666', textAlign:'center', marginTop:'40px'}}>Nenhum cliente agendado.</p>
        ) : (
          appointments.map(appt => (
            <div key={appt.id} style={{background:'#1a1a1a', padding:'15px', borderRadius:'10px', marginBottom:'10px', border:'1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <p style={{color:'#3b82f6', fontWeight:'bold', margin:'0', fontSize:'14px'}}>
                  {new Date(appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p style={{margin:'5px 0', fontWeight:'bold'}}>{appt.client?.full_name}</p>
                <p style={{margin:'0', fontSize:'11px', color:'#666'}}>{appt.service?.name}</p>
              </div>
              {appt.status !== 'concluído' && (
                <button 
                  onClick={() => {
                    supabase.from('appointments').update({ status: 'concluído' }).eq('id', appt.id).then(() => fetchData());
                  }}
                  style={{background:'#3b82f6', color:'white', border:'none', padding:'10px', borderRadius:'5px'}}
                >
                  OK
                </button>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
