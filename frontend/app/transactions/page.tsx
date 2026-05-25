'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import CopyButton from '@/components/ui/CopyButton';
import { isAuthenticated } from '@/lib/auth';
import { formatCurrency, formatDate, truncate } from '@/lib/format';
import { transactionService } from '@/services/transaction.service';

const TX_TYPES = ['All', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'REFUND'];
const TX_STATUSES = ['All', 'COMPLETED', 'PENDING', 'PROCESSING', 'FAILED', 'REFUNDED'];

export default function TransactionsPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const { data, isLoading } = useSWR(['/transactions/history', page], () => transactionService.getHistory(page, 20));
  const paged = data?.data?.data;
  const transactions = paged?.content ?? [];

  const filtered = useMemo(() => transactions.filter((tx: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q || tx.id.toLowerCase().includes(q) ||
      tx.type.toLowerCase().includes(q) ||
      (tx.description ?? '').toLowerCase().includes(q) ||
      String(tx.amount).includes(q);
    const matchType = filterType === 'All' || tx.type === filterType;
    const matchStatus = filterStatus === 'All' || tx.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  }), [transactions, search, filterType, filterStatus]);

  const selectClass = 'bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          {paged && <span className="text-sm text-gray-400">{paged.totalElements} total</span>}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by ID, type, or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}>
            {TX_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectClass}>
            {TX_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <table className="w-full text-sm">
              <tbody>{[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} cols={6} />)}</tbody>
            </table>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="transactions"
              title={transactions.length === 0 ? 'No transactions yet' : 'No results match your filters'}
              description={transactions.length === 0 ? 'Your transaction history will appear here.' : 'Try adjusting your search or filters.'}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['ID', 'Type', 'Amount', 'Status', 'Description', 'Date'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-gray-400">{truncate(tx.id)}</span>
                            <CopyButton text={tx.id} />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 capitalize text-gray-700">{tx.type.toLowerCase()}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{formatCurrency(tx.amount, tx.currency)}</td>
                        <td className="px-5 py-3.5"><Badge text={tx.status} variant={statusVariant(tx.status)} /></td>
                        <td className="px-5 py-3.5 text-gray-400 max-w-48 truncate">{tx.description ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filtered.map((tx: any) => (
                  <div key={tx.id} className="px-4 py-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{tx.type.toLowerCase()}</p>
                        {tx.description && <p className="text-xs text-gray-400">{tx.description}</p>}
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(tx.amount, tx.currency)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-gray-400">{truncate(tx.id)}</span>
                        <CopyButton text={tx.id} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                        <Badge text={tx.status} variant={statusVariant(tx.status)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {paged && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                  <span className="text-sm text-gray-500">Page {paged.pageNumber + 1} of {paged.totalPages}</span>
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
