'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { isAuthenticated } from '@/lib/auth';
import { userService } from '@/services/user.service';

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const [tab, setTab] = useState<'kyc' | 'users'>('kyc');
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState('');

  const { data: kycData, isLoading: kycLoading } = useSWR(['admin/kyc', page], () => userService.getPendingKyc(page, 20));
  const { data: usersData, isLoading: usersLoading } = useSWR(['admin/users', page], () => userService.getAdminUsers(page, 20));

  const kycUsers = kycData?.data?.data?.content ?? [];
  const allUsers = usersData?.data?.data?.content ?? [];
  const kycPaged = kycData?.data?.data;
  const usersPaged = usersData?.data?.data;

  const handleReview = async (userId: string, approved: boolean) => {
    setActionLoading(userId + (approved ? '-approve' : '-reject'));
    try {
      await userService.reviewKyc(userId, approved);
      mutate(['admin/kyc', page]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
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
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
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
              <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
            ) : kycUsers.length === 0 ? (
              <p className="text-gray-400 text-sm p-6">No pending KYC requests.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['User', 'Email', 'KYC Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {kycUsers.map((user: any) => (
                      <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                        <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                        <td className="px-5 py-3.5"><Badge text={user.kycStatus} variant={statusVariant(user.kycStatus)} /></td>
                        <td className="px-5 py-3.5 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={() => handleReview(user.userId, true)} disabled={!!actionLoading} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 disabled:opacity-50 transition-colors">
                              {actionLoading === user.userId + '-approve' ? '…' : 'Approve'}
                            </button>
                            <button onClick={() => handleReview(user.userId, false)} disabled={!!actionLoading} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 disabled:opacity-50 transition-colors">
                              {actionLoading === user.userId + '-reject' ? '…' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {kycPaged && <Pagination paged={kycPaged} />}
              </>
            )}
          </Card>
        )}

        {tab === 'users' && (
          <Card className="p-0 overflow-hidden">
            {usersLoading ? (
              <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
            ) : (
              <>
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
                        <td className="px-5 py-3.5 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usersPaged && <Pagination paged={usersPaged} label={`${usersPaged.totalElements} users total`} />}
              </>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
