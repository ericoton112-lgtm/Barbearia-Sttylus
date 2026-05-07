'use client';

import { useEffect, useState, useRef } from 'react';
import { Grid, Calendar, User as UserIcon, Scissors, LogOut, CheckCircle, Camera, Users, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProfessionalProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('19:00');
  const [lunchStartTime, setLunchStartTime] = useState('12:00');
  const [lunchEndTime, setLunchEndTime] = useState('13:00');
  const [workDays, setWorkDays] = useState<number[]>([1,2,3,4,5,6]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolio, setPortfolio] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setWorkStartTime(profileData.work_start_time?.slice(0, 5) || '09:00');
        setWorkEndTime(profileData.work_end_time?.slice(0, 5) || '19:00');
        setLunchStartTime(profileData.lunch_start_time?.slice(0, 5) || '12:00');
        setLunchEndTime(profileData.lunch_end_time?.slice(0, 5) || '13:00');
        setWorkDays(profileData.work_days || [1, 2, 3, 4, 5, 6]);
        
        // Fetch Portfolio
        const { data: portData } = await supabase.from('portfolio_images').select('*').eq('barber_id', user.id).order('created_at', { ascending: false });
        if (portData) setPortfolio(portData);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setSaveSuccess(false);
    
    await supabase.from('profiles').update({
      full_name: fullName,
      phone: phone,
      work_start_time: workStartTime,
      work_end_time: workEndTime,
      lunch_start_time: lunchStartTime,
      lunch_end_time: lunchEndTime,
      work_days: workDays
    }).eq('id', profile.id);

    setIsSaving(false);
    setSaveSuccess(true);
    
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      setProfile({ ...profile, avatar_url: publicUrl });

    } catch (error) {
      alert('Erro ao enviar imagem!');
      console.log(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingPortfolio(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-portfolio-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'portfolio' bucket
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from('portfolio_images').insert({
        barber_id: profile.id,
        image_url: publicUrl
      });

      if (dbError) throw dbError;

      alert('Foto adicionada ao portfólio com sucesso!');
      fetchData(); // Reload portfolio

    } catch (error: any) {
      alert(`Erro ao adicionar foto ao portfólio. Lembre-se de criar o bucket 'portfolio' no Supabase e a tabela. Detalhes: ${error.message}`);
      console.log(error);
    } finally {
      setUploadingPortfolio(false);
      // reset file input
      if (portfolioInputRef.current) portfolioInputRef.current.value = '';
    }
  };

  const handleDeletePortfolioImage = async (id: string, imageUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto do seu portfólio?')) return;
    
    try {
      // Deleta do DB
      await supabase.from('portfolio_images').delete().eq('id', id);
      
      // Tenta deletar do storage (opcional, extrai o nome do arquivo da URL)
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('portfolio').remove([fileName]);
      }
      
      fetchData(); // Reload
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir foto.');
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
        <h1 className="text-2xl font-black text-white">Meu Perfil</h1>
      </header>

      <main className="pt-28 px-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 bg-zinc-800 border-4 border-zinc-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer overflow-hidden group"
              >
                {uploadingImage ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="size-10 text-zinc-500" />
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white size-6" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">{profile?.full_name}</h2>
                <p className="text-zinc-500 text-sm">{profile?.role === 'barber' ? 'Barbeiro Profissional' : 'Usuário'}</p>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white mb-2">Dados Pessoais</h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase">Nome Completo</label>
                <input 
                  required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase">Telefone</label>
                <input 
                  required value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                />
              </div>

              <button 
                type="submit" disabled={isSaving}
                className="w-full h-12 mt-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? 'Salvando...' : saveSuccess ? <><CheckCircle className="size-4 text-green-500" /> Salvo com sucesso!</> : 'Salvar Alterações'}
              </button>
            </form>

            {/* Configuração de Expediente */}
            <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white mb-2">Expediente</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Início</label>
                  <input 
                    type="time" required value={workStartTime} onChange={e => setWorkStartTime(e.target.value)}
                    className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Fim</label>
                  <input 
                    type="time" required value={workEndTime} onChange={e => setWorkEndTime(e.target.value)}
                    className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Início Almoço</label>
                  <input 
                    type="time" required value={lunchStartTime} onChange={e => setLunchStartTime(e.target.value)}
                    className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Fim Almoço</label>
                  <input 
                    type="time" required value={lunchEndTime} onChange={e => setLunchEndTime(e.target.value)}
                    className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Dias de Trabalho</label>
                <div className="flex justify-between gap-1">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
                    const isSelected = workDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) setWorkDays(workDays.filter(d => d !== idx));
                          else setWorkDays([...workDays, idx].sort());
                        }}
                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${isSelected ? 'bg-primary-container text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button 
                type="submit" disabled={isSaving}
                className="w-full h-12 mt-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? 'Salvando...' : saveSuccess ? <><CheckCircle className="size-4 text-green-500" /> Salvo com sucesso!</> : 'Salvar Expediente'}
              </button>
            </form>

            {/* Meu Portfólio */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white">Meu Portfólio</h3>
                <button 
                  onClick={() => portfolioInputRef.current?.click()}
                  disabled={uploadingPortfolio}
                  className="flex items-center gap-1 bg-primary-container/20 text-primary-container hover:bg-primary-container/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {uploadingPortfolio ? (
                    <div className="w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <><Plus className="size-4" /> Adicionar Foto</>
                  )}
                </button>
                <input 
                  type="file" 
                  ref={portfolioInputRef}
                  onChange={handlePortfolioUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {portfolio.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 border border-dashed border-zinc-700 rounded-xl bg-zinc-950/50">
                  <ImageIcon className="text-zinc-600 size-8 mb-2" />
                  <p className="text-zinc-500 text-sm">Nenhuma foto no portfólio.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {portfolio.map(img => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group bg-zinc-800">
                      <img src={img.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                        <button 
                          onClick={() => handleDeletePortfolioImage(img.id, img.image_url)}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 active:scale-95 transition-all shadow-lg"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full h-14 bg-red-500/10 border border-red-500/30 text-red-500 font-bold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="size-5" />
              Sair da Conta
            </button>
          </div>
        )}
      </main>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bg-zinc-900/95 backdrop-blur-md fixed bottom-0 w-full rounded-t-2xl z-30 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-4">
        <NavItem href="/professional-dashboard" icon={<Grid />} label="Início" />
        <NavItem href="/professional-dashboard/agenda" icon={<Calendar />} label="Agenda" />
        <NavItem href="/professional-dashboard/equipe" icon={<Users />} label="Equipe" />
        <NavItem href="/professional-dashboard/servicos" icon={<Scissors />} label="Serviços" />
        <NavItem active href="/professional-dashboard/perfil" icon={<UserIcon />} label="Perfil" />
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
