'use client';

import { useEffect, useState, useRef } from 'react';
import { Grid, Calendar, User as UserIcon, Scissors, ChevronLeft, ChevronRight, MoreVertical, Users } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';

export default function ProfessionalAgendaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate an array of dates (e.g. 3 days before today to 14 days after)
  const [dates, setDates] = useState<Date[]>([]);
  
  useEffect(() => {
    const today = new Date();
    const arr = [];
    for (let i = -3; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    setDates(arr);
    
    // Auto center the selected date after a small delay
    setTimeout(() => {
       if (scrollRef.current) {
          const selectedEl = scrollRef.current.querySelector('.selected-date');
          if (selectedEl) {
             selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
       }
    }, 100);
  }, []);

  const fetchAppointments = async (date: Date) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: appts } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client:profiles!client_id (full_name, phone),
          service:services!service_id (name, price, duration_minutes)
        `)
        .eq('barber_id', user.id)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString())
        .order('appointment_date', { ascending: true });

      setAppointments(appts || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    fetchAppointments(selectedDate);
  };

  const getDayName = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md fixed top-0 w-full z-40 px-5 pt-8 pb-4 border-b border-zinc-900">
        <h1 className="text-2xl font-black text-white mb-4">Agenda</h1>
        
        {/* Date Selector */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x"
        >
          {dates.map((date, idx) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`snap-center shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all ${
                  isSelected 
                    ? 'bg-primary-container border-primary-container text-white selected-date shadow-[0_0_12px_rgba(0,87,255,0.4)]' 
                    : isToday
                      ? 'bg-zinc-800/80 border-zinc-600 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-blue-200' : ''}`}>
                  {getDayName(date)}
                </span>
                <span className="text-2xl font-bold leading-none">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="pt-[200px] px-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 capitalize">
            <Calendar className="size-5 text-primary-container" />
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {appointments.length > 0 && !loading && (
             <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded-lg">
               {appointments.length} cliente{appointments.length !== 1 && 's'}
             </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl flex items-center justify-between bg-[#1A1A1A] border-l-4 border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-8 bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-10 w-[1px] bg-zinc-800 shrink-0"></div>
                  <div className="flex flex-col gap-2">
                    <div className="w-32 h-5 bg-zinc-800 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-zinc-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.length === 0 ? (
               <div className="bg-zinc-900 rounded-xl p-10 border border-zinc-800 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                    <Calendar className="text-zinc-500 size-8" />
                  </div>
                  <p className="text-zinc-400 font-semibold">Nenhum agendamento para este dia.</p>
               </div>
            ) : (
              appointments.map((appt) => (
                 <TimeSlot 
                   key={appt.id}
                   id={appt.id}
                   time={formatTime(appt.appointment_date)} 
                   client={appt.client?.full_name || 'Cliente'}
                   phone={appt.client?.phone || ''}
                   service={appt.service?.name} 
                   duration={`${appt.service?.duration_minutes}m`} 
                   status={appt.status} 
                   onStatusChange={handleStatusChange}
                 />
              ))
            )}
          </div>
        )}
      </main>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem href="/professional-dashboard" icon={<Grid />} label="Início" />
        <NavItem active href="/professional-dashboard/agenda" icon={<Calendar />} label="Agenda" />
        <NavItem href="/professional-dashboard/equipe" icon={<Users />} label="Equipe" />
        <NavItem href="/professional-dashboard/servicos" icon={<Scissors />} label="Serviços" />
        <NavItem href="/professional-dashboard/perfil" icon={<UserIcon />} label="Perfil" />
      </nav>
    </div>
  );
}

function TimeSlot({ id, time, client, phone, service, duration, status, onStatusChange }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isConcluido = status === 'concluído';
  const isCancelado = status === 'cancelado';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl flex items-center justify-between transition-all bg-[#1A1A1A] relative ${isConcluido ? 'border-l-4 border-green-600 opacity-60' : isCancelado ? 'border-l-4 border-red-600 opacity-40' : 'border-l-4 border-blue-600'}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-center w-14 shrink-0">
          <span className="block text-xl font-bold text-white">{time}</span>
        </div>
        <div className="h-10 w-[1px] bg-zinc-800 shrink-0"></div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-bold truncate ${isConcluido ? 'text-zinc-400 line-through' : 'text-white'}`}>{client}</h4>
          </div>
          {phone && (
            <p className="text-blue-400 text-xs font-semibold mb-0.5">{phone}</p>
          )}
          <p className="text-zinc-400 text-sm flex items-center gap-1 truncate">
            <Scissors className="size-3 shrink-0" /> <span className="truncate">{service}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 relative">
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${isConcluido ? 'text-green-500 bg-green-500/10' : isCancelado ? 'text-red-500 bg-red-500/10' : 'text-blue-500 bg-blue-600/10'}`}>{duration}</span>
        
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
          <MoreVertical className="text-zinc-500 size-5" />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
            <div className="absolute right-0 top-10 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              {!isConcluido && !isCancelado && (
                <button 
                  onClick={() => { onStatusChange(id, 'concluído'); setMenuOpen(false); }}
                  className="px-4 py-3 text-sm text-left text-green-500 font-bold hover:bg-zinc-800 transition-colors"
                >
                  Marcar como Concluído
                </button>
              )}
              {!isCancelado && !isConcluido && (
                <button 
                  onClick={() => { onStatusChange(id, 'cancelado'); setMenuOpen(false); }}
                  className="px-4 py-3 text-sm text-left text-red-500 font-bold hover:bg-zinc-800 transition-colors"
                >
                  Cancelar Agendamento
                </button>
              )}
              {(isConcluido || isCancelado) && (
                <button 
                  onClick={() => { onStatusChange(id, 'pendente'); setMenuOpen(false); }}
                  className="px-4 py-3 text-sm text-left text-blue-500 font-bold hover:bg-zinc-800 transition-colors"
                >
                  Restaurar Agendamento
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
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
