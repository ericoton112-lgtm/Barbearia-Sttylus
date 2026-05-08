import type {Metadata} from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "Barbearia Styllus",
  description: "Sistema de Agendamento e Gestão para Barbearia Styllus",
  manifest: '/manifest.json',
  themeColor: '#0057ff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Styllus'
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} dark`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body suppressHydrationWarning className="font-sans">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                      registration.update(); // Forçar atualização
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
