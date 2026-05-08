'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Check, Bell } from 'lucide-react';

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
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check existing subscription
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch (e) {
      console.error('Error checking sub', e);
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
  };

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleComplete = async (id: string) => {
    await supabase.from('appointments').update({ status: 'concluído' }).eq('id', id);
    fetchData();
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          console.error('VAPID key missing');
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
          // Check if already in DB
          const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('endpoint', subJson.endpoint)
            .single();

          if (!existing) {
            await supabase.from('push_subscriptions').insert({
              user_id: user.id,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys?.p256dh,
              auth: subJson.keys?.auth
            });
          }
        }
        setIsSubscribed(true);
      } catch (e) {
        console.error('Subscription failed:', e);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
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
          <section className="bg-blue-600/20 border border-blue-600/30 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="text-blue-500" />
              <div>
                <p className="text-sm font-bold">
                  {permissionStatus === 'granted' ? 'Sincronizar Notificações' : 'Ativar Notificações'}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {permissionStatus === 'granted' ? 'Clique para finalizar a conexão.' : 'Receba alertas de novos clientes.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleRequestPermission}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              {permissionStatus === 'granted' ? 'CONECTAR' : 'ATIVAR'}
            </button>
          </section>
        )}

        {permissionStatus === 'denied' && (
          <section className="bg-red-600/20 border border-red-600/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-500">Notificações Bloqueadas</p>
                <p className="text-[10px] text-zinc-400">Por favor, libere as notificações nas configurações do seu navegador para receber alertas.</p>
              </div>
            </div>
          </section>
        )}

        {isSubscribed && permissionStatus === 'granted' && (
          <section className="bg-green-600/20 border border-green-600/30 p-4 rounded-xl flex items-center gap-3">
            <Check className="text-green-500" />
            <p className="text-xs font-bold text-green-500">Notificações Ativas!</p>
          </section>
        )}

        <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2">Agendamentos de Hoje</h2>
        
        {appointments.length === 0 ? (
          <p className="text-zinc-500 text-center py-10">Nenhum agendamento para hoje.</p>
        ) : (
          appointments.map(appt => (
            <div key={appt.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-blue-500">
                  {new Date(appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="font-bold">{appt.client?.full_name}</p>
                <p className="text-xs text-zinc-400">{appt.service?.name}</p>
              </div>
              
              {appt.status !== 'concluído' ? (
                <button 
                  onClick={() => handleComplete(appt.id)}
                  className="bg-blue-600 p-2 rounded-lg"
                >
                  <Check size={20} />
                </button>
              ) : (
                <span className="text-green-500 text-xs font-bold">OK</span>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
