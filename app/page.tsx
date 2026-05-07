'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        router.replace('/login');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }

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
    };

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0057ff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
