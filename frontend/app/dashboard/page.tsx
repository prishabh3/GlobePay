'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { isAuthenticated } from '@/lib/auth';
import { userService } from '@/services/user.service';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';
import { creditService } from '@/services/credit.service';

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data: profileRes } = useSWR('/users/me', () => userService.getProfile());
  const { data: walletsRes } = useSWR('/wallets', () => walletService.getWallets());
  const { data: txRes } = useSWR('/transactions/history', () => transactionService.getHistory(0, 5));
  const { data: creditRes } = useSWR('/credit/score', () => creditService.getScore().catch(() => null));

  const profile = profileRes?.data?.data;
  const wallets = walletsRes?.data?.data ?? [];
  const transactions = txRes?.data?.data?.content ?? [];
  const credit = creditRes?.data?.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile ? `Welcome back, ${profile.firstName}` : 'Dashboard'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm text-gray-500">KYC Status</span>
              {profile && <Badge text={profile.kycStatus} variant={statusVariant(profile.kycStatus)} />}
            </div>
          </div>
          <button
            onClick={() => router.push('/transfer')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Send Money
          </button>
        </div>

        {/* Wallets */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Wallets</h2>
          {wallets.length === 0 ? (
            <Card className="p-6">
              <p className="text-gray-400 text-sm">No wallets yet. Complete KYC to get started.</p>
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
                    {Number(w.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{w.currency}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Credit Score */}
        {credit && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Credit Summary</h2>
            <Card className="p-6">
              <div className="flex items-center gap-10">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Credit Score</p>
                  <p className="text-4xl font-bold text-blue-600">{credit.creditScore}</p>
                </div>
                <div className="w-px h-12 bg-gray-100" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Credit Limit</p>
                  <p className="text-2xl font-bold text-gray-900">${Number(credit.creditLimit).toLocaleString()}</p>
                </div>
                <div className="w-px h-12 bg-gray-100" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Risk Level</p>
                  <Badge text={credit.riskLevel} variant={statusVariant(credit.riskLevel === 'LOW' ? 'ACTIVE' : credit.riskLevel === 'MEDIUM' ? 'PENDING' : 'FAILED')} />
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Recent Transactions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700">Recent Transactions</h2>
            <button onClick={() => router.push('/transactions')} className="text-blue-600 text-sm font-medium hover:underline">
              View all
            </button>
          </div>
          <Card className="p-0 overflow-hidden">
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-sm p-6">No transactions yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 capitalize text-gray-700">{tx.type.toLowerCase()}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{tx.amount} {tx.currency}</td>
                      <td className="px-5 py-3.5"><Badge text={tx.status} variant={statusVariant(tx.status)} /></td>
                      <td className="px-5 py-3.5 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
