'use client';

import { useEffect, useState } from 'react';
import { Scissors, Star, User as UserIcon, Instagram, MessageCircle, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientHomePage() {
  const [profile, setProfile] = useState<any>(null);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const router = useRouter();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      
      if (!session?.user) {
        router.replace('/login');
        return;
      }
      const user = session.user;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        if (profileData.role === 'barber' || profileData.role === 'admin') {
          router.replace('/professional-dashboard');
          return;
        }
        setProfile(profileData);
      }

      // Fetch Next Appointment
      const now = new Date();
      const { data: nextAppt } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          service:services!service_id (name, price),
          barber:profiles!barber_id (full_name)
        `)
        .eq('client_id', user.id)
        .gte('appointment_date', now.toISOString())
        .neq('status', 'cancelado')
        .order('appointment_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (nextAppt) setNextAppointment(nextAppt);

      const { data: barbersData } = await supabase.from('profiles').select('*').in('role', ['barber', 'admin']);
      if (barbersData) setBarbers(barbersData);

      const { data: servicesData } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (servicesData) setServices(servicesData);

      setLoading(false);
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isClosed = barbers.length > 0 && barbers.every(b => !b.is_accepting_appointments);

  if (loading) {
    return (
      <div className="px-5 pt-8 pb-4">
        <div className="flex justify-between items-center mb-8">
          <div className="w-40 h-8 bg-zinc-900 rounded-lg animate-pulse"></div>
          <div className="w-10 h-10 bg-zinc-900 rounded-full animate-pulse"></div>
        </div>
        <div className="w-full h-14 bg-zinc-900 rounded-2xl animate-pulse mb-8"></div>
        <div className="mb-8">
          <div className="w-32 h-6 bg-zinc-900 rounded-lg animate-pulse mb-4"></div>
          <div className="flex gap-4 overflow-hidden">
             <div className="w-64 h-32 bg-zinc-900 rounded-2xl animate-pulse shrink-0"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="px-5 pt-12 pb-6 flex justify-between items-center bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-40 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
             <img src="/icon.svg" className="w-6 h-6 invert" alt="Logo" />
          </div>
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] leading-none mb-1">Styllus Experience</p>
            <h1 className="text-sm font-black uppercase tracking-tighter text-white">Barbearia Styllus</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/client-home/perfil" className="w-10 h-10 bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden flex items-center justify-center active:scale-95 transition-transform">
             {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="text-zinc-500" />}
          </Link>
          <button onClick={handleLogout} className="text-red-500 bg-red-500/10 p-2 rounded-xl active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* Hero Section Premium */}
      <section className="relative px-5 pt-8 pb-10 overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
         
         <div className="relative z-10 space-y-6">
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1">{getGreeting()},</p>
               <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-tight max-w-[80%]">
                  {profile?.full_name || 'Visitante'} <span className="text-blue-500">.</span>
               </h2>
            </div>

            {nextAppointment ? (
               <Link href="/client-home/agendamentos" className="block group">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[32px] p-6 shadow-xl shadow-blue-900/40 relative overflow-hidden active:scale-[0.98] transition-all">
                     {/* Decorative Elements */}
                     <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                     <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scissors"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>
                     </div>

                     <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-5">
                           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white">Confirmado</span>
                           </div>
                           <span className="text-[10px] font-bold text-blue-100/80 italic">
                              {new Date(nextAppointment.appointment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')} às {new Date(nextAppointment.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>

                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/60 mb-1">Seu próximo serviço</p>
                           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">
                              {nextAppointment.service?.name}
                           </h3>
                           <div className="flex items-center gap-2 pt-2">
                              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                                 <UserIcon size={12} className="text-white" />
                              </div>
                              <p className="text-white text-xs font-bold uppercase tracking-widest">
                                 {nextAppointment.barber?.full_name}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               </Link>
            ) : (
               <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center gap-4 border-dashed">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                  </div>
                  <div>
                     <p className="text-white font-bold text-sm mb-1">Nenhum agendamento para hoje</p>
                     <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Que tal dar um tapa no visual?</p>
                  </div>
                  <Link href="/client-home/agendar" className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                     Agendar Agora
                  </Link>
               </div>
            )}
         </div>
      </section>

      {isClosed && (
        <div className="mx-5 mb-8 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-[24px] backdrop-blur-md flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </div>
          <div>
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Barbearia Fechada</p>
            <p className="text-zinc-400 text-xs font-medium">Estamos descansando, mas você ainda pode agendar para amanhã!</p>
          </div>
        </div>
      )}

      <main className="px-6 mt-10 space-y-12">
        {/* Specialists Section */}
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Nossos Especialistas</h3>
          <div className="flex overflow-x-auto gap-6 pb-6 no-scrollbar snap-x">
            {barbers.map((barber) => (
              <Link href={`/client-home/barbeiro/${barber.id}`} key={barber.id} className="shrink-0 w-24 snap-center flex flex-col items-center group">
                <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                  <div className={`absolute inset-1 bg-gradient-to-tr ${barber.is_accepting_appointments ? 'from-blue-600 via-cyan-400 to-blue-500' : 'from-zinc-700 to-zinc-800'} rounded-full animate-spin-slow opacity-80 group-active:scale-90 transition-all`}></div>
                  <div className="absolute inset-[6px] bg-[#0a0a0a] rounded-full"></div>
                  <div className="relative w-20 h-20 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50 flex items-center justify-center shadow-2xl">
                    {barber.avatar_url ? <img src={barber.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition-duration-500" /> : <UserIcon className="text-zinc-700 size-8" />}
                  </div>
                  {barber.is_accepting_appointments && (
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#0a0a0a] rounded-full flex items-center justify-center z-10">
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a] animate-pulse"></div>
                    </div>
                  )}
                </div>
                <span className="text-white font-bold text-[11px] text-center uppercase tracking-tight">{barber.full_name.split(' ')[0]}</span>
                <div className="flex items-center gap-0.5 mt-0.5 text-blue-500/80">
                  <Star className="size-2 fill-current" />
                  <span className="text-[9px] font-black">5.0</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Serviços Exclusivos</h3>
            <div className="h-[1px] flex-1 bg-zinc-900 ml-4"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
             {services.length === 0 ? (
                <p className="text-zinc-500 text-sm w-full text-center py-10 bg-zinc-900/30 rounded-[32px] border border-zinc-800 border-dashed italic">Nenhum serviço disponível.</p>
             ) : (
                services.map((srv) => (
                  <Link href={`/client-home/agendar?serviceId=${srv.id}`} key={srv.id} className="group">
                    <div className="relative bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 flex items-center justify-between hover:border-blue-500/50 hover:bg-zinc-900/50 transition-all duration-500 overflow-hidden group-active:scale-[0.98]">
                      {/* Brilho Interno do Card */}
                      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
                      
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 rounded-2xl text-blue-500 shadow-inner group-hover:text-white group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-500">
                          <Scissors size={24} />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-lg uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">{srv.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{srv.duration_minutes} MIN</span>
                             <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
                             <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{srv.category || 'Geral'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right relative z-10">
                        <span className="block text-white font-black text-xl group-hover:scale-110 transition-transform duration-500 origin-right">
                          R$ {(Number(srv.price) || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Reservar Agora</span>
                      </div>
                    </div>
                  </Link>
                ))
             )}
          </div>
        </section>

        {/* Connect Section */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Conecte-se Conosco</h3>
            <div className="h-[1px] flex-1 bg-zinc-900 ml-4"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a 
              href="https://wa.me/5511999999999" // TODO: Substituir pelo número real
              target="_blank"
              className="bg-zinc-900/40 border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-green-500/10 hover:border-green-500/30 group"
            >
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all">
                <MessageCircle size={24} />
              </div>
              <span className="text-white font-bold text-[10px] uppercase tracking-widest">WhatsApp</span>
            </a>

            <a 
              href="https://instagram.com/barbeariasttylus" // TODO: Substituir pelo perfil real
              target="_blank"
              className="bg-zinc-900/40 border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-pink-500/10 hover:border-pink-500/30 group"
            >
              <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 group-hover:bg-gradient-to-tr group-hover:from-yellow-400 group-hover:via-pink-500 group-hover:to-purple-600 group-hover:text-white transition-all">
                <Instagram size={24} />
              </div>
              <span className="text-white font-bold text-[10px] uppercase tracking-widest">Instagram</span>
            </a>
          </div>

          <p className="text-center text-zinc-600 text-[8px] font-black uppercase tracking-[0.3em] mt-12 mb-4">
            Barbearia Styllus © 2024 • Experiência Premium
          </p>
        </section>
      </main>
    </>
  );
}
