'use client';

import { useEffect, useState } from 'react';
import { Grid, Calendar, User as UserIcon, Scissors, Plus, X, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfessionalServicesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', duration_minutes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      // Perfil
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profileData) {
        setProfile(profileData);
      } else {
        const { data: createdProfile } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            phone: user.user_metadata?.phone || '',
            role: user.user_metadata?.role || 'barber',
            is_accepting_appointments: true
          }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();

        if (createdProfile) setProfile(createdProfile);
      }

      // Buscar serviços - primeiro tenta por barber_id, depois busca todos
      const { data: srvs } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', user.id);

      if (srvs && srvs.length > 0) {
        setServices(srvs);
      } else {
        // Fallback: busca todos os serviços
        const { data: allSrvs } = await supabase
          .from('services')
          .select('*');
        if (allSrvs) setServices(allSrvs);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (service: any = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price.toString(),
        duration_minutes: service.duration_minutes.toString()
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', duration_minutes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const barberId = profile?.id || currentUser?.id;

    if (!barberId) {
      setSubmitError('Erro: perfil do usuário não carregado. Recarregue a página.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration_minutes: parseInt(formData.duration_minutes),
      barber_id: barberId
    };

    console.log('Enviando payload:', payload);

    let dbError = null;
    if (editingService) {
      const { error } = await supabase.from('services').update(payload).eq('id', editingService.id);
      dbError = error;
    } else {
      const { error } = await supabase.from('services').insert([payload]);
      dbError = error;
    }

    if (dbError) {
      console.error('Erro Supabase:', dbError);
      setSubmitError(`Erro: ${dbError.message} (Código: ${dbError.code})`);
      setIsSubmitting(false);
      return;
    }

    await fetchData();
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      await supabase.from('services').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-28">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md fixed top-0 w-full z-40 border-b border-zinc-900 px-5 pt-8 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Serviços</h1>
      </header>

      <main className="pt-28 px-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Meus Serviços
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {services.length === 0 ? (
               <div className="bg-zinc-900 rounded-xl p-10 border border-zinc-800 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                    <Scissors className="text-zinc-500 size-8" />
                  </div>
                  <p className="text-zinc-400 font-semibold">Você ainda não tem serviços cadastrados.</p>
               </div>
            ) : (
              services.map((service) => (
                 <div key={service.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="font-bold text-white text-lg">{service.name}</h3>
                       <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{service.description}</p>
                     </div>
                     <span className="text-primary-container font-black text-lg whitespace-nowrap ml-4">
                       R$ {(Number(service.price) || 0).toFixed(2).replace('.', ',')}
                     </span>
                   </div>
                   
                   <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800/50">
                     <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded font-bold">
                       {service.duration_minutes} minutos
                     </span>
                     <div className="flex gap-2">
                       <button onClick={() => handleOpenModal(service)} className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors">
                         <Edit3 className="size-4" />
                       </button>
                       <button onClick={() => handleDelete(service.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors">
                         <Trash2 className="size-4" />
                       </button>
                     </div>
                   </div>
                 </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* FAB Add Button */}
      <button 
        onClick={() => handleOpenModal()}
        className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-r from-primary-container to-blue-700 text-white rounded-full shadow-[0_4px_20px_rgba(0,87,255,0.4)] flex items-center justify-center active:scale-90 transition-transform z-30"
      >
        <Plus className="size-8" />
      </button>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-white">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white bg-zinc-800 p-2 rounded-full">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Nome do Serviço</label>
                  <input 
                    required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                    placeholder="Ex: Corte Degrade" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Descrição (Opcional)</label>
                  <textarea 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all resize-none h-24" 
                    placeholder="Detalhes sobre o serviço..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Preço (R$)</label>
                    <input 
                      required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                      placeholder="45.00" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Duração (Min)</label>
                    <input 
                      required type="number" min="1" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})}
                      className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                      placeholder="30" 
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {submitError}
                  </div>
                )}

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full h-14 mt-4 bg-primary-container text-white font-bold text-lg rounded-xl shadow-[0_0_12px_rgba(0,87,255,0.3)] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem href="/professional-dashboard" icon={<Grid />} label="Início" />
        <NavItem href="/professional-dashboard/agenda" icon={<Calendar />} label="Agenda" />
        <NavItem active href="/professional-dashboard/servicos" icon={<Scissors />} label="Serviços" />
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
