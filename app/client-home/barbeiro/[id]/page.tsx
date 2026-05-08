'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Star, Scissors, MapPin, Grid, Calendar, Clock, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function BarberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const barberId = resolvedParams.id;
  
  const [barber, setBarber] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Barber
      const { data: bData } = await supabase.from('profiles').select('*').eq('id', barberId).single();
      if (bData) setBarber(bData);

      // Fetch Barber's Services
      const { data: sData } = await supabase.from('services').select('*').eq('barber_id', barberId).order('name', { ascending: true });
      if (sData) setServices(sData);

      // Fetch Portfolio
      const { data: portData } = await supabase.from('portfolio_images').select('*').eq('barber_id', barberId).order('created_at', { ascending: false });
      if (portData) setPortfolio(portData);

      // Fetch Completed Appointments Count (REAL DATA)
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('barber_id', barberId)
        .eq('status', 'concluído');
      
      if (count) setCompletedCount(count);

      setLoading(false);
    };

    fetchData();
  }, [barberId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center text-white">
        <p>Barbeiro não encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-primary-container">Voltar</button>
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
      <header className="bg-transparent absolute top-0 w-full z-40 px-5 pt-8 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-black/60 transition-colors">
          <ChevronLeft className="size-6" />
        </button>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 px-5 pb-6 flex flex-col items-center text-center">
          <div className="w-32 h-32 bg-zinc-800 rounded-full border-4 border-zinc-900 overflow-hidden flex items-center justify-center shadow-2xl relative mb-4">
            {barber.avatar_url ? (
              <img src={barber.avatar_url} alt={barber.full_name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="text-zinc-500 size-12" />
            )}
          </div>
          <h1 className="text-3xl font-black text-white">{barber.full_name}</h1>
          <p className="text-zinc-400 mt-1 flex items-center gap-1 justify-center">
            <MapPin className="size-4" /> Unidade Principal
          </p>
          
          <div className="flex items-center gap-6 mt-4 bg-zinc-900/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-zinc-800">
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg flex items-center gap-1">
                <Star className={`size-4 ${completedCount > 0 ? 'fill-blue-500 text-blue-500' : 'text-zinc-700'}`}/> 
                {completedCount > 0 ? '5.0' : '0.0'}
              </span>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Avaliação</span>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg">{services.length}</span>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Serviços</span>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg">{completedCount}</span>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Cortes</span>
            </div>
          </div>
        </section>

        {/* Portfólio */}
        {portfolio.length > 0 && (
          <section className="px-5 mt-6">
            <h3 className="text-lg font-bold text-white mb-4">Portfólio</h3>
            <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar -mx-5 px-5">
              {portfolio.map(img => (
                <div key={img.id} className="w-32 h-40 shrink-0 bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-800 shadow-md">
                  <img src={img.image_url} alt="Corte do Portfólio" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Serviços do Barbeiro */}
        <section className="px-5 mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Serviços Disponíveis</h3>
          <div className="space-y-4">
            {services.length === 0 ? (
               <p className="text-zinc-500 text-sm py-4 text-center bg-zinc-900 rounded-xl border border-zinc-800">Este barbeiro ainda não cadastrou serviços específicos.</p>
            ) : (
               services.map((srv, idx) => (
                 <Link href={`/client-home/agendar?serviceId=${srv.id}&barberId=${barber.id}`} key={srv.id}>
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-all mb-3"
                   >
                     <div className="flex items-center gap-4">
                       <div className="bg-zinc-800 p-3 rounded-xl text-primary-container shrink-0">
                         <Scissors className="size-6" />
                       </div>
                       <div>
                         <h4 className="text-white font-bold">{srv.name}</h4>
                         <p className="text-zinc-500 text-xs mt-1">{srv.duration_minutes} min • {srv.category || 'Geral'}</p>
                       </div>
                     </div>
                     <span className="text-white font-black whitespace-nowrap">R$ {(Number(srv.price) || 0).toFixed(2).replace('.', ',')}</span>
                   </motion.div>
                 </Link>
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
        <NavItem href="/client-home/agendamentos" icon={<Clock />} label="Histórico" />
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
