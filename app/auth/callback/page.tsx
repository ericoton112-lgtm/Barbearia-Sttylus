'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Aguarda o Supabase processar o token da URL
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Verificar se já tem perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          // Criar perfil para login social (Google)
          await supabase.from('profiles').insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            phone: '',
            role: 'client',
          });
          router.push('/client-home');
        } else if (profile.role === 'barber') {
          router.push('/professional-dashboard');
        } else {
          router.push('/client-home');
        }
      } else {
        router.push('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Autenticando com Google...</p>
      </div>
    </div>
  );
}
