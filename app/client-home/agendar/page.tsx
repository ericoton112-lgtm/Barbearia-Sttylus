'use client';

import { useEffect, useState } from 'react';
import { Grid, Calendar, User as UserIcon, Scissors, ChevronLeft, CheckCircle, Clock, Clock4 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function AgendarPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedIntervals, setBookedIntervals] = useState<{start: number, end: number}[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<any[]>([]);

  const timeToMins = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const formatMins = (m: number) => {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    return `${h}:${min}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) setProfile(profileData);

      // Buscar serviços primeiro para pré-selecionar se houver na URL
      const { data: sData } = await supabase.from('services').select('*').order('name', { ascending: true });
      let initialService = null;
      if (sData) {
        setServices(sData);
        // Tentar pegar serviceId da URL
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const sId = params.get('serviceId');
          if (sId) {
            initialService = sData.find((s: any) => s.id === sId);
            if (initialService) {
              setSelectedService(initialService);
            }
          }
        }
      }

      const { data: bData } = await supabase.from('profiles').select('*').eq('role', 'barber');
      let initialBarber = null;
      if (bData) {
        const openBarbers = bData.filter((b: any) => b.is_accepting_appointments);
        setBarbers(openBarbers);
        
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const bId = params.get('barberId');
          if (bId) {
            initialBarber = openBarbers.find((b: any) => b.id === bId);
            if (initialBarber) setSelectedBarber(initialBarber);
          }
        }

        // Auto select se só tiver 1 barbeiro aberto
        if (openBarbers.length === 1 && !initialBarber) {
          setSelectedBarber(openBarbers[0]);
          initialBarber = openBarbers[0];
        }
      }

      // Set available dates based on barber's work_days
      if (initialBarber || openBarbers.length === 1) {
        const barber = initialBarber || openBarbers[0];
        const workDays = barber.work_days || [1,2,3,4,5,6];
        const dts = [];
        let curD = new Date();
        while(dts.length < 7) {
          if (workDays.includes(curD.getDay())) {
            dts.push(new Date(curD));
          }
          curD.setDate(curD.getDate() + 1);
        }
        setAvailableDates(dts);
      }

      // Definir Step inicial baseado no que veio da URL
      if (initialBarber && initialService) {
        setStep(3);
      } else if (initialService) {
        setStep(1); // Force selection of barber if service was passed but not barber
      } else if (initialBarber) {
        setStep(2); // Barber passed, now select service
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Atualiza datas disponíveis se mudar de barbeiro
    if (selectedBarber) {
      const workDays = selectedBarber.work_days || [1,2,3,4,5,6];
      const dts = [];
      let curD = new Date();
      while(dts.length < 7) {
        if (workDays.includes(curD.getDay())) {
          dts.push(new Date(curD));
        }
        curD.setDate(curD.getDate() + 1);
      }
      setAvailableDates(dts);
      setSelectedDate(null); // reseta
    }
  }, [selectedBarber]);

  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!selectedBarber || !selectedDate) return;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('appointments')
        .select('appointment_date, service:services!service_id(duration_minutes)')
        .eq('barber_id', selectedBarber.id)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString())
        .neq('status', 'cancelado');

      if (data) {
        const intervals = data.map(app => {
          const date = new Date(app.appointment_date);
          const startMins = date.getHours() * 60 + date.getMinutes();
          // @ts-ignore
          const duration = app.service?.duration_minutes || 30;
          return { start: startMins, end: startMins + duration };
        });
        setBookedIntervals(intervals);
      }
    };

    fetchBookedTimes();
  }, [selectedBarber, selectedDate]);

  useEffect(() => {
    if (!selectedBarber || !selectedDate || !selectedService) return;
    
    const workStart = timeToMins(selectedBarber.work_start_time || '09:00');
    const workEnd = timeToMins(selectedBarber.work_end_time || '19:00');
    const lunchStart = timeToMins(selectedBarber.lunch_start_time || '12:00');
    const lunchEnd = timeToMins(selectedBarber.lunch_end_time || '13:00');
    
    const duration = selectedService.duration_minutes || 30;
    const timesList = [];
    
    for (let m = workStart; m + duration <= workEnd; m += 30) {
      const slotEnd = m + duration;
      
      // Check lunch
      if ((m < lunchEnd && slotEnd > lunchStart)) {
        continue;
      }
      
      // Check past times if today
      const now = new Date();
      if (selectedDate.toDateString() === now.toDateString()) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (m <= nowMins) continue;
      }
      
      timesList.push({
        time: formatMins(m),
        start: m,
        end: slotEnd
      });
    }
    setAvailableTimes(timesList);
  }, [selectedBarber, selectedDate, selectedService]);

  const handleConfirm = async () => {
    if (!profile || !selectedBarber || !selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);

    try {
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Verificar se já existe agendamento igual (evitar duplicatas)
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', profile.id)
        .eq('barber_id', selectedBarber.id)
        .eq('appointment_date', appointmentDate.toISOString());

      if (existing && existing.length > 0) {
        alert('Você já tem um agendamento neste horário!');
        setSubmitting(false);
        return;
      }

      // 1. Inserir Agendamento
      const { error: apptError } = await supabase.from('appointments').insert({
        client_id: profile.id,
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        appointment_date: appointmentDate.toISOString(),
        status: 'confirmado'
      });

      if (apptError) throw apptError;

      // 2. Criar Notificação In-App para o Barbeiro
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: selectedBarber.id,
        title: 'Novo Agendamento! 💈',
        message: `${profile.full_name} agendou ${selectedService.name} para o dia ${appointmentDate.toLocaleDateString('pt-BR')} às ${selectedTime}.`,
        type: 'appointment'
      });

      if (notifError) throw notifError;

      // 3. Trigger Web Push (Aviso sonoro com tela bloqueada)
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarber.id,
          title: 'Novo Agendamento! 💈',
          message: `${profile.full_name} agendou ${selectedService.name} às ${selectedTime}.`
        })
      }).catch(err => console.error('Push failed', err));

      setStep(4); // Tela de Sucesso
    } catch (error) {
      console.error(error);
      alert('Erro ao confirmar agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-28 relative flex flex-col">
      {/* Header Modal-like */}
      {step < 4 && (
        <header className="bg-zinc-950/80 backdrop-blur-md sticky top-0 w-full z-40 border-b border-zinc-900 px-5 pt-8 pb-4 flex items-center gap-4">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="text-xl font-black text-white">
            {step === 1 ? 'Escolha o Profissional' : step === 2 ? 'Escolha o Serviço' : 'Data e Hora'}
          </h1>
        </header>
      )}

      <main className="flex-1 px-5 pt-6 pb-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {barbers.length === 0 ? (
                <div className="text-center py-10 bg-zinc-900 rounded-xl border border-zinc-800">
                  <p className="text-zinc-400">Nenhum barbeiro disponível no momento.</p>
                </div>
              ) : (
                barbers.map(barber => (
                  <div 
                    key={barber.id}
                    onClick={() => { 
                      setSelectedBarber(barber); 
                      if (selectedService) {
                        setStep(3);
                      } else {
                        setStep(2);
                      }
                    }}
                    className={`bg-zinc-900 border ${selectedBarber?.id === barber.id ? 'border-primary-container bg-primary-container/10' : 'border-zinc-800 hover:border-zinc-700'} rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-all`}
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-full overflow-hidden flex items-center justify-center border border-zinc-700">
                      {barber.avatar_url ? <img src={barber.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="text-zinc-500" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{barber.full_name}</h3>
                      <p className="text-zinc-400 text-sm">Barbeiro Profissional</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {services.length === 0 ? (
                <div className="text-center py-10 bg-zinc-900 rounded-xl border border-zinc-800">
                  <p className="text-zinc-400">Nenhum serviço disponível.</p>
                </div>
              ) : (
                services.map(srv => (
                  <div 
                    key={srv.id}
                    onClick={() => { setSelectedService(srv); setStep(3); }}
                    className={`bg-zinc-900 border ${selectedService?.id === srv.id ? 'border-primary-container bg-primary-container/10' : 'border-zinc-800 hover:border-zinc-700'} rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-all`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-zinc-800 p-3 rounded-xl text-primary-container">
                        <Scissors className="size-6" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{srv.name}</h3>
                        <p className="text-zinc-400 text-xs">{srv.duration_minutes} minutos</p>
                      </div>
                    </div>
                    <span className="text-white font-black whitespace-nowrap">R$ {(Number(srv.price) || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              {/* Seletor de Data */}
              <div>
                <h3 className="font-bold text-white mb-3">Escolha o dia</h3>
                <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                  {availableDates.map((d, i) => {
                    const isSelected = selectedDate?.toDateString() === d.toDateString();
                    return (
                      <button 
                        key={i} 
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedTime(''); // Limpa o horário ao trocar de data
                        }}
                        className={`shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border transition-all active:scale-95 ${isSelected ? 'bg-primary-container border-primary-container text-white shadow-[0_0_15px_rgba(0,87,255,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                      >
                        <span className="text-xs uppercase font-bold">{d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                        <span className="text-xl font-black">{d.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Seletor de Hora */}
              {selectedDate && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Clock className="size-4 text-primary-container" /> Escolha o horário</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {availableTimes.length === 0 ? (
                      <p className="col-span-3 text-zinc-500 text-sm">Nenhum horário disponível para hoje.</p>
                    ) : (
                      availableTimes.map(slot => {
                        // Check if it conflicts with booked intervals
                        const isBooked = bookedIntervals.some(b => (slot.start < b.end && slot.end > b.start));
                        
                        return (
                          <button
                            key={slot.time}
                            disabled={isBooked}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-3 rounded-xl border font-bold text-sm transition-all ${isBooked ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed' : selectedTime === slot.time ? 'bg-primary-container border-primary-container text-white shadow-[0_0_15px_rgba(0,87,255,0.4)] active:scale-95' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 active:scale-95'}`}
                          >
                            {slot.time}
                          </button>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* Botão Confirmar */}
              <AnimatePresence>
                {selectedDate && selectedTime && (
                  <motion.button 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full h-14 mt-4 bg-white text-black font-black text-lg rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Confirmar Agendamento'}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center h-[60vh] space-y-6">
              <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="size-12" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Agendado!</h2>
                <p className="text-zinc-400 max-w-[250px] mx-auto">Sua reserva para <strong>{selectedService?.name}</strong> com <strong>{selectedBarber?.full_name.split(' ')[0]}</strong> foi confirmada.</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full">
                <p className="text-sm text-zinc-500 uppercase font-bold tracking-widest mb-1">Data e Hora</p>
                <p className="text-xl font-bold text-white">{selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}</p>
              </div>
              <button 
                onClick={() => router.push('/client-home')}
                className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all"
              >
                Voltar para Início
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      {step < 4 && (
        <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
          <NavItem href="/client-home" icon={<Grid />} label="Início" />
          <NavItem active href="/client-home/agendar" icon={<Calendar />} label="Agendar" />
          <NavItem href="/client-home/agendamentos" icon={<Clock4 />} label="Histórico" />
          <NavItem href="/client-home/perfil" icon={<UserIcon />} label="Perfil" />
        </nav>
      )}
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
