'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Check session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Redirect based on role
        supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
          if (data?.role === 'barber') {
            window.location.href = '/professional-dashboard';
          } else {
            window.location.href = '/client-home';
          }
        });
      } else {
        setInitialLoading(false);
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'barber') {
          window.location.href = '/professional-dashboard';
        } else {
          window.location.href = '/client-home';
        }
      }
    } catch (error: any) {
      alert('Erro: ' + (error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-blue-500 mb-2">Styllus</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Barbearia Profissional</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mt-8">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="email"
              placeholder="E-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="password"
              placeholder="Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'ENTRAR NO PAINEL'}
          </button>
        </form>
      </div>
    </div>
  );
}
