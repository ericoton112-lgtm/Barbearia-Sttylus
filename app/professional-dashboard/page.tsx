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

  const handleRequestPermission = async () => {
    // TESTE DE CLIQUE
    alert('Botão apertado! Tentando conectar...');
    
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
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          alert('Erro: Chave VAPID não encontrada.');
          return;
        }

        const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        const subJson = sub.toJSON();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await supabase.from('push_subscriptions').upsert({
            user_id: user.id,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth
          }, { onConflict: 'endpoint' });
        }
        setIsSubscribed(true);
        alert('Sincronizado com sucesso!');
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
        <h1 className="text-xl font-bold italic uppercase">Painel Styllus</h1>
        <button onClick={handleLogout} className="p-2 text-red-500">
          <LogOut size={24} />
        </button>
      </header>

      <main className="space-y-6">
        {/* Notificações Banner */}
        {(!isSubscribed || permissionStatus === 'default') && permissionStatus !== 'denied' && (
          <section className="bg-blue-600/20 border border-blue-600/30 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="text-blue-500" size={28} />
              <div>
                <p className="text-lg font-bold">Conectar Notificações</p>
                <p className="text-xs text-zinc-400">Clique no botão abaixo para receber avisos.</p>
              </div>
            </div>
            <button 
              onClick={handleRequestPermission}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
            >
              {syncing ? <Loader2 className="animate-spin" /> : <Bell size={20} />}
              {syncing ? 'CONECTANDO...' : 'CONECTAR AGORA'}
            </button>
          </section>
        )}

        {isSubscribed && permissionStatus === 'granted' && (
          <section className="bg-green-600/20 border border-green-600/30 p-4 rounded-xl flex items-center gap-3">
            <Check className="text-green-500" />
            <p className="text-xs font-bold text-green-500">Notificações Ativas!</p>
          </section>
        )}

        <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2 uppercase tracking-tighter">Agenda de Hoje</h2>
        
        {appointments.length === 0 ? (
          <p className="text-zinc-500 text-center py-10 italic">Nenhum agendamento encontrado.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map(appt => (
              <div key={appt.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-blue-500">
                    {new Date(appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="font-bold">{appt.client?.full_name}</p>
                  <p className="text-xs text-zinc-400">{appt.service?.name}</p>
                </div>
                
                {appt.status !== 'concluído' && (
                  <button 
                    onClick={() => {
                      supabase.from('appointments').update({ status: 'concluído' }).eq('id', appt.id).then(() => fetchData());
                    }}
                    className="bg-blue-600 p-3 rounded-xl"
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
