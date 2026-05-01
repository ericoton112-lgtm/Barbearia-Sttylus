'use client';

import { useEffect, useState } from 'react';
import { Search, Scissors, Star, MapPin, ChevronRight, User as UserIcon, Calendar, Grid } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ClientHomePage() {
  const [profile, setProfile] = useState<any>(null);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profileData) setProfile(profileData);
      }

      // Fetch barbers
      const { data: barbersData } = await supabase.from('profiles').select('*').eq('role', 'barber');
      if (barbersData) setBarbers(barbersData);

      // Fetch services
      const { data: servicesData } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (servicesData) setServices(servicesData);

      setLoading(false);
    };

    fetchData();
  }, []);

  // Se todos os barbeiros estiverem fechados (ou o único barbeiro)
  const isClosed = barbers.length > 0 && barbers.every(b => !b.is_accepting_appointments);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-28 relative">
      {/* Header Profile */}
      <header className="px-5 pt-12 pb-6 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-900">
        <div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Bom dia,</p>
          <h1 className="text-xl font-bold text-white">{profile ? profile.full_name : 'Visitante'}</h1>
        </div>
        <Link href="/client-home/perfil" className="w-12 h-12 bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
           {profile?.avatar_url ? (
             <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
           ) : (
             <UserIcon className="text-zinc-500" />
           )}
        </Link>
      </header>

      {/* Banner ON/OFF */}
      {isClosed && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-3 flex items-center justify-center">
          <p className="text-red-500 text-sm font-bold uppercase tracking-wider">A barbearia está fechada no momento</p>
        </div>
      )}

      <main className="px-5 mt-6 space-y-10">


        {/* Services */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Serviços</h3>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-5 px-5 snap-x">
             {services.length === 0 ? (
                <p className="text-zinc-500 text-sm w-full text-center py-4 bg-zinc-900 rounded-xl border border-zinc-800">Nenhum serviço disponível no momento.</p>
             ) : (
                services.map((srv, idx) => (
                  <motion.div 
                    key={srv.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="shrink-0 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 snap-center relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-16">
                      <div className="bg-zinc-800 p-2 rounded-lg text-primary-container">
                        <Scissors className="size-6" />
                      </div>
                      <span className="text-white font-black text-lg whitespace-nowrap">R$ {srv.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg leading-none">{srv.name}</h4>
                      <p className="text-zinc-500 text-sm mt-1">{srv.duration_minutes} min</p>
                    </div>
                  </motion.div>
                ))
             )}
          </div>
        </section>

        {/* Professionals */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4">Profissionais</h3>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-5 px-5 snap-x">
            {barbers.length === 0 ? (
               <p className="text-zinc-500 text-sm">Nenhum barbeiro encontrado.</p>
            ) : (
               barbers.map((barber, idx) => (
                 <div key={barber.id} className="shrink-0 w-32 snap-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden flex items-center justify-center shadow-lg relative mb-3">
                     {barber.avatar_url ? (
                       <img src={barber.avatar_url} alt={barber.full_name} className="w-full h-full object-cover" />
                     ) : (
                       <UserIcon className="text-zinc-500 size-8" />
                     )}
                     {!barber.is_accepting_appointments && (
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                         <span className="text-white font-bold text-[8px] uppercase tracking-widest bg-red-500 px-1 py-0.5 rounded">Off</span>
                       </div>
                     )}
                   </div>
                   <h4 className="text-white font-bold text-sm text-center line-clamp-1">{barber.full_name.split(' ')[0]}</h4>
                   <div className="flex items-center gap-1 mt-1 text-primary-container">
                     <Star className="size-3 fill-current" />
                     <span className="text-xs font-bold">5.0</span>
                   </div>
                 </div>
               ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem active href="/client-home" icon={<Grid />} label="Início" />
        <NavItem href="/client-home/agendar" icon={<Calendar />} label="Agendar" />
        <NavItem href="/client-home/perfil" icon={<UserIcon />} label="Perfil" />
      </nav>
    </div>
  )
}

function NavItem({ active, icon, label, href }: { active?: boolean, icon: React.ReactNode, label: string, href?: string }) {
  if (href) {
    return (
      <Link href={href} className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${active ? 'text-primary-container drop-shadow-[0_0_8px_rgba(0,87,255,0.4)]' : 'text-zinc-500'}`}>
        <span className="size-6">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">{label}</span>
      </Link>
    );
  }
  return (
    <button className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${active ? 'text-primary-container drop-shadow-[0_0_8px_rgba(0,87,255,0.4)]' : 'text-zinc-500'}`}>
      <span className="size-6">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">{label}</span>
    </button>
  );
}
