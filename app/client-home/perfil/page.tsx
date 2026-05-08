'use client';

import { useEffect, useState, useRef } from 'react';
import { Grid, Calendar, User as UserIcon, LogOut, CheckCircle, Camera, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ClientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');
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
      phone: phone
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

  return (
    <>
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
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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
                <p className="text-zinc-500 text-sm">Cliente Sttylus</p>
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

    </>
  );
}
