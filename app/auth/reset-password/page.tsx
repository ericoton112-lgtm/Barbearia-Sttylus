'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // O Supabase processa o token do link de reset pelo hash da URL automaticamente.
    // Aguardamos o evento de mudança de sessão para confirmar que o token é válido.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);

      // Redireciona após 3 segundos
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile?.role === 'barber') {
            router.replace('/professional-dashboard');
          } else {
            router.replace('/client-home');
          }
        } else {
          router.replace('/login');
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-container/5 blur-[100px] rounded-full"></div>
      </div>

      <main className="w-full max-w-md z-10 flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="w-14 h-14 bg-primary-container/10 border border-primary-container/30 rounded-2xl flex items-center justify-center">
            <Lock className="text-primary-container size-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Nova senha</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Escolha uma senha forte para proteger sua conta.
          </p>
        </header>

        {success ? (
          /* Sucesso */
          <div className="flex flex-col items-center gap-5 text-center py-6">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-green-500 size-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Senha redefinida!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Sua senha foi atualizada com sucesso. Redirecionando...
              </p>
            </div>
            <Loader2 className="text-zinc-600 animate-spin size-5" />
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {!sessionReady && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm text-center">
                Validando seu link de recuperação...
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Nova Senha */}
            <div className="flex flex-col gap-1">
              <label className="label-caps text-[#c3c5d9] ml-1">NOVA SENHA</label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                <input
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50"
                  placeholder="Mínimo 6 caracteres"
                  type={showPassword ? 'text' : 'password'}
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

            {/* Confirmar Senha */}
            <div className="flex flex-col gap-1">
              <label className="label-caps text-[#c3c5d9] ml-1">CONFIRMAR SENHA</label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a2] size-5 group-focus-within:text-primary-container transition-colors" />
                <input
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 bg-surface-container-low border border-outline-variant/30 rounded-xl text-white focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all placeholder:text-[#8d90a2]/50"
                  placeholder="Repita a nova senha"
                  type={showConfirm ? 'text' : 'password'}
                />
                <button
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d90a2] hover:text-white transition-colors"
                  type="button"
                >
                  {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {/* Indicador de match */}
              {confirmPassword.length > 0 && (
                <p className={`text-xs ml-1 mt-1 font-semibold ${password === confirmPassword ? 'text-green-500' : 'text-red-400'}`}>
                  {password === confirmPassword ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full h-14 mt-2 bg-gradient-to-r from-primary-container to-blue-700 text-white font-semibold text-lg rounded-xl shadow-[0_0_12px_rgba(0,87,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
              {!loading && <ArrowRight className="size-5" />}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
