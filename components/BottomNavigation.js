import { useRouter } from 'next/router';
import Link from 'next/link';
import { MdDashboard, MdAttachMoney, MdCreditCard, MdBarChart, MdCategory } from 'react-icons/md';

export default function BottomNavigation() {
  const router = useRouter();
  const path = router.pathname;

  return (
    <div className="bottom-nav">
      <Link href="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
        <MdDashboard size={22} />
        <span className="nav-label">Home</span>
      </Link>
      <Link href="/transactions" className={`nav-item ${path === '/transactions' ? 'active' : ''}`}>
        <MdAttachMoney size={22} />
        <span className="nav-label">Trans</span>
      </Link>
      <Link href="/credit" className={`nav-item ${path === '/credit' ? 'active' : ''}`}>
        <MdCreditCard size={22} />
        <span className="nav-label">Credit</span>
      </Link>
      <Link href="/reports" className={`nav-item ${path === '/reports' ? 'active' : ''}`}>
        <MdBarChart size={22} />
        <span className="nav-label">Reports</span>
      </Link>
      <Link href="/categories" className={`nav-item ${path === '/categories' ? 'active' : ''}`}>
        <MdCategory size={22} />
        <span className="nav-label">Cat</span>
      </Link>

      <style jsx>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          background-color: var(--paper-bg);
          padding: 10px 0;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          z-index: 90;
        }
        
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text);
          opacity: 0.7;
          transition: all 0.3s;
          padding: 4px;
          width: 20%;
        }
        
        .nav-item.active {
          opacity: 1;
          color: var(--primary);
        }
        
        .nav-label {
          font-size: 0.7rem;
          margin-top: 4px;
          text-align: center;
        }
        
        @media (max-width: 400px) {
          .nav-label {
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}