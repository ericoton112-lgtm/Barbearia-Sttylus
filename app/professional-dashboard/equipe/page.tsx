'use client';

import { useEffect, useState } from 'react';
import { Grid, Calendar, User as UserIcon, Scissors, Users, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EquipePage() {
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', 'barber');
    if (data) {
      setEquipe(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDismiss = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja desligar ${name} da equipe?`)) {
      const { error } = await supabase.from('profiles').update({ role: 'client' }).eq('id', id);
      if (error) {
        alert('Erro ao desligar barbeiro. Lembre-se de configurar a política RLS no Supabase para permitir que barbeiros editem perfis.');
        console.error(error);
      } else {
        alert('Barbeiro desligado com sucesso!');
        fetchData();
      }
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
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md fixed top-0 w-full z-40 border-b border-zinc-900 px-5 pt-8 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Minha Equipe</h1>
      </header>

      <main className="pt-28 px-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Barbeiros Cadastrados
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {equipe.length === 0 ? (
               <div className="bg-zinc-900 rounded-xl p-10 border border-zinc-800 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                    <Users className="text-zinc-500 size-8" />
                  </div>
                  <p className="text-zinc-400 font-semibold">Nenhum barbeiro encontrado na equipe.</p>
               </div>
            ) : (
              equipe.map((membro) => (
                 <div key={membro.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-3">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-zinc-700">
                         {membro.avatar_url ? (
                           <img src={membro.avatar_url} alt={membro.full_name} className="w-full h-full object-cover" />
                         ) : (
                           <UserIcon className="text-zinc-500 size-6" />
                         )}
                       </div>
                       <div>
                         <h3 className="font-bold text-white text-lg">{membro.full_name || 'Usuário sem nome'}</h3>
                         <p className="text-zinc-500 text-xs mt-1">{membro.phone || 'Sem telefone'}</p>
                       </div>
                     </div>
                     <button 
                       onClick={() => handleDismiss(membro.id, membro.full_name || 'este barbeiro')} 
                       className="text-red-400 hover:bg-red-400/10 p-3 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-red-500/20"
                       title="Desligar da Equipe"
                     >
                       <UserMinus className="size-5" />
                     </button>
                   </div>
                 </div>
              ))
            )}
          </div>
        )}
      </main>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem href="/professional-dashboard" icon={<Grid />} label="Início" />
        <NavItem href="/professional-dashboard/agenda" icon={<Calendar />} label="Agenda" />
        <NavItem active href="/professional-dashboard/equipe" icon={<Users />} label="Equipe" />
        <NavItem href="/professional-dashboard/servicos" icon={<Scissors />} label="Serviços" />
        <NavItem href="/professional-dashboard/perfil" icon={<UserIcon />} label="Perfil" />
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
