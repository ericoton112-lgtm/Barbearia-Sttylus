'use client';

import { useEffect, useState } from 'react';
import { Search, Scissors, Star, MapPin, ChevronRight, User as UserIcon, Calendar, Grid, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientHomePage() {
  const [profile, setProfile] = useState<any>(null);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        if (profileData.role === 'barber') {
          router.replace('/professional-dashboard');
          return;
        }
        setProfile(profileData);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Se todos os barbeiros estiverem fechados (ou o único barbeiro)
  const isClosed = barbers.length > 0 && barbers.every(b => !b.is_accepting_appointments);

  if (loading) {
    return (
      <div className="bg-[#131313] min-h-screen pb-28 relative">
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
               <div className="w-64 h-32 bg-zinc-900 rounded-2xl animate-pulse shrink-0"></div>
            </div>
          </div>

          <div>
            <div className="w-48 h-6 bg-zinc-900 rounded-lg animate-pulse mb-4"></div>
            <div className="flex gap-4 overflow-hidden">
               <div className="w-32 h-32 bg-zinc-900 rounded-2xl animate-pulse shrink-0"></div>
               <div className="w-32 h-32 bg-zinc-900 rounded-2xl animate-pulse shrink-0"></div>
               <div className="w-32 h-32 bg-zinc-900 rounded-2xl animate-pulse shrink-0"></div>
            </div>
          </div>
        </div>
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
      {/* Header Profile */}
      <header className="px-5 pt-12 pb-6 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-900">
        <div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Bom dia,</p>
          <h1 className="text-xl font-bold text-white">{profile ? profile.full_name : 'Visitante'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/client-home/perfil" className="w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-transform shrink-0">
             {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
             ) : (
               <UserIcon className="text-zinc-500" />
             )}
          </Link>
          <button onClick={handleLogout} className="text-red-500/80 hover:text-red-500 active:scale-95 p-2 rounded-full hover:bg-red-500/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
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

          {/* Category Pills */}
          <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar -mx-5 px-5">
            {['Todos', ...Array.from(new Set(services.map(s => s.category || 'Geral')))].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as string)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
                  selectedCategory === cat 
                    ? 'bg-primary-container text-white border-primary-container' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat as string}
              </button>
            ))}
          </div>

          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-5 px-5 snap-x">
             {services.filter(srv => selectedCategory === 'Todos' || (srv.category || 'Geral') === selectedCategory).length === 0 ? (
                <p className="text-zinc-500 text-sm w-full text-center py-4 bg-zinc-900 rounded-xl border border-zinc-800">Nenhum serviço nesta categoria.</p>
             ) : (
                services.filter(srv => selectedCategory === 'Todos' || (srv.category || 'Geral') === selectedCategory).map((srv, idx) => (
                  <Link href={`/client-home/agendar?serviceId=${srv.id}`} key={srv.id} className="shrink-0 snap-center">
                    <div 
                      className="w-64 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 relative overflow-hidden hover:border-zinc-700 active:scale-95 transition-all"
                    >
                      <div className="flex justify-between items-start mb-16">
                        <div className="bg-zinc-800 p-2 rounded-lg text-primary-container">
                          <Scissors className="size-6" />
                        </div>
                        <span className="text-white font-black text-lg whitespace-nowrap">R$ {(Number(srv.price) || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg leading-none">{srv.name}</h4>
                        <p className="text-zinc-500 text-sm mt-1">{srv.duration_minutes} min • {srv.category || 'Geral'}</p>
                      </div>
                    </div>
                  </Link>
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
                 <Link href={`/client-home/barbeiro/${barber.id}`} key={barber.id} className="shrink-0 w-32 snap-center flex flex-col items-center cursor-pointer active:scale-95 transition-transform">
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
                 </Link>
               ))
            )}
          </div>
        </section>
      </main>
      </div>

      {/* Bottom Nav */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem active href="/client-home" icon={<Grid />} label="Início" />
        <NavItem href="/client-home/agendar" icon={<Calendar />} label="Agendar" />
        <NavItem href="/client-home/agendamentos" icon={<Clock />} label="Histórico" />
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
