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

const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function TransferPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data: walletsRes } = useSWR('/wallets', () => walletService.getWallets());
  const wallets = walletsRes?.data?.data ?? [];

  const [form, setForm] = useState({ fromWalletId: '', toWalletId: '', toUserId: '', amount: '', currency: 'USD', description: '' });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Money</h1>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>From Wallet</label>
              <select
                required
                value={form.fromWalletId}
                onChange={e => {
                  const wallet = wallets.find((w: any) => w.id === e.target.value);
                  setForm({ ...form, fromWalletId: e.target.value, currency: wallet?.currency ?? 'USD' });
                }}
                className={inputClass}
              >
                <option value="">Select wallet</option>
                {wallets.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.currency} — Balance: {Number(w.balance).toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Recipient Wallet ID</label>
              <input required value={form.toWalletId} onChange={e => setForm({ ...form, toWalletId: e.target.value })} placeholder="UUID of destination wallet" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Recipient User ID</label>
              <input required value={form.toUserId} onChange={e => setForm({ ...form, toUserId: e.target.value })} placeholder="UUID of recipient user" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount</label>
                <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <input value={form.currency} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Description (optional)</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Rent payment" className={inputClass} />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {loading ? 'Sending…' : 'Send Money'}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="font-semibold text-green-800 mb-3">Transfer Successful</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Transaction ID</span><span className="font-mono text-xs text-gray-700">{result.id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge text={result.status} variant={statusVariant(result.status)} /></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{result.amount} {result.currency}</span></div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
