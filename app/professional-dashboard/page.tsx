'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Check } from 'lucide-react';

export default function ProfessionalDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: appts } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        client:profiles!client_id (full_name),
        service:services!service_id (name, price)
      `)
      .eq('barber_id', user.id)
      .gte('appointment_date', todayStart.toISOString())
      .lte('appointment_date', todayEnd.toISOString())
      .order('appointment_date', { ascending: true });

    if (appts) setAppointments(appts);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleComplete = async (id: string) => {
    await supabase.from('appointments').update({ status: 'concluído' }).eq('id', id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-white p-5">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold italic uppercase">Painel Styllus</h1>
        <button onClick={handleLogout} className="p-2 text-red-500">
          <LogOut size={24} />
        </button>
      </header>

      <main className="space-y-6">
        <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2">Agendamentos de Hoje</h2>
        
        {appointments.length === 0 ? (
          <p className="text-zinc-500 text-center py-10">Nenhum agendamento para hoje.</p>
        ) : (
          appointments.map(appt => (
            <div key={appt.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-blue-500">
                  {new Date(appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="font-bold">{appt.client?.full_name}</p>
                <p className="text-xs text-zinc-400">{appt.service?.name}</p>
              </div>
              
              {appt.status !== 'concluído' ? (
                <button 
                  onClick={() => handleComplete(appt.id)}
                  className="bg-blue-600 p-2 rounded-lg"
                >
                  <Check size={20} />
                </button>
              ) : (
                <span className="text-green-500 text-xs font-bold">OK</span>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
