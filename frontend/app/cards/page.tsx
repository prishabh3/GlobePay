'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { isAuthenticated } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { cardService } from '@/services/card.service';

const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

function VirtualCard({ card, onFreeze, onCancel, actionLoading }: {
  card: any;
  onFreeze: (id: string, frozen: boolean) => void;
  onCancel: (id: string) => void;
  actionLoading: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const busy = actionLoading === card.id;

  return (
    <div className="relative" style={{ perspective: '1000px', height: '220px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-md text-white cursor-pointer"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={() => setFlipped(true)}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-widest font-medium">GlobePay Virtual</p>
              <p className="text-2xl font-mono font-bold mt-1.5 tracking-widest">{card.maskedNumber}</p>
            </div>
            <Badge text={card.status} variant={statusVariant(card.status)} />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-blue-200 text-xs mb-0.5">Cardholder</p>
              <p className="font-semibold text-sm">{card.cardholderName}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs mb-0.5">Expires</p>
              <p className="font-semibold text-sm">
                {new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs mb-0.5">Currency</p>
              <p className="font-semibold text-sm">{card.currency}</p>
            </div>
          </div>
          <p className="text-blue-300 text-xs mt-4 opacity-70">Tap to flip →</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-6 shadow-md text-white cursor-pointer"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={() => setFlipped(false)}
        >
          <div className="mt-4 bg-white/10 h-10 rounded" />
          <div className="mt-6 space-y-1">
            <p className="text-blue-200 text-xs">Issued</p>
            <p className="text-sm font-medium">{formatDate(card.createdAt)}</p>
          </div>
          {card.spendingLimit && (
            <div className="mt-4 space-y-1">
              <p className="text-blue-200 text-xs">Spending Limit</p>
              <p className="text-sm font-semibold">{formatCurrency(card.spendingLimit, card.currency)}</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                <div className="bg-white rounded-full h-1.5 w-2/5" />
              </div>
            </div>
          )}
          {card.status !== 'CANCELLED' && (
            <div className="flex gap-2 mt-5">
              <button
                onClick={e => { e.stopPropagation(); onFreeze(card.id, card.status === 'FROZEN'); }}
                disabled={busy}
                className="flex-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {busy ? '…' : card.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onCancel(card.id); }}
                disabled={busy}
                className="flex-1 text-xs bg-red-500/30 hover:bg-red-500/50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                Cancel Card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data, isLoading } = useSWR('/cards', () => cardService.getCards());
  const cards = data?.data?.data ?? [];

  const [issuing, setIssuing] = useState(false);
  const [form, setForm] = useState({ cardholderName: '', currency: 'USD', spendingLimit: '' });
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const [confirm, setConfirm] = useState<{ open: boolean; cardId: string; type: 'freeze' | 'unfreeze' | 'cancel' }>({
    open: false, cardId: '', type: 'freeze',
  });

  const handleIssue = async (e: React.BaseSyntheticEvent) => {
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

  const requestFreeze = (cardId: string, frozen: boolean) => {
    setConfirm({ open: true, cardId, type: frozen ? 'unfreeze' : 'freeze' });
  };

  const requestCancel = (cardId: string) => {
    setConfirm({ open: true, cardId, type: 'cancel' });
  };

  const executeConfirm = async () => {
    setActionLoading(confirm.cardId);
    try {
      if (confirm.type === 'freeze') await cardService.freezeCard(confirm.cardId);
      else if (confirm.type === 'unfreeze') await cardService.unfreezeCard(confirm.cardId);
      else await cardService.cancelCard(confirm.cardId);
      mutate('/cards');
    } finally {
      setActionLoading('');
      setConfirm(c => ({ ...c, open: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Virtual Cards</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : cards.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon="cards"
              title="No cards yet"
              description="Issue your first virtual card to start spending globally."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cards.map((card: any) => (
              <VirtualCard
                key={card.id}
                card={card}
                onFreeze={requestFreeze}
                onCancel={requestCancel}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Issue New Card</h2>
          <Card className="p-6">
            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className={labelClass}>Cardholder Name</label>
                <input
                  required
                  value={form.cardholderName}
                  onChange={e => setForm({ ...form, cardholderName: e.target.value })}
                  className={inputClass}
                  placeholder="JOHN DOE"
                />
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
                  <input
                    type="number" min="0"
                    value={form.spendingLimit}
                    onChange={e => setForm({ ...form, spendingLimit: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
              <button
                type="submit"
                disabled={issuing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {issuing ? 'Issuing…' : 'Issue Virtual Card'}
              </button>
            </form>
          </Card>
        </section>
      </main>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.type === 'cancel' ? 'Cancel card?' : confirm.type === 'freeze' ? 'Freeze card?' : 'Unfreeze card?'}
        message={
          confirm.type === 'cancel'
            ? 'This will permanently cancel the card. This action cannot be undone.'
            : confirm.type === 'freeze'
            ? 'The card will be temporarily blocked from making purchases.'
            : 'The card will be re-enabled for purchases.'
        }
        confirmLabel={confirm.type === 'cancel' ? 'Cancel Card' : confirm.type === 'freeze' ? 'Freeze' : 'Unfreeze'}
        variant={confirm.type === 'cancel' ? 'danger' : 'default'}
        loading={!!actionLoading}
        onConfirm={executeConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
}
