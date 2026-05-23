'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { isAuthenticated } from '@/lib/auth';
import { cardService } from '@/services/card.service';

export default function CardsPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data } = useSWR('/cards', () => cardService.getCards());
  const cards = data?.data?.data ?? [];

  const [issuing, setIssuing] = useState(false);
  const [form, setForm] = useState({ cardholderName: '', currency: 'USD', spendingLimit: '' });
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIssuing(true);
    try {
      await cardService.issueCard({
        cardholderName: form.cardholderName,
        currency: form.currency,
        spendingLimit: form.spendingLimit ? Number(form.spendingLimit) : undefined,
      });
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Virtual Cards</h1>

        {/* Cards list */}
        {cards.length === 0 ? (
          <Card><p className="text-slate-400 text-sm">No cards yet. Issue your first virtual card below.</p></Card>
        ) : (
          <div className="space-y-4">
            {cards.map((card: any) => (
              <div
                key={card.id}
                className="bg-gradient-to-br from-blue-900 to-slate-800 border border-slate-700 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-widest">Virtual Card</p>
                    <p className="text-xl font-mono font-bold mt-1">{card.maskedNumber}</p>
                  </div>
                  <Badge text={card.status} variant={statusVariant(card.status)} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Cardholder</p>
                    <p className="font-semibold">{card.cardholderName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Expires</p>
                    <p className="font-semibold">{new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Currency</p>
                    <p className="font-semibold">{card.currency}</p>
                  </div>
                </div>
                {card.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleFreeze(card.id, card.status === 'FROZEN')}
                    disabled={actionLoading === card.id}
                    className="mt-4 text-sm bg-slate-700/60 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === card.id ? '…' : card.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Issue card form */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Issue New Card</h2>
          <Card>
            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cardholder Name</label>
                <input
                  required
                  value={form.cardholderName}
                  onChange={e => setForm({ ...form, cardholderName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="JOHN DOE"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    {['USD', 'INR', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Spending Limit (optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.spendingLimit}
                    onChange={e => setForm({ ...form, spendingLimit: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="1000"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={issuing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {issuing ? 'Issuing…' : 'Issue Virtual Card'}
              </button>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
