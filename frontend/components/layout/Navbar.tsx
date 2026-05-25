'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { logout, getUser } from '@/lib/auth';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transfer', label: 'Transfer' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/kyc', label: 'KYC' },
  { href: '/cards', label: 'Cards' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-0 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900 py-4 tracking-tight">
          Globe<span className="text-blue-600">Pay</span>
        </Link>
        <div className="hidden md:flex items-center">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-5 text-sm font-medium border-b-2 transition-colors ${
                pathname === link.href
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
