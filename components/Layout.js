
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BottomNavigation from './BottomNavigation';

export default function Layout({ children, title = 'Finance Manager' }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Personal Finance Management App" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="main-container">
        {children}
      </main>

      <BottomNavigation />

      <style jsx>{`
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
          padding-bottom: 80px;
        }
      `}</style>
    </div>
  );
}
