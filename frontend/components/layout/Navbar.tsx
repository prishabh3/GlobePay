'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, getUser } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="text-xl font-bold text-white tracking-tight">
        Globe<span className="text-blue-400">Pay</span>
      </Link>
      <div className="flex items-center gap-6 text-sm text-slate-300">
        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <Link href="/transfer" className="hover:text-white transition-colors">Transfer</Link>
        <Link href="/transactions" className="hover:text-white transition-colors">Transactions</Link>
        <Link href="/kyc" className="hover:text-white transition-colors">KYC</Link>
        <Link href="/cards" className="hover:text-white transition-colors">Cards</Link>
        {user && (
          <span className="text-slate-400 text-xs border border-slate-700 rounded-lg px-2 py-1">
            {user.email}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
