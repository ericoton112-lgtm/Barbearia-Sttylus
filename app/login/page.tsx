'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'barber') {
          router.replace('/professional-dashboard');
        } else {
          router.replace('/client-home');
        }
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Fluxo de Login
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        
        // Buscar o cargo (role) do usuário
        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

          if (profile?.role === 'barber') {
            router.push('/professional-dashboard');
          } else {
            router.push('/client-home');
          }
        }
      } else {
        // Fluxo de Cadastro
        const BARBER_CODE = 'STTYLUS-PRO';
        const isBarber = inviteCode.trim().toUpperCase() === BARBER_CODE;

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: isBarber ? 'barber' : 'client', // Trigger lê isso e cria perfil correto
            }
          }
        });

        if (signUpError) throw signUpError;

        // Redirecionar conforme o cargo
        if (isBarber) {
          router.push('/professional-dashboard');
        } else {
          router.push('/client-home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col items-center justify-center p-5 overflow-hidden relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop" 
          alt="Barbershop Background" 
          className="w-full h-full object-cover opacity-[0.15] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#131313]/60 via-[#131313]/80 to-[#131313]"></div>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary-container/5 blur-[100px] rounded-full"></div>
      </div>

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 flex flex-col gap-8"
      >
        {/* Brand Identity */}
        <header className="flex flex-col items-center text-center gap-4">
          <div className="relative w-24 h-24 mb-1">
            <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-xl"></div>
            <div className="relative flex items-center justify-center w-full h-full bg-surface-container-low rounded-full border border-outline-variant/30 overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Logo Barbearia" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <span className="fallback-icon hidden material-symbols-outlined text-4xl text-primary-container">content_cut</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tighter uppercase italic font-sans">
            Barbearia Styllus
          </h1>
          <p className="text-[#c3c5d9] max-w-[280px]">
            Onde a tradição encontra a precisão digital.
          </p>
        </header>

        {/* Formulário */}
        <section className="flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Mostrar erro se houver */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">
                {error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error}
              </div>
            )}

            {/* Campos Extras (Apenas no Cadastro) */}
            {!isLogin && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="label-caps text-[#c3c5d9] ml-1">NOME COMPLETO</label>
                  <div className="group relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                    <input 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50" 
                      placeholder="João Silva" 
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="label-caps text-[#c3c5d9] ml-1">TELEFONE (WHATSAPP)</label>
                  <div className="group relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                    <input 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50" 
                      placeholder="(11) 98765-4321" 
                      type="tel"
                    />
                  </div>
                </div>

                {/* Campo de Código de Convite */}
                <div className="flex flex-col gap-1">
                  <label className="label-caps text-[#c3c5d9] ml-1">CÓDIGO DE CONVITE <span className="text-zinc-600 normal-case font-normal">(opcional)</span></label>
                  <div className="group relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                    <input 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50 uppercase tracking-widest" 
                      placeholder="Somente para profissionais" 
                      type="text"
                    />
                  </div>
                  {inviteCode.trim().toUpperCase() === 'STTYLUS-PRO' && (
                    <p className="text-green-500 text-xs ml-1 font-bold">✓ Código de profissional válido!</p>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="label-caps text-[#c3c5d9] ml-1" htmlFor="email">E-MAIL</label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                <input 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50" 
                  id="email" 
                  placeholder="nome@exemplo.com" 
                  type="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="label-caps text-[#c3c5d9]" htmlFor="password">SENHA</label>
                {isLogin && <Link className="label-caps text-[10px] text-primary-container hover:underline transition-all" href="#">ESQUECEU?</Link>}
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                <input 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d90a2] hover:text-white transition-colors" 
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-2 bg-gradient-to-r from-primary-container to-blue-700 text-white font-semibold text-lg rounded-xl shadow-[0_0_12px_rgba(0,87,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
              {!loading && <ArrowRight className="size-5" />}
            </button>
          </form>

        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-1 pb-10">
          <p className="text-[#c3c5d9]">
            {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
          </p>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xl font-bold text-primary-container hover:text-[#b6c4ff] transition-colors"
          >
            {isLogin ? 'Criar conta' : 'Fazer Login'}
          </button>
        </footer>
      </motion.main>

      {/* Decorative Side Card foi removido, agora usamos background em tela inteira */}
    </div>
  );
}
