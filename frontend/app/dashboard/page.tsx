'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { WalletCardSkeleton, Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import CopyButton from '@/components/ui/CopyButton';
import { isAuthenticated } from '@/lib/auth';
import { formatCurrency, formatShortDate } from '@/lib/format';
import { userService } from '@/services/user.service';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';
import { creditService } from '@/services/credit.service';

function buildChartData(transactions: any[]) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  return last7.map(date => ({
    date: formatShortDate(date),
    amount: transactions
      .filter((tx: any) => tx.createdAt?.slice(0, 10) === date)
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0),
  }));
}

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data: profileRes, isLoading: profileLoading } = useSWR('/users/me', () => userService.getProfile());
  const { data: walletsRes, isLoading: walletsLoading } = useSWR('/wallets', () => walletService.getWallets());
  const { data: txRes, isLoading: txLoading } = useSWR('/transactions/history?size=30', () => transactionService.getHistory(0, 30));
  const { data: creditRes } = useSWR('/credit/score', () => creditService.getScore().catch(() => null));

  const profile = profileRes?.data?.data;
  const wallets = walletsRes?.data?.data ?? [];
  const allTx = txRes?.data?.data?.content ?? [];
  const recentTx = allTx.slice(0, 5);
  const credit = creditRes?.data?.data;
  const chartData = buildChartData(allTx);
  const hasChartData = chartData.some(d => d.amount > 0);

  const quickActions = [
    { label: 'Send Money', icon: '↗', href: '/transfer', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Cards', icon: '▤', href: '/cards', color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
    { label: 'KYC', icon: '✓', href: '/kyc', color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
    { label: 'History', icon: '≡', href: '/transactions', color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {profileLoading ? (
              <>
                <Skeleton className="h-7 w-52 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile ? `Welcome back, ${profile.firstName}` : 'Dashboard'}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm text-gray-500">KYC</span>
                  {profile && <Badge text={profile.kycStatus} variant={statusVariant(profile.kycStatus)} />}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {quickActions.map(a => (
              <button
                key={a.href}
                onClick={() => router.push(a.href)}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm ${a.color}`}
              >
                <span className="text-base leading-none">{a.icon}</span>
                <span className="hidden sm:inline">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wallets */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Wallets</h2>
          {walletsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map(i => <WalletCardSkeleton key={i} />)}
            </div>
          ) : wallets.length === 0 ? (
            <Card className="p-0">
              <EmptyState
                icon="wallets"
                title="No wallets yet"
                description="Complete KYC verification to get your first wallet."
                action={
                  <button onClick={() => router.push('/kyc')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Start KYC
                  </button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((w: any) => (
                <div key={w.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">{w.currency} Wallet</span>
                    <Badge text={w.status} variant={statusVariant(w.status)} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {formatCurrency(Number(w.balance), w.currency)}
                  </p>
                  <div className="flex items-center gap-1 mt-3">
                    <p className="text-xs text-gray-400 font-mono">{w.id.slice(0, 12)}…</p>
                    <CopyButton text={w.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Spending Chart */}
        {hasChartData && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">7-Day Activity</h2>
            <Card className="p-6">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48}
                    tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: any) => [`${Number(v).toFixed(2)}`, 'Total']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} fill="url(#colorAmt)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </section>
        )}

        {/* Credit Score */}
        {credit && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Credit</h2>
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Score</p>
                  <p className="text-4xl font-bold text-blue-600">{credit.creditScore}</p>
                </div>
                <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Limit</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(credit.creditLimit)}</p>
                </div>
                <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Risk</p>
                  <Badge
                    text={credit.riskLevel}
                    variant={statusVariant(credit.riskLevel === 'LOW' ? 'ACTIVE' : credit.riskLevel === 'MEDIUM' ? 'PENDING' : 'FAILED')}
                  />
                </div>
                {credit.scoreBreakdown && (
                  <>
                    <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                    <p className="text-xs text-gray-500 max-w-xs">{credit.scoreBreakdown}</p>
                  </>
                )}
              </div>
            </Card>
          </section>
        )}

        {/* Recent Transactions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Transactions</h2>
            <button onClick={() => router.push('/transactions')} className="text-blue-600 text-sm font-medium hover:underline">
              View all →
            </button>
          </div>
          <Card className="p-0 overflow-hidden">
            {txLoading ? (
              <table className="w-full text-sm">
                <tbody>{[1, 2, 3].map(i => <TableRowSkeleton key={i} cols={4} />)}</tbody>
              </table>
            ) : recentTx.length === 0 ? (
              <EmptyState
                icon="transactions"
                title="No transactions yet"
                description="Transactions will appear here once you send or receive money."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Type', 'Amount', 'Status', 'Date'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentTx.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 capitalize text-gray-700">{tx.type.toLowerCase()}</td>
                          <td className="px-5 py-3.5 font-semibold text-gray-900">{formatCurrency(tx.amount, tx.currency)}</td>
                          <td className="px-5 py-3.5"><Badge text={tx.status} variant={statusVariant(tx.status)} /></td>
                          <td className="px-5 py-3.5 text-gray-400">{formatShortDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile card list */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {recentTx.map((tx: any) => (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">{tx.type.toLowerCase()}</p>
                        <p className="text-xs text-gray-400">{formatShortDate(tx.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(tx.amount, tx.currency)}</p>
                        <Badge text={tx.status} variant={statusVariant(tx.status)} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
