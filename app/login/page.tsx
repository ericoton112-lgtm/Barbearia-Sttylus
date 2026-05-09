'use client';

import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, KeyRound, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return;
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro de sessão:', sessionError);
          await supabase.auth.signOut();
          setInitialLoading(false);
          return;
        }

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role === 'barber') {
            window.location.href = '/professional-dashboard';
          } else {
            window.location.href = '/client-home';
          }
        } else {
          setInitialLoading(false);
        }
      } catch (err) {
        console.error('Erro crítico na verificação de sessão:', err);
        await supabase.auth.signOut();
        setInitialLoading(false);
      }
    };
    checkSession();
  }, []);

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
        
        if (authData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

          if (profile?.role === 'barber') {
            window.location.href = '/professional-dashboard';
          } else {
            window.location.href = '/client-home';
          }
        }
      } else {
        // Fluxo de Cadastro
        const role = inviteCode.trim().toUpperCase() === 'STTYLUS-PRO' ? 'barber' : 'client';

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: role,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          if (role === 'barber') {
            window.location.href = '/professional-dashboard';
          } else {
            window.location.href = '/client-home';
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: any) {
      setForgotError(err.message || 'Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        {/* Fundo Premium no Loading */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
            alt="Background" 
            className="w-full h-full object-cover opacity-10 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/95 to-[#0a0a0a]"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Autenticando...</p>
        </div>
      </div>
    );
  }

  // ── Tela: Esqueceu a Senha ───────────────────────────────────────────────────
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-container/5 blur-[100px] rounded-full"></div>
        </div>

        <main className="w-full max-w-md z-10 flex flex-col gap-8">
          {/* Voltar */}
          <button
            onClick={() => { setIsForgotPassword(false); setForgotSent(false); setForgotError(''); setForgotEmail(''); }}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors self-start"
          >
            <ChevronLeft className="size-5" />
            <span className="text-sm font-semibold">Voltar ao login</span>
          </button>

          {/* Header */}
          <header className="flex flex-col gap-3">
            <div className="w-14 h-14 bg-primary-container/10 border border-primary-container/30 rounded-2xl flex items-center justify-center">
              <Mail className="text-primary-container size-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Recuperar senha</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Digite seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>
          </header>

          {!forgotSent ? (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              {forgotError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">
                  {forgotError}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="label-caps text-[#c3c5d9] ml-1">E-MAIL</label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                  <input
                    required
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nome@exemplo.com"
                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-14 mt-2 bg-gradient-to-r from-primary-container to-blue-700 text-white font-semibold text-lg rounded-xl shadow-[0_0_12px_rgba(0,87,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {forgotLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                {!forgotLoading && <ArrowRight className="size-5" />}
              </button>
            </form>
          ) : (
            /* Sucesso */
            <div className="flex flex-col items-center gap-5 text-center py-6">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-500 size-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">E-mail enviado!</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Verifique sua caixa de entrada em <span className="text-white font-semibold">{forgotEmail}</span> e clique no link para criar uma nova senha.
                </p>
              </div>
              <p className="text-xs text-zinc-600">Não recebeu? Verifique a pasta de spam ou tente novamente.</p>
              <button
                onClick={() => { setForgotSent(false); setForgotEmail(''); }}
                className="text-primary-container font-bold hover:underline text-sm"
              >
                Reenviar e-mail
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Imagem de Fundo com Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
          alt="Barbershop Background" 
          className="w-full h-full object-cover opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/90 to-[#0a0a0a]"></div>
        
        {/* Luzes de Fundo (Glow) */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full"></div>
      </div>

      <main className="w-full max-w-[440px] z-10 flex flex-col gap-8 animate-in fade-in zoom-in duration-700">
        {/* Brand Identity */}
        <header className="flex flex-col items-center text-center gap-5">
          <div className="relative group">
            {/* Brilho atrás do logo */}
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            
            <div className="relative w-24 h-24 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500">
              <img 
                src="/icon.svg" 
                alt="Logo" 
                className="w-[60%] h-[60%] object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
              Barbearia <span className="text-blue-500">Styllus</span>
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] ml-1">
              The Digital Experience
            </p>
          </div>
        </header>

        {/* Card Glassmorphism */}
        <section className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center animate-shake">
                {error === 'Invalid login credentials' ? 'E-MAIL OU SENHA INCORRETOS' : error.toUpperCase()}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 tracking-widest ml-1 uppercase">Nome Completo</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 size-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-black/20 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder:text-zinc-700 text-sm font-medium" 
                      placeholder="Ex: João Silva" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 tracking-widest ml-1 uppercase">WhatsApp</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 size-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-black/20 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder:text-zinc-700 text-sm font-medium" 
                      placeholder="(00) 00000-0000" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">Acesso Profissional</label>
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">(Opcional)</span>
                  </div>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 size-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-black/20 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder:text-zinc-700 text-sm font-medium" 
                      placeholder="Código do Barbeiro" 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 tracking-widest ml-1 uppercase">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 size-5 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-black/20 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder:text-zinc-700 text-sm font-medium" 
                  placeholder="seu@email.com" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">Senha</label>
                {isLogin && (
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-tighter">
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 size-5 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 bg-black/20 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder:text-zinc-700 text-sm font-medium" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors" 
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Processando...' : (isLogin ? 'Acessar Conta' : 'Criar Conta')}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-2">
             <p className="text-zinc-500 text-xs font-bold">
               {isLogin ? 'AINDA NÃO É CLIENTE?' : 'JÁ POSSUI CADASTRO?'}
             </p>
             <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-white font-black text-sm uppercase tracking-widest hover:text-blue-500 transition-colors"
             >
                {isLogin ? 'Criar Conta Grátis' : 'Fazer Login Agora'}
             </button>
          </div>
        </section>

        {/* Trusted Footer */}
        <footer className="text-center">
           <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em]">
             © 2026 Barbearia Styllus • Premium Quality
           </p>
        </footer>
      </main>
    </div>
  );
}
