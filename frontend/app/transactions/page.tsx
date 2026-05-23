'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { isAuthenticated } from '@/lib/auth';
import { transactionService } from '@/services/transaction.service';

export default function TransactionsPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const [page, setPage] = useState(0);
  const { data, isLoading } = useSWR(
    ['/transactions/history', page],
    () => transactionService.getHistory(page, 20)
  );

  const paged = data?.data?.data;
  const transactions = paged?.content ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-slate-400 text-sm p-6">No transactions found.</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Description</th>
                    <th className="text-left p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-4 font-mono text-xs text-slate-400">{tx.id.slice(0, 8)}…</td>
                      <td className="p-4 capitalize">{tx.type.toLowerCase()}</td>
                      <td className="p-4 font-medium">{tx.amount} {tx.currency}</td>
                      <td className="p-4"><Badge text={tx.status} variant={statusVariant(tx.status)} /></td>
                      <td className="p-4 text-slate-400">{tx.description ?? '—'}</td>
                      <td className="p-4 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paged && (
                <div className="flex items-center justify-between p-4 border-t border-slate-700">
                  <span className="text-slate-400 text-sm">
                    Page {paged.pageNumber + 1} of {paged.totalPages} ({paged.totalElements} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={paged.first}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-600 transition-colors"
                    >Previous</button>
                    <button
                      disabled={paged.last}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-600 transition-colors"
                    >Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
