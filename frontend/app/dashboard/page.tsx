'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { isAuthenticated } from '@/lib/auth';
import { userService } from '@/services/user.service';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';
import { creditService } from '@/services/credit.service';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const { data: profileRes } = useSWR('/users/me', () => userService.getProfile());
  const { data: walletsRes } = useSWR('/wallets', () => walletService.getWallets());
  const { data: txRes } = useSWR('/transactions/history', () => transactionService.getHistory(0, 5));
  const { data: creditRes } = useSWR('/credit/score', () => creditService.getScore().catch(() => null));

  const profile = profileRes?.data?.data;
  const wallets = walletsRes?.data?.data ?? [];
  const transactions = txRes?.data?.data?.content ?? [];
  const credit = creditRes?.data?.data;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {profile ? `Welcome, ${profile.firstName}` : 'Dashboard'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              KYC Status:{' '}
              {profile && <Badge text={profile.kycStatus} variant={statusVariant(profile.kycStatus)} />}
            </p>
          </div>
        </div>

        {/* Wallets */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Wallets</h2>
          {wallets.length === 0 ? (
            <Card>
              <p className="text-slate-400 text-sm">No wallets yet. Complete KYC to get started.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((w: any) => (
                <Card key={w.id}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm font-medium">{w.currency} Wallet</span>
                    <Badge text={w.status} variant={statusVariant(w.status)} />
                  </div>
                  <p className="text-3xl font-bold">
                    {Number(w.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">{w.currency}</p>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Credit Score */}
        {credit && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Credit Summary</h2>
            <Card>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-slate-400 text-sm">Credit Score</p>
                  <p className="text-4xl font-bold text-blue-400">{credit.creditScore}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Credit Limit</p>
                  <p className="text-2xl font-bold">${Number(credit.creditLimit).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Risk Level</p>
                  <Badge text={credit.riskLevel} variant={statusVariant(credit.riskLevel === 'LOW' ? 'ACTIVE' : credit.riskLevel === 'MEDIUM' ? 'PENDING' : 'FAILED')} />
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Recent Transactions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <button onClick={() => router.push('/transactions')} className="text-blue-400 text-sm hover:underline">
              View all
            </button>
          </div>
          <Card className="p-0 overflow-hidden">
            {transactions.length === 0 ? (
              <p className="text-slate-400 text-sm p-6">No transactions yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-4 capitalize">{tx.type.toLowerCase()}</td>
                      <td className="p-4 font-medium">{tx.amount} {tx.currency}</td>
                      <td className="p-4"><Badge text={tx.status} variant={statusVariant(tx.status)} /></td>
                      <td className="p-4 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
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
