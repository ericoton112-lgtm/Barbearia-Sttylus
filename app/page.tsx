export default function RootPage() {
  return (
    <div style={{ background: '#131313', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
      <h1>Barbearia Styllus - Teste de Conexão</h1>
      <p>Se você está vendo isso, a conexão básica está funcionando.</p>
      <a href="/login" style={{ color: '#0057ff', marginTop: '20px' }}>Ir para o Login</a>
    </div>
  );
}
