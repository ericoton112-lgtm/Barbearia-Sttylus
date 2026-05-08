'use client';

import { useEffect, useState } from 'react';
import { Grid, Calendar, User as UserIcon, Scissors, Users, UserMinus, Edit3, Plus, X, Phone, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function EquipePage() {
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  
  // Estados do Formulário (Restaurados)
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Verificar usuário atual e se ele é o dono
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser(prof);
      // Aqui você pode definir o e-mail do dono ou uma flag de admin
      // Por enquanto, vamos considerar o dono quem tiver o e-mail master (você)
      setIsOwner(user.email === 'ericoton112@gmail.com' || prof?.role === 'admin');
    }

    // 2. Buscar equipe (Incluindo admins que também são barbeiros)
    const { data } = await supabase.from('profiles').select('*').in('role', ['barber', 'admin']);
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
        alert('Erro ao desligar barbeiro.');
      } else {
        fetchData();
        setIsModalOpen(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (selectedBarber) {
        // Editar
        const { error } = await supabase.from('profiles').update({
          full_name: formName,
          phone: formPhone
        }).eq('id', selectedBarber.id);
        if (error) throw error;
      } else {
        // Adicionar (Neste sistema, adicionar significa convidar ou criar conta, 
        // mas para simplificar UI do dono, vamos apenas orientar o código de convite)
        alert("Para adicionar um novo barbeiro, peça para ele se cadastrar com o código: STTYLUS-PRO");
      }
      
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (barber: any) => {
    setSelectedBarber(barber);
    setFormName(barber.full_name || '');
    setFormPhone(barber.phone || '');
    setIsModalOpen(true);
  };

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
      <header className="bg-zinc-950/60 backdrop-blur-xl fixed top-0 w-full z-40 border-b border-zinc-900 px-6 pt-12 pb-6 flex justify-between items-center">
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Gestão,</p>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Minha Equipe</h1>
          </div>
          {isOwner && (
            <button 
              onClick={() => { setSelectedBarber(null); setFormName(''); setFormPhone(''); setIsModalOpen(true); }}
              className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-900/40 active:scale-90 transition-all"
            >
              <Plus size={24} />
            </button>
          )}
      </header>

      <main className="pt-32 px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Barbeiros Cadastrados</h2>
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
                 <div key={membro.id} className="bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-zinc-800 p-5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-zinc-800 group-hover:border-blue-600 transition-all duration-500">
                          {membro.avatar_url ? (
                            <img src={membro.avatar_url} alt={membro.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="text-zinc-500 size-6" />
                          )}
                        </div>
                        {membro.is_accepting_appointments && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900 animate-pulse"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight uppercase italic">{membro.full_name || 'Usuário'}</h3>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{membro.phone || 'Sem telefone'}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => openEdit(membro)}
                      className="bg-zinc-800 text-zinc-400 p-3 rounded-2xl hover:text-white hover:bg-blue-600 transition-all active:scale-90"
                    >
                      <Edit3 size={20} />
                    </button>
                 </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal de Gestão (Edit/Add) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             ></motion.div>
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl"
             >
               <div className="p-8">
                  <header className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                        {selectedBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
                      </h2>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Configurações do Perfil</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-2 rounded-xl text-zinc-500">
                      <X size={20} />
                    </button>
                  </header>

                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1">Nome do Profissional</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 size-5 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          required value={formName} onChange={e => setFormName(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 bg-black/40 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" 
                          placeholder="Ex: Guilherme Silva"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1">WhatsApp</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 size-5 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          required value={formPhone} onChange={e => setFormPhone(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 bg-black/40 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" 
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button 
                        type="submit" disabled={saving || (!isOwner && selectedBarber)}
                        className="w-full h-16 bg-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                      </button>

                      {selectedBarber && isOwner && (
                        <button 
                          type="button"
                          onClick={() => handleDismiss(selectedBarber.id, selectedBarber.full_name)}
                          className="w-full h-14 bg-red-500/10 border border-red-500/20 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <UserMinus size={18} /> Desligar da Equipe
                        </button>
                      )}
                      
                      {!isOwner && selectedBarber && (
                        <p className="text-[10px] text-zinc-600 text-center uppercase font-black tracking-widest px-4">
                          Apenas o dono pode editar ou desligar membros da equipe.
                        </p>
                      )}
                    </div>
                  </form>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bg-zinc-950/90 backdrop-blur-2xl fixed bottom-0 w-full rounded-t-[32px] z-50 border-t border-zinc-900 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] flex justify-around items-center h-24 px-6 pb-6">
        <NavItem href="/professional-dashboard" icon={<Grid size={24} />} label="Início" />
        <NavItem href="/professional-dashboard/agenda" icon={<Calendar size={24} />} label="Agenda" />
        <NavItem active href="/professional-dashboard/equipe" icon={<Users size={24} />} label="Equipe" />
        <NavItem href="/professional-dashboard/servicos" icon={<Scissors size={24} />} label="Serviços" />
        <NavItem href="/professional-dashboard/perfil" icon={<UserIcon size={24} />} label="Perfil" />
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
