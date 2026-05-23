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

  const { data: kycData, isLoading: kycLoading } = useSWR(
    ['admin/kyc', page],
    () => userService.getPendingKyc(page, 20)
  );
  const { data: usersData, isLoading: usersLoading } = useSWR(
    ['admin/users', page],
    () => userService.getAdminUsers(page, 20)
  );

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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          {(['kyc', 'users'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(0); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'}`}
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
              <p className="text-slate-400 text-sm p-6">No pending KYC requests.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">KYC Status</th>
                      <th className="text-left p-4">Joined</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycUsers.map((user: any) => (
                      <tr key={user.userId} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="p-4">{user.firstName} {user.lastName}</td>
                        <td className="p-4 text-slate-400">{user.email}</td>
                        <td className="p-4"><Badge text={user.kycStatus} variant={statusVariant(user.kycStatus)} /></td>
                        <td className="p-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(user.userId, true)}
                              disabled={!!actionLoading}
                              className="px-3 py-1 bg-green-800 hover:bg-green-700 text-green-300 text-xs rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === user.userId + '-approve' ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReview(user.userId, false)}
                              disabled={!!actionLoading}
                              className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-300 text-xs rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === user.userId + '-reject' ? '…' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {kycPaged && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">Page {kycPaged.pageNumber + 1} of {kycPaged.totalPages}</span>
                    <div className="flex gap-2">
                      <button disabled={kycPaged.first} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm disabled:opacity-40">Previous</button>
                      <button disabled={kycPaged.last} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
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
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">KYC</th>
                      <th className="text-left p-4">Country</th>
                      <th className="text-left p-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user: any) => (
                      <tr key={user.userId} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="p-4">{user.firstName} {user.lastName}</td>
                        <td className="p-4 text-slate-400">{user.email}</td>
                        <td className="p-4"><Badge text={user.kycStatus} variant={statusVariant(user.kycStatus)} /></td>
                        <td className="p-4 text-slate-400">{user.country ?? '—'}</td>
                        <td className="p-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usersPaged && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">{usersPaged.totalElements} users total</span>
                    <div className="flex gap-2">
                      <button disabled={usersPaged.first} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm disabled:opacity-40">Previous</button>
                      <button disabled={usersPaged.last} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
