'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, Grid, Calendar, User, Scissors, Plus, Timer, MoreVertical, CheckCircle, Edit3, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        if (profileData.role === 'client') {
          router.replace('/client-home');
          return;
        }
        setProfile(profileData);
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
          service:services!service_id (name, price, duration_minutes)
        `)
        .eq('barber_id', user.id)
        .gte('appointment_date', todayStart.toISOString())
        .lte('appointment_date', todayEnd.toISOString())
        .order('appointment_date', { ascending: true });

      if (appts) setAppointments(appts);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthAppts } = await supabase
        .from('appointments')
        .select(`
          status,
          service:services!service_id (price)
        `)
        .eq('barber_id', user.id)
        .gte('appointment_date', monthStart.toISOString())
        .lte('appointment_date', todayEnd.toISOString());

      if (monthAppts) setMonthlyAppointments(monthAppts);

      // Fetch Notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notifs) setNotifications(notifs);

      // Push Notification Subscription
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const existingSub = await registration.pushManager.getSubscription();
          
          if (!existingSub && Notification.permission === 'granted' && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            const applicationServerKey = urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
            const newSub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey
            });
            
            const subJson = newSub.toJSON();
            
            // Save to DB
            await supabase.from('push_subscriptions').insert({
              user_id: user.id,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys?.p256dh,
              auth: subJson.keys?.auth
            });
          }
        } catch (e) {
          console.error('Push error:', e);
        }
      }

    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    let channel: any;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      channel = supabase
        .channel(`realtime_notifications_${Date.now()}_${Math.random()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            // Tocar som de sino
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(console.error);
            
            // Adicionar nova notificação ao topo
            setNotifications(prev => [payload.new, ...prev]);
            
            // Recarregar agendamentos para atualizar o dashboard
            fetchData();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleCheckIn = async (id: string) => {
    await supabase.from('appointments').update({ status: 'concluído' }).eq('id', id);
    fetchData();
  };

  const toggleStatus = async () => {
    if (!profile) return;
    const newStatus = !profile.is_accepting_appointments;
    setProfile({ ...profile, is_accepting_appointments: newStatus });
    await supabase.from('profiles').update({ is_accepting_appointments: newStatus }).eq('id', profile.id);
  };

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    // Mark as read when opening
    if (!showNotifications) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Cálculos dinâmicos
  const totalEarnings = appointments
    .filter(a => a.status === 'concluído' || a.status === 'confirmado')
    .reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
  
  const totalAppointments = appointments.length;

  const monthlyEarnings = monthlyAppointments
    .filter(a => a.status === 'concluído' || a.status === 'confirmado')
    .reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
    
  const monthlyCompleted = monthlyAppointments.filter(a => a.status === 'concluído' || a.status === 'confirmado').length;

  const now = new Date();
  const nextClient = appointments.find(a => new Date(a.appointment_date) > now && a.status !== 'cancelado' && a.status !== 'concluído');

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const hasUnread = notifications.some(n => !n.is_read);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === 'granted') {
      fetchData(); // Tenta inscrever agora que tem permissão
    }
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-28 relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop" 
          alt="Barbershop Background" 
          className="w-full h-full object-cover opacity-[0.15] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#131313]/40 via-[#131313]/80 to-[#131313]"></div>
      </div>

      <div className="relative z-10">
      {/* TopAppBar */}
      <header className="bg-zinc-950/80 backdrop-blur-md fixed top-0 w-full z-40 border-b border-zinc-900 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <Link href="/professional-dashboard/perfil" className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary-container bg-zinc-800 flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-lg cursor-pointer">
             {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <User className="text-zinc-500 size-5" />
             )}
          </Link>
          <h1 className="text-[16px] sm:text-lg font-black tracking-tighter text-white uppercase italic font-sans shrink-0 truncate">BARBEARIA STYLLUS</h1>
          {profile && (
            <div className="flex items-center gap-2 ml-auto shrink-0 mr-2">
              <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${profile.is_accepting_appointments ? 'text-primary-container drop-shadow-[0_0_8px_rgba(0,87,255,0.5)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                {profile.is_accepting_appointments ? 'ON' : 'OFF'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={profile.is_accepting_appointments} 
                  onChange={toggleStatus} 
                />
                <div className={`w-12 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all border shadow-inner ${profile.is_accepting_appointments ? 'bg-primary-container border-primary-container/80 shadow-[0_0_15px_rgba(0,87,255,0.4)] after:bg-white' : 'bg-red-500/20 border-red-500/50 after:bg-red-500'}`}></div>
              </label>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleOpenNotifications} className="relative text-primary-container p-2 shrink-0 hover:bg-zinc-800 rounded-full transition-colors">
            <Bell className="size-6" />
            {hasUnread && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-zinc-900 animate-pulse"></span>}
          </button>
          <button onClick={handleLogout} className="text-red-500/80 hover:text-red-500 active:scale-95 p-2 rounded-full hover:bg-red-500/10 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div key="notif-container" className="fixed inset-0 z-50 flex justify-end p-5 pt-20">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-80 max-h-[400px] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Notificações</h3>
                <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">Nenhuma notificação.</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-3 rounded-xl border ${notif.is_read ? 'bg-zinc-800/30 border-transparent' : 'bg-primary-container/10 border-primary-container/30'}`}>
                      <h4 className={`text-sm font-bold ${notif.is_read ? 'text-zinc-400' : 'text-white'}`}>{notif.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 px-5 space-y-8">
        {/* Welcome Section */}
        <section>
          <h1 className="text-3xl font-extrabold text-white">Painel</h1>
          <p className="text-[#c3c5d9]">Bem-vindo de volta, {profile ? profile.full_name?.split(' ')[0] : 'Barbeiro'}.</p>
        </section>

        {/* Notificações Banner */}
        {permissionStatus === 'default' && (
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-container/20 border border-primary-container/30 p-4 rounded-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary-container p-2 rounded-xl text-white">
                <Bell className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Ativar Notificações</h4>
                <p className="text-xs text-zinc-400">Receba alertas de novos agendamentos.</p>
              </div>
            </div>
            <button 
              onClick={handleRequestPermission}
              className="bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
            >
              ATIVAR
            </button>
          </motion.section>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container p-4 rounded-xl border border-zinc-900/50 flex flex-col justify-between h-32">
            <span className="label-caps text-zinc-500">Ganhos de Hoje</span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary-container">
                R$ {totalEarnings.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-green-500 font-bold">Atualizado agora</span>
            </div>
          </div>
          <div className="bg-surface-container p-4 rounded-xl border border-zinc-900/50 flex flex-col justify-between h-32">
            <span className="label-caps text-zinc-500">Agendamentos</span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">
                {totalAppointments.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold">marcados para hoje</span>
            </div>
          </div>
        </section>

        {/* Next Client Card */}
        <section>
          {nextClient ? (
            <div className="bg-zinc-900 rounded-xl overflow-hidden shadow-[0_0_12px_rgba(0,87,255,0.2)] border border-blue-900/30">
              <div className="bg-primary-container px-4 py-2 flex justify-between items-center">
                <span className="label-caps text-white">Próximo Cliente</span>
                <div className="flex items-center gap-1">
                  <Timer className="size-4 text-white" />
                  <span className="label-caps text-white">{formatTime(nextClient.appointment_date)}</span>
                </div>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-zinc-800 flex items-center justify-center rounded-full border-2 border-primary-container p-0.5">
                     <User className="text-zinc-500 size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{nextClient.client?.full_name || 'Cliente'}</h3>
                    <p className="text-zinc-400 text-sm">{nextClient.service?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-primary-container text-2xl font-bold leading-none">{nextClient.service?.duration_minutes}m</p>
                  <p className="label-caps text-[10px] text-zinc-500">Duração</p>
                </div>
              </div>
              <div className="px-6 pb-6 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleCheckIn(nextClient.id)}
                  className="bg-white text-black py-3 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <CheckCircle className="size-4" /> Check-in
                </button>
                <button className="border border-zinc-700 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Edit3 className="size-4" /> Editar
                </button>
              </div>
            </div>
          ) : (
             <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center flex flex-col items-center justify-center gap-3">
                <Calendar className="text-zinc-600 size-10" />
                <p className="text-zinc-400 font-semibold">Nenhum cliente na fila de espera hoje.</p>
             </div>
          )}
        </section>

        {/* Relatório Mensal */}
        <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/20 rounded-full blur-2xl"></div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Mês Atual</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-white">R$ {monthlyEarnings.toFixed(2).replace('.', ',')}</p>
              <p className="text-sm text-green-400 font-bold mt-1">+{monthlyCompleted} cortes realizados</p>
            </div>
            <div className="flex gap-1 items-end h-12">
              <div className="w-2 bg-zinc-800 rounded-t h-[30%]"></div>
              <div className="w-2 bg-zinc-800 rounded-t h-[50%]"></div>
              <div className="w-2 bg-zinc-700 rounded-t h-[40%]"></div>
              <div className="w-2 bg-primary-container rounded-t h-[80%]"></div>
              <div className="w-2 bg-primary-container/50 rounded-t h-[60%]"></div>
            </div>
          </div>
        </section>

        {/* Daily View */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Visão Diária</h3>
          </div>
          
          <div className="space-y-3">
            {appointments.length === 0 && (
               <p className="text-zinc-500 text-sm text-center py-4">Agenda livre o dia todo.</p>
            )}
            
            {appointments.map((appt) => (
               <TimeSlot 
                 key={appt.id}
                 time={formatTime(appt.appointment_date)} 
                 client={appt.client?.full_name || 'Cliente'} 
                 service={appt.service?.name} 
                 duration={`${appt.service?.duration_minutes}m`} 
                 status={appt.status} 
               />
            ))}
          </div>
        </section>
      </main>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem active href="/professional-dashboard" icon={<Grid />} label="Início" />
        <NavItem href="/professional-dashboard/agenda" icon={<Calendar />} label="Agenda" />
        <NavItem href="/professional-dashboard/equipe" icon={<Users />} label="Equipe" />
        <NavItem href="/professional-dashboard/servicos" icon={<Scissors />} label="Serviços" />
        <NavItem href="/professional-dashboard/perfil" icon={<User />} label="Perfil" />
      </nav>
    </div>
  );
}

function TimeSlot({ time, client, service, duration, status }: any) {
  const isConcluido = status === 'concluído';
  return (
    <div className={`p-4 rounded-xl flex items-center justify-between transition-all bg-[#1A1A1A] ${isConcluido ? 'border-l-4 border-green-600 opacity-60' : 'border-l-4 border-blue-600'}`}>
      <div className="flex items-center gap-4">
        <div className="text-center w-14 shrink-0">
          <span className="block text-xl font-bold text-white">{time}</span>
        </div>
        <div className="h-8 w-[1px] bg-zinc-800"></div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className={`font-bold ${isConcluido ? 'text-zinc-400 line-through' : 'text-white'}`}>{client}</h4>
          </div>
          <p className="text-zinc-400 text-sm flex items-center gap-1">
            <Scissors className="size-3" /> {service}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-2 py-1 rounded ${isConcluido ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-600/10'}`}>{duration}</span>
        <MoreVertical className="text-zinc-600 size-5" />
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, href }: { active?: boolean, icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${active ? 'text-primary-container drop-shadow-[0_0_8px_rgba(0,87,255,0.4)]' : 'text-zinc-500'}`}>
      <span className="size-6">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">{label}</span>
    </Link>
  );
}
