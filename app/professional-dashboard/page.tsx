'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LogOut, 
  Check, 
  Bell, 
  Loader2, 
  Calendar, 
  Users, 
  TrendingUp, 
  Scissors,
  RefreshCw,
  BellRing
} from 'lucide-react';

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
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const router = useRouter();

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
          client:profiles!client_id (full_name, avatar_url),
          service:services!service_id (name, price)
        `)
        .eq('barber_id', user.id)
        .gte('appointment_date', today + 'T00:00:00')
        .lte('appointment_date', today + 'T23:59:59')
        .order('appointment_date', { ascending: true });

      if (appts) {
        setAppointments(appts);
        setStats({
          total: appts.length,
          pending: appts.filter(a => a.status === 'confirmado').length,
          completed: appts.filter(a => a.status === 'concluído').length
        });
      }
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

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    
    setSyncing(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
        await navigator.serviceWorker.register('/sw.js');
      }

      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BFVMa0nULV7_Yu2LcL0Di5eyXdtnMzCZml-QWX7kHzHa8Pw_EmtPhE0v432Enkd_KJSWnZkcl1ThKO1Js_wIxH8";
        
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
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando Agenda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-10">
      {/* Header Fixo Minimalista */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-blue-500">Styllus Pro</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Dashboard Barber</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRequestPermission}
            className={`p-2 rounded-full transition-colors ${isSubscribed ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 bg-zinc-900'}`}
          >
            {syncing ? <Loader2 className="animate-spin" size={20} /> : <BellRing size={20} />}
          </button>
          <button 
            onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'; }}
            className="p-2 text-red-500 bg-red-500/10 rounded-full"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="px-6 mt-6 space-y-8">
        {/* Banner de Sincronização se necessário */}
        {!isSubscribed && (
          <div className="bg-blue-600 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-900/20">
            <div className="flex items-center gap-3">
              <Bell className="text-white" />
              <div>
                <p className="text-sm font-bold">Avisos Desativados</p>
                <p className="text-[10px] opacity-80">Clique para sincronizar agora.</p>
              </div>
            </div>
            <button 
              onClick={handleRequestPermission}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase"
            >
              Conectar
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Total</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
          <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Fila</p>
            <p className="text-2xl font-black text-blue-500">{stats.pending}</p>
          </div>
          <div className="bg-green-600/10 border border-green-600/20 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-green-500 font-bold uppercase mb-1">OK</p>
            <p className="text-2xl font-black text-green-500">{stats.completed}</p>
          </div>
        </section>

        {/* Agenda Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="text-blue-500" size={20} />
              Agenda de Hoje
            </h2>
            <button onClick={fetchData} className="text-zinc-500 active:rotate-180 transition-transform">
              <RefreshCw size={18} />
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-900 border-dashed">
              <Scissors size={40} className="text-zinc-800 mb-4" />
              <p className="text-zinc-600 text-sm italic">Nenhum cliente agendado para hoje.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div 
                  key={appt.id} 
                  className={`relative overflow-hidden bg-zinc-900 border ${appt.status === 'concluído' ? 'border-zinc-800 opacity-60' : 'border-zinc-800'} p-5 rounded-2xl flex items-center justify-between group transition-all`}
                >
                  {appt.status !== 'concluído' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <p className="text-blue-500 font-black text-lg leading-none">
                        {new Date(appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{appt.client?.full_name}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">{appt.service?.name}</p>
                    </div>
                  </div>

                  {appt.status !== 'concluído' ? (
                    <button 
                      onClick={() => {
                        supabase.from('appointments').update({ status: 'concluído' }).eq('id', appt.id).then(() => fetchData());
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg shadow-blue-900/40 active:scale-90 transition-all"
                    >
                      <Check size={20} />
                    </button>
                  ) : (
                    <div className="bg-zinc-800 p-2 rounded-full text-green-500">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
