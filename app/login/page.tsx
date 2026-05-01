'use client';

import { useState } from 'react';
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
            }
          }
        });

        if (signUpError) throw signUpError;

        // Se tiver o código de convite, atualizar o perfil para barbeiro
        if (isBarber && signUpData.user) {
          await supabase.from('profiles').update({ role: 'barber' }).eq('id', signUpData.user.id);
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

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col items-center justify-center p-5 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
            <div className="relative flex items-center justify-center w-full h-full bg-surface-container-low rounded-full border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-primary-container">content_cut</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tighter uppercase italic font-sans">
            STTYLUS
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

          {/* Divider */}
          {isLogin && (
            <>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-outline-variant/20"></div>
                <span className="label-caps text-[10px] text-[#8d90a2]">OU ACESSE COM</span>
                <div className="h-px flex-1 bg-outline-variant/20"></div>
              </div>

              {/* Social Logins */}
              <div className="flex gap-3">
                <button className="flex-1 h-14 flex items-center justify-center bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all">
                  <img 
                    alt="Google" 
                    className="w-6 h-6" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuChYIX9f_1UG5NloIsBo2_JCuXNWEah7JNGxeI_YQgm_SX0DvkIVn29Pq7xK7eUlKhQhekEzmz2IglS69UzUMbJVIsvp6smHyf5lGPM5gBhDO9wLzxLcYVokPrrAUi0SO6vt7GMDbexz8s6vZr2mwYncd4wewe8W733GJvpAT2F0WecZ93BoY7No00-CyP2xTfqfIACy6fWCRU5b8acWBhMUGre2QBf2hckKX0qfFiSOZY3w2LkLEppfXX37r_uusLGAnwdMMYtI47E"
                  />
                </button>
                <button className="flex-1 h-14 flex items-center justify-center bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all text-[#1877F2]">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>social_leaderboard</span>
                </button>
              </div>
            </>
          )}
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

      {/* Decorative Side Card - Desktop only */}
      <div className="hidden lg:block fixed right-12 top-1/2 -translate-y-1/2 w-80 h-[500px] rounded-3xl overflow-hidden border border-outline-variant/30 shadow-2xl rotate-3">
        <img 
          alt="Interior de Barbearia de Luxo" 
          className="w-full h-full object-cover grayscale brightness-50 contrast-125" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGUwDAtDflWu53Ur_LWu3jIGOljTEjFmvMjhNJHr58vmro35nQaa22MNiFBsGeXRxPzo3aAK-_e1_hFp3C_c3BFzUqpb97cdqr25Axl7mnEqrhA9QUd2a7_l8S1JShggTRB4tQGK3veiuJepxBisdc5xzJyCKac51lSIebbXH3JUhswsR4g_Nq3e0xsfD9fLdH7plfMSqmxunycJ3fH_XPNN3ZVXKssi42xRzlHRGDbOz_Kl1swvE1mjvZIxsx6JTjlWxJJJdp5XeX"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-2xl font-bold text-white leading-tight italic">Sua melhor versão começa aqui.</p>
        </div>
      </div>
    </div>
  );
}
