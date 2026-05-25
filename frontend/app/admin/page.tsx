'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CopyButton from '@/components/ui/CopyButton';
import { isAuthenticated } from '@/lib/auth';
import { formatDate, truncate } from '@/lib/format';
import { userService } from '@/services/user.service';

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const [tab, setTab] = useState<'kyc' | 'users'>('kyc');
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState('');

  const [confirm, setConfirm] = useState<{ open: boolean; userId: string; approved: boolean }>({
    open: false, userId: '', approved: true,
  });

  const { data: kycData, isLoading: kycLoading } = useSWR(['admin/kyc', page], () => userService.getPendingKyc(page, 20));
  const { data: usersData, isLoading: usersLoading } = useSWR(['admin/users', page], () => userService.getAdminUsers(page, 20));

  const kycUsers = kycData?.data?.data?.content ?? [];
  const allUsers = usersData?.data?.data?.content ?? [];
  const kycPaged = kycData?.data?.data;
  const usersPaged = usersData?.data?.data;

  const requestReview = (userId: string, approved: boolean) => {
    setConfirm({ open: true, userId, approved });
  };

  const executeReview = async () => {
    setActionLoading(confirm.userId + (confirm.approved ? '-approve' : '-reject'));
    try {
      await userService.reviewKyc(confirm.userId, confirm.approved);
      mutate(['admin/kyc', page]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
      setConfirm(c => ({ ...c, open: false }));
    }
  };

  const Pagination = ({ paged, label }: { paged: any; label?: string }) => (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
      <span className="text-sm text-gray-500">{label ?? `Page ${paged.pageNumber + 1} of ${paged.totalPages}`}</span>
      <div className="flex gap-2">
        <button disabled={paged.first} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
        <button disabled={paged.last} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="flex gap-1 border-b border-gray-200">
          {(['kyc', 'users'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(0); }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t === 'kyc' ? 'Pending KYC' : 'All Users'}
            </button>
          ))}
        </div>

        {tab === 'kyc' && (
          <Card className="p-0 overflow-hidden">
            {kycLoading ? (
              <table className="w-full text-sm">
                <tbody>{[1, 2, 3].map(i => <TableRowSkeleton key={i} cols={5} />)}</tbody>
              </table>
            ) : kycUsers.length === 0 ? (
              <EmptyState
                icon="kyc"
                title="No pending KYC requests"
                description="All submitted KYC applications have been reviewed."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['User', 'Email', 'KYC Status', 'Joined', 'Actions'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {kycUsers.map((user: any) => {
                        const busy = !!actionLoading;
                        return (
                          <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-mono text-xs text-gray-400">{truncate(user.userId)}</span>
                                <CopyButton text={user.userId} />
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                            <td className="px-5 py-3.5"><Badge text={user.kycStatus} variant={statusVariant(user.kycStatus)} /></td>
                            <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => requestReview(user.userId, true)}
                                  disabled={busy}
                                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 disabled:opacity-50 transition-colors"
                                >
                                  {actionLoading === user.userId + '-approve' ? '…' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => requestReview(user.userId, false)}
                                  disabled={busy}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 disabled:opacity-50 transition-colors"
                                >
                                  {actionLoading === user.userId + '-reject' ? '…' : 'Reject'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {kycUsers.map((user: any) => (
                    <div key={user.userId} className="px-4 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        <Badge text={user.kycStatus} variant={statusVariant(user.kycStatus)} />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => requestReview(user.userId, true)}
                          disabled={!!actionLoading}
                          className="flex-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => requestReview(user.userId, false)}
                          disabled={!!actionLoading}
                          className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {kycPaged && <Pagination paged={kycPaged} />}
              </>
            )}
          </Card>
        )}

        {tab === 'users' && (
          <Card className="p-0 overflow-hidden">
            {usersLoading ? (
              <table className="w-full text-sm">
                <tbody>{[1, 2, 3].map(i => <TableRowSkeleton key={i} cols={5} />)}</tbody>
              </table>
            ) : allUsers.length === 0 ? (
              <EmptyState icon="default" title="No users found" />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Name', 'Email', 'KYC', 'Country', 'Joined'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allUsers.map((user: any) => (
                        <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                          <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                          <td className="px-5 py-3.5"><Badge text={user.kycStatus} variant={statusVariant(user.kycStatus)} /></td>
                          <td className="px-5 py-3.5 text-gray-400">{user.country ?? '—'}</td>
                          <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {allUsers.map((user: any) => (
                    <div key={user.userId} className="px-4 py-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.country ?? '—'} · {formatDate(user.createdAt)}</p>
                      </div>
                      <Badge text={user.kycStatus} variant={statusVariant(user.kycStatus)} />
                    </div>
                  ))}
                </div>

                {usersPaged && <Pagination paged={usersPaged} label={`${usersPaged.totalElements} users total`} />}
              </>
            )}
          </Card>
        )}
      </main>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.approved ? 'Approve KYC?' : 'Reject KYC?'}
        message={
          confirm.approved
            ? 'This will approve the user\'s KYC and grant full account access.'
            : 'This will reject the user\'s KYC. They will need to resubmit documents.'
        }
        confirmLabel={confirm.approved ? 'Approve' : 'Reject'}
        variant={confirm.approved ? 'default' : 'danger'}
        loading={!!actionLoading}
        onConfirm={executeReview}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
}
