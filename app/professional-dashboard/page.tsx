'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
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
  BellRing,
  Grid,
  User,
  Clock,
  MoreVertical,
  CheckCircle,
  Timer,
  Edit3,
  DollarSign
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
  const [isAccepting, setIsAccepting] = useState(true);
  const [barberName, setBarberName] = useState('');
  
  // Stats
  const [statsFilter, setStatsFilter] = useState<'semana' | 'mes'>('mes');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [weeklyCompleted, setWeeklyCompleted] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [monthlyCompleted, setMonthlyCompleted] = useState(0);
  const [nextClient, setNextClient] = useState<any>(null);
  
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Fetch Profile for is_accepting status and name
      const { data: prof } = await supabase.from('profiles').select('full_name, is_accepting_appointments').eq('id', user.id).single();
      if (prof) {
        setIsAccepting(prof.is_accepting_appointments);
        setBarberName(prof.full_name?.split(' ')[0] || ''); // Pega apenas o primeiro nome
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // 1. Fetch Today's Appointments (for the list)
      const { data: appts } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client:profiles!client_id (full_name, avatar_url),
          service:services!service_id (name, price, duration_minutes)
        `)
        .eq('barber_id', user.id)
        .gte('appointment_date', today.toISOString())
        .lt('appointment_date', tomorrow.toISOString())
        .neq('status', 'cancelado')
        .order('appointment_date', { ascending: true });

      if (appts) {
        setAppointments(appts);
        setTotalAppointments(appts.length);
        
        const earnings = appts
          .filter(a => a.status === 'concluído')
          .reduce((acc, a) => acc + (Number(a.service?.price) || 0), 0);
        setTotalEarnings(earnings);
      }

      // 2. Fetch THE Next Client (even if tomorrow)
      const now = new Date();
      const { data: nextAppt } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client:profiles!client_id (full_name, avatar_url),
          service:services!service_id (name, price, duration_minutes)
        `)
        .eq('barber_id', user.id)
        .gt('appointment_date', now.toISOString())
        .eq('status', 'confirmado')
        .order('appointment_date', { ascending: true })
        .limit(1)
        .single();

      setNextClient(nextAppt || null);

      // 3. Fetch Monthly Stats
      const { data: monthData } = await supabase
        .from('appointments')
        .select(`status, service:services!service_id (price)`)
        .eq('barber_id', user.id)
        .gte('appointment_date', monthStart.toISOString())
        .eq('status', 'concluído');

      if (monthData) {
        const mEarnings = monthData.reduce((acc, a) => acc + (Number(a.service?.price) || 0), 0);
        setMonthlyEarnings(mEarnings);
        setMonthlyCompleted(monthData.length);
      }

      // 4. Fetch Weekly Stats
      const weekStart = new Date(today);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
      weekStart.setDate(diff);
      weekStart.setHours(0,0,0,0);

      const { data: weekData } = await supabase
        .from('appointments')
        .select(`status, service:services!service_id (price)`)
        .eq('barber_id', user.id)
        .gte('appointment_date', weekStart.toISOString())
        .eq('status', 'concluído');

      if (weekData) {
        const wEarnings = weekData.reduce((acc, a) => acc + (Number(a.service?.price) || 0), 0);
        setWeeklyEarnings(wEarnings);
        setWeeklyCompleted(weekData.length);
      }

      setLoading(false);

      // Check Notification Status
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

  const handleCheckIn = async (id: string) => {
    const { error } = await supabase.from('appointments').update({ status: 'concluído' }).eq('id', id);
    if (!error) fetchData();
  };

  const handleToggleOpen = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const nextStatus = !isAccepting;
    setIsAccepting(nextStatus);
    
    await supabase.from('profiles').update({ is_accepting_appointments: nextStatus }).eq('id', user.id);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando Painel Premium...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28 relative overflow-hidden">
      {/* Imagem de Fundo Cinematográfica */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover opacity-10 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/95 to-[#0a0a0a]"></div>
      </div>

      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="relative z-10">
        <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-40 border-b border-zinc-900">
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">{getGreeting()}, {barberName},</p>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Barbearia Styllus</h1>
          </div>
          <div className="flex items-center gap-3">
             {/* Toggle Status Pílula */}
             <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 items-center">
               <button 
                 onClick={() => !isAccepting && handleToggleOpen()}
                 className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-300 ${isAccepting ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'text-zinc-600 hover:text-zinc-400'}`}
               >
                 <div className={`w-1.5 h-1.5 rounded-full ${isAccepting ? 'bg-white animate-pulse' : 'bg-zinc-700'}`}></div>
                 <span className="text-[9px] font-black uppercase tracking-widest">ON</span>
               </button>
               <button 
                 onClick={() => isAccepting && handleToggleOpen()}
                 className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-300 ${!isAccepting ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-600 hover:text-zinc-400'}`}
               >
                 <div className={`w-1.5 h-1.5 rounded-full ${!isAccepting ? 'bg-white' : 'bg-zinc-700'}`}></div>
                 <span className="text-[9px] font-black uppercase tracking-widest">OFF</span>
               </button>
             </div>

             <button 
                onClick={handleRequestPermission}
                className={`p-2.5 rounded-xl transition-all active:scale-90 ${isSubscribed ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 bg-zinc-900'}`}
             >
               {syncing ? <Loader2 className="animate-spin" size={20} /> : <BellRing size={20} />}
             </button>
             <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'; }}
                className="p-2.5 text-red-500 bg-red-500/10 rounded-xl active:scale-90"
             >
               <LogOut size={20} />
             </button>
          </div>
        </header>

        <main className="px-6 mt-8 space-y-8">
          {/* Sincronização Banner se desativado */}
          {!isSubscribed && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bell className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Avisos Offline</p>
                  <p className="text-[10px] opacity-80">Conecte para receber alertas sonoros.</p>
                </div>
              </div>
              <button 
                onClick={handleRequestPermission}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95"
              >
                Conectar
              </button>
            </div>
          )}

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between h-36">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Faturamento Hoje</span>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-blue-500">R$ {totalEarnings.toFixed(2).replace('.', ',')}</span>
                <span className="text-[10px] text-green-500 font-bold">Hoje • {appointments.filter(a => a.status === 'concluído').length} cortes</span>
              </div>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between h-36 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {statsFilter === 'semana' ? 'Esta Semana' : 'Mês Atual'}
                </span>
                
                {/* Filtro Semana/Mês */}
                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                   <button 
                    onClick={() => setStatsFilter('semana')}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${statsFilter === 'semana' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}
                   >
                    Sem
                   </button>
                   <button 
                    onClick={() => setStatsFilter('mes')}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${statsFilter === 'mes' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}
                   >
                    Mês
                   </button>
                </div>
              </div>

              <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500" key={statsFilter}>
                <span className="text-2xl font-black text-white">
                  R$ {(statsFilter === 'semana' ? weeklyEarnings : monthlyEarnings).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold">
                  {(statsFilter === 'semana' ? weeklyCompleted : monthlyCompleted)} cortes realizados
                </span>
              </div>
              
              {/* Efeito Visual de fundo do Card */}
              <TrendingUp size={60} className="absolute -bottom-4 -right-4 text-white/5 -rotate-12 group-hover:scale-110 transition-transform" />
            </div>
          </section>

          {/* Next Client Card */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Próximo Cliente</h2>
            </div>
            {nextClient ? (
              <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-blue-900/30 overflow-hidden shadow-2xl shadow-blue-900/10">
                <div className="bg-blue-600 px-5 py-2.5 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <Timer size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Em Instantes</span>
                   </div>
                   <span className="text-xs font-black">
                     {new Date(nextClient.appointment_date).toDateString() === new Date().toDateString() 
                       ? formatTime(nextClient.appointment_date) 
                       : new Date(nextClient.appointment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + formatTime(nextClient.appointment_date)
                     }
                   </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-zinc-800 rounded-full border-2 border-blue-600 flex items-center justify-center overflow-hidden">
                      {nextClient.client?.avatar_url ? <img src={nextClient.client.avatar_url} className="w-full h-full object-cover" /> : <User className="text-zinc-500" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white leading-none mb-1">{nextClient.client?.full_name}</h3>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{nextClient.service?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleCheckIn(nextClient.id)}
                      className="bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <CheckCircle size={16} /> Check-in
                    </button>
                    <button className="bg-zinc-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <Edit3 size={16} /> Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800 border-dashed p-10 text-center flex flex-col items-center gap-3">
                 <Calendar className="text-zinc-700" size={32} />
                 <p className="text-zinc-500 text-sm italic">Nenhum cliente na fila no momento.</p>
              </div>
            )}
          </section>

          {/* Daily View List */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Agenda de Hoje</h2>
              <button onClick={fetchData} className="p-2 bg-zinc-900 rounded-lg text-zinc-500 active:rotate-180 transition-all">
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <p className="text-zinc-600 text-center text-sm py-10">Sua agenda está vazia para hoje.</p>
              ) : (
                appointments.map((appt) => (
                  <div 
                    key={appt.id} 
                    className={`bg-zinc-900/60 border ${appt.status === 'concluído' ? 'border-zinc-800 opacity-50' : 'border-zinc-800'} p-5 rounded-2xl flex items-center justify-between group active:bg-zinc-800 transition-all`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[50px]">
                        <span className="block text-lg font-black text-white">{formatTime(appt.appointment_date)}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{appt.service?.duration_minutes}m</span>
                      </div>
                      <div className="w-[1px] h-8 bg-zinc-800"></div>
                      <div>
                        <h4 className="font-bold text-white text-base leading-tight">{appt.client?.full_name}</h4>
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">{appt.service?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {appt.status !== 'concluído' ? (
                        <button 
                          onClick={() => handleCheckIn(appt.id)}
                          className="bg-blue-600/10 text-blue-500 p-2.5 rounded-xl border border-blue-600/20 active:scale-90 transition-all"
                        >
                          <Check size={20} />
                        </button>
                      ) : (
                        <div className="bg-zinc-800 p-2 rounded-full text-green-500">
                          <Check size={16} />
                        </div>
                      )}
                      <button className="text-zinc-700 p-1">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bg-zinc-950/95 backdrop-blur-2xl fixed bottom-0 w-full rounded-t-[32px] z-50 border-t border-zinc-900 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] flex justify-around items-center h-24 px-6 pb-6">
        <NavItem active href="/professional-dashboard" icon={<Grid size={24} />} label="Início" />
        <NavItem href="/professional-dashboard/agenda" icon={<Calendar size={24} />} label="Agenda" />
        <NavItem href="/professional-dashboard/equipe" icon={<Users size={24} />} label="Equipe" />
        <NavItem href="/professional-dashboard/servicos" icon={<Scissors size={24} />} label="Serviços" />
        <NavItem href="/professional-dashboard/perfil" icon={<User size={24} />} label="Perfil" />
      </nav>
    </div>
  );
}

function NavItem({ active, icon, label, href }: { active?: boolean, icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-75 ${active ? 'text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110' : 'text-zinc-600'}`}>
      <div className={`${active ? 'mb-1' : 'mb-1 opacity-70'}`}>{icon}</div>
      <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    </Link>
  );
}
