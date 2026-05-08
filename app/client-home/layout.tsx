'use client';

import { Grid, Calendar, Clock, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Imagem de Fundo Cinematográfica Fixa para todas as abas */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover opacity-10 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/95 to-[#0a0a0a]"></div>
      </div>

      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Conteúdo da Página */}
      <div className="relative z-10 min-h-screen pb-28">
        {children}
      </div>

      {/* Bottom Nav Bar Centralizada */}
      <nav className="bg-zinc-950/90 backdrop-blur-2xl fixed bottom-0 w-full rounded-t-[32px] z-50 border-t border-zinc-900 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] flex justify-around items-center h-24 px-6 pb-6">
        <NavItem active={pathname === '/client-home'} href="/client-home" icon={<Grid size={24} />} label="Início" />
        <NavItem active={pathname === '/client-home/agendar'} href="/client-home/agendar" icon={<Calendar size={24} />} label="Agendar" />
        <NavItem active={pathname === '/client-home/agendamentos'} href="/client-home/agendamentos" icon={<Clock size={24} />} label="Agenda" />
        <NavItem active={pathname === '/client-home/perfil'} href="/client-home/perfil" icon={<UserIcon size={24} />} label="Perfil" />
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
