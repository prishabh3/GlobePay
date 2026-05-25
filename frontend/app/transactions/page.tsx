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
  const { data, isLoading } = useSWR(['/transactions/history', page], () => transactionService.getHistory(page, 20));
  const paged = data?.data?.data;
  const transactions = paged?.content ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-gray-400 text-sm p-6">No transactions found.</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['ID', 'Type', 'Amount', 'Status', 'Description', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{tx.id.slice(0, 8)}…</td>
                      <td className="px-5 py-3.5 capitalize text-gray-700">{tx.type.toLowerCase()}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{tx.amount} {tx.currency}</td>
                      <td className="px-5 py-3.5"><Badge text={tx.status} variant={statusVariant(tx.status)} /></td>
                      <td className="px-5 py-3.5 text-gray-400">{tx.description ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paged && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                  <span className="text-sm text-gray-500">Page {paged.pageNumber + 1} of {paged.totalPages} ({paged.totalElements} total)</span>
                  <div className="flex gap-2">
                    <button disabled={paged.first} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
                    <button disabled={paged.last} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
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
