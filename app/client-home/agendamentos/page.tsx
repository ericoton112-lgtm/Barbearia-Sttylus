'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Grid, Calendar, Clock, Clock4, User as UserIcon, Scissors, XCircle, MoreVertical } from 'lucide-react';

export default function MeusAgendamentosPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) setProfile(profileData);

    const { data: appts } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        barber:profiles!barber_id (full_name, avatar_url),
        service:services!service_id (name, price, duration_minutes)
      `)
      .eq('client_id', user.id)
      .order('appointment_date', { ascending: false });

    if (appts) setAppointments(appts);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (id: string, serviceName: string) => {
    if (confirm(`Tem certeza que deseja cancelar o agendamento de ${serviceName}?`)) {
      const { error } = await supabase.from('appointments').update({ status: 'cancelado' }).eq('id', id);
      if (error) {
        alert('Erro ao cancelar agendamento.');
        console.error(error);
      } else {
        alert('Agendamento cancelado com sucesso.');
        fetchData();
      }
    }
  };

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.appointment_date) > now && a.status !== 'cancelado' && a.status !== 'concluído');
  const past = appointments.filter(a => new Date(a.appointment_date) <= now || a.status === 'cancelado' || a.status === 'concluído');

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md fixed top-0 w-full z-40 border-b border-zinc-900 px-5 pt-8 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Histórico</h1>
      </header>

      <main className="pt-28 px-5">
        {/* Upcoming */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Próximos Agendamentos</h2>
          <div className="space-y-4">
            {upcoming.length === 0 ? (
               <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center flex flex-col items-center justify-center gap-2">
                 <Clock className="text-zinc-500 size-8 mb-2" />
                 <p className="text-zinc-400 font-semibold text-sm">Nenhum agendamento futuro.</p>
                 <Link href="/client-home/agendar" className="text-primary-container font-bold text-sm mt-2">Agendar Agora</Link>
               </div>
            ) : (
               upcoming.map(appt => (
                 <div key={appt.id} className="bg-zinc-900 rounded-xl border-l-4 border-primary-container p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-xs text-primary-container font-bold uppercase tracking-widest mb-1">{formatDate(appt.appointment_date)} • {formatTime(appt.appointment_date)}</p>
                       <h3 className="font-bold text-white text-lg">{appt.service?.name}</h3>
                       <p className="text-zinc-400 text-sm mt-1 flex items-center gap-1">com {appt.barber?.full_name}</p>
                     </div>
                     <button 
                       onClick={() => handleCancel(appt.id, appt.service?.name)}
                       className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors flex flex-col items-center justify-center border border-red-500/20"
                       title="Cancelar Agendamento"
                     >
                       <XCircle className="size-5 mb-1" />
                       <span className="text-[8px] uppercase font-bold tracking-widest">Cancelar</span>
                     </button>
                   </div>
                 </div>
               ))
            )}
          </div>
        </section>

        {/* Past */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Anteriores</h2>
          <div className="space-y-3">
            {past.length === 0 ? (
               <p className="text-zinc-500 text-sm text-center py-4">Nenhum histórico encontrado.</p>
            ) : (
               past.map(appt => (
                 <div key={appt.id} className="p-4 rounded-xl flex items-center justify-between transition-all bg-[#1A1A1A] border border-zinc-800 opacity-70">
                   <div className="flex items-center gap-4">
                     <div className="text-center w-14 shrink-0">
                       <span className="block text-sm font-bold text-zinc-400">{formatDate(appt.appointment_date).slice(0,5)}</span>
                       <span className="block text-xl font-bold text-white">{formatTime(appt.appointment_date)}</span>
                     </div>
                     <div className="h-8 w-[1px] bg-zinc-800"></div>
                     <div>
                       <h4 className="font-bold text-white">{appt.service?.name}</h4>
                       <p className="text-zinc-400 text-xs mt-0.5">{appt.barber?.full_name}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${appt.status === 'cancelado' ? 'text-red-500 bg-red-500/10' : appt.status === 'concluído' ? 'text-green-500 bg-green-500/10' : 'text-zinc-400 bg-zinc-800'}`}>
                       {appt.status}
                     </span>
                   </div>
                 </div>
               ))
            )}
          </div>
        </section>
      </main>
      </div>

      {/* Bottom Nav */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem href="/client-home" icon={<Grid />} label="Início" />
        <NavItem href="/client-home/agendar" icon={<Calendar />} label="Agendar" />
        <NavItem active href="/client-home/agendamentos" icon={<Clock4 />} label="Histórico" />
        <NavItem href="/client-home/perfil" icon={<UserIcon />} label="Perfil" />
      </nav>
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
