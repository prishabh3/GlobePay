'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { isAuthenticated } from '@/lib/auth';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';

export default function TransferPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data: walletsRes } = useSWR('/wallets', () => walletService.getWallets());
  const wallets = walletsRes?.data?.data ?? [];

  const [form, setForm] = useState({
    fromWalletId: '',
    toWalletId: '',
    toUserId: '',
    amount: '',
    currency: 'USD',
    description: '',
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await transactionService.transfer({
        idempotencyKey: `tx-${Date.now()}`,
        fromWalletId: form.fromWalletId,
        toWalletId: form.toWalletId,
        toUserId: form.toUserId,
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description,
      });
      setResult(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Send Money</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">From Wallet</label>
              <select
                required
                value={form.fromWalletId}
                onChange={e => {
                  const wallet = wallets.find((w: any) => w.id === e.target.value);
                  setForm({ ...form, fromWalletId: e.target.value, currency: wallet?.currency ?? 'USD' });
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select wallet</option>
                {wallets.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.currency} — Balance: {Number(w.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Recipient Wallet ID</label>
              <input
                required
                value={form.toWalletId}
                onChange={e => setForm({ ...form, toWalletId: e.target.value })}
                placeholder="UUID of destination wallet"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Recipient User ID</label>
              <input
                required
                value={form.toUserId}
                onChange={e => setForm({ ...form, toUserId: e.target.value })}
                placeholder="UUID of recipient user"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Currency</label>
                <input
                  value={form.currency}
                  readOnly
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
              <input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Rent payment"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Sending…' : 'Send Money'}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-600">
              <h3 className="font-semibold mb-3">Transfer Result</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-mono text-xs">{result.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge text={result.status} variant={statusVariant(result.status)} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount</span>
                  <span>{result.amount} {result.currency}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
