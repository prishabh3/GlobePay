'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { isAuthenticated } from '@/lib/auth';
import { cardService } from '@/services/card.service';

const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function CardsPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data } = useSWR('/cards', () => cardService.getCards());
  const cards = data?.data?.data ?? [];

  const [issuing, setIssuing] = useState(false);
  const [form, setForm] = useState({ cardholderName: '', currency: 'USD', spendingLimit: '' });
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const handleIssue = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError('');
    setIssuing(true);
    try {
      await cardService.issueCard({ cardholderName: form.cardholderName, currency: form.currency, spendingLimit: form.spendingLimit ? Number(form.spendingLimit) : undefined });
      mutate('/cards');
      setForm({ cardholderName: '', currency: 'USD', spendingLimit: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue card.');
    } finally {
      setIssuing(false);
    }
  };

  const handleFreeze = async (cardId: string, frozen: boolean) => {
    setActionLoading(cardId);
    try {
      frozen ? await cardService.unfreezeCard(cardId) : await cardService.freezeCard(cardId);
      mutate('/cards');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Virtual Cards</h1>

        {cards.length === 0 ? (
          <Card className="p-6"><p className="text-gray-400 text-sm">No cards yet. Issue your first virtual card below.</p></Card>
        ) : (
          <div className="space-y-4">
            {cards.map((card: any) => (
              <div key={card.id} className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-md text-white">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-blue-200 text-xs uppercase tracking-widest font-medium">Virtual Card</p>
                    <p className="text-2xl font-mono font-bold mt-1.5 tracking-widest">{card.maskedNumber}</p>
                  </div>
                  <Badge text={card.status} variant={statusVariant(card.status)} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-blue-200 text-xs mb-0.5">Cardholder</p>
                    <p className="font-semibold">{card.cardholderName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-200 text-xs mb-0.5">Expires</p>
                    <p className="font-semibold">{new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-200 text-xs mb-0.5">Currency</p>
                    <p className="font-semibold">{card.currency}</p>
                  </div>
                </div>
                {card.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleFreeze(card.id, card.status === 'FROZEN')}
                    disabled={actionLoading === card.id}
                    className="mt-5 text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === card.id ? '…' : card.status === 'FROZEN' ? 'Unfreeze Card' : 'Freeze Card'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Issue New Card</h2>
          <Card className="p-6">
            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className={labelClass}>Cardholder Name</label>
                <input required value={form.cardholderName} onChange={e => setForm({ ...form, cardholderName: e.target.value })} className={inputClass} placeholder="JOHN DOE" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={inputClass}>
                    {['USD', 'INR', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Spending Limit (optional)</label>
                  <input type="number" min="0" value={form.spendingLimit} onChange={e => setForm({ ...form, spendingLimit: e.target.value })} className={inputClass} placeholder="1000" />
                </div>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
              <button type="submit" disabled={issuing} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                {issuing ? 'Issuing…' : 'Issue Virtual Card'}
              </button>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
