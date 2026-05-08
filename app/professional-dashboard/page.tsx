'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Check, Bell, Loader2 } from 'lucide-react';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

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
  const router = useRouter();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: appts } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client:profiles!client_id (full_name),
          service:services!service_id (name, price)
        `)
        .eq('barber_id', user.id)
        .gte('appointment_date', todayStart.toISOString())
        .lte('appointment_date', todayEnd.toISOString())
        .order('appointment_date', { ascending: true });

      if (appts) setAppointments(appts);
      setLoading(false);

      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleComplete = async (id: string) => {
    await supabase.from('appointments').update({ status: 'concluído' }).eq('id', id);
    fetchData();
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    
    setSyncing(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Use environment variable OR fallback to the actual key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BFVMa0nULV7_Yu2LcL0Di5eyXdtnMzCZml-QWX7kHzHa8Pw_EmtPhE0v432Enkd_KJSWnZkcl1ThKO1Js_wIxH8";
        
        const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);
        
        // Unsubscribe from old subscription to force a new one with correct keys
        const oldSub = await registration.pushManager.getSubscription();
        if (oldSub) {
          await oldSub.unsubscribe();
        }

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        const subJson = sub.toJSON();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Limpar inscrições antigas do banco para este usuário antes de inserir a nova
          await supabase.from('push_subscriptions').delete().eq('user_id', user.id);

          await supabase.from('push_subscriptions').insert({
            user_id: user.id,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth
          });
        }
        setIsSubscribed(true);
        alert('Sincronizado com sucesso! Faça um teste agora.');
      } else {
        alert('Permissão negada pelo navegador.');
      }
    } catch (e: any) {
      alert('Erro na conexão: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-white p-5">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold italic uppercase text-blue-500">Styllus Pro</h1>
        <button onClick={handleLogout} className="p-2 text-red-500">
          <LogOut size={24} />
        </button>
      </header>

      <main className="space-y-6">
        {/* Notificações Banner */}
        {(!isSubscribed || permissionStatus === 'default') && permissionStatus !== 'denied' && (
          <section className="bg-blue-600/20 border border-blue-600/30 p-6 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="text-blue-500" size={28} />
              <div>
                <p className="text-lg font-bold">Conectar Avisos</p>
                <p className="text-xs text-zinc-400">Ative para ouvir o som de novos clientes.</p>
              </div>
            </div>
            <button 
              onClick={handleRequestPermission}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
            >
              {syncing ? <Loader2 className="animate-spin" /> : <Bell size={20} />}
              {syncing ? 'CONECTANDO...' : 'ATIVAR AGORA'}
            </button>
          </section>
        )}

        {isSubscribed && permissionStatus === 'granted' && (
          <section className="bg-green-600/20 border border-green-600/30 p-4 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Check className="text-green-500" />
              <p className="text-xs font-bold text-green-500 uppercase tracking-wider">Avisos Ativados</p>
            </div>
            <button 
              onClick={handleRequestPermission}
              className="text-[10px] text-zinc-500 underline"
            >
              Re-sincronizar
            </button>
          </section>
        )}

        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Hoje</h2>
          <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{appointments.length} agendamentos</span>
        </div>
        
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Scissors size={40} className="mb-4" />
            <p className="text-sm italic">Nenhum cliente para hoje.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <div key={appt.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group active:bg-zinc-800 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <p className="text-sm font-black text-white">
                      {new Date(appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="font-bold text-zinc-200">{appt.client?.full_name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">{appt.service?.name}</p>
                </div>
                
                {appt.status !== 'concluído' && (
                  <button 
                    onClick={() => {
                      supabase.from('appointments').update({ status: 'concluído' }).eq('id', appt.id).then(() => fetchData());
                    }}
                    className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 p-3 rounded-xl border border-blue-600/20 transition-all"
                  >
                    <Check size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
