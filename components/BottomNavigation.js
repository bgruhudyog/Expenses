
import { useRouter } from 'next/router';
import { 
  MdDashboard, 
  MdAttachMoney, 
  MdCreditCard,
  MdPieChart 
} from 'react-icons/md';

export default function BottomNavigation() {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <MdDashboard size={24} /> },
    { path: '/transactions', label: 'Transactions', icon: <MdAttachMoney size={24} /> },
    { path: '/credit', label: 'Credit', icon: <MdCreditCard size={24} /> },
    { path: '/reports', label: 'Reports', icon: <MdPieChart size={24} /> },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <div
          key={item.path}
          className={`bottom-nav-item ${currentPath === item.path ? 'active' : ''}`}
          onClick={() => router.push(item.path)}
        >
          {item.icon}
          <span className="nav-label">{item.label}</span>
        </div>
      ))}

      <style jsx>{`
        .nav-label {
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </nav>
  );
}
