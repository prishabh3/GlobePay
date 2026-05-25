'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { isAuthenticated } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { userService } from '@/services/user.service';

const DOCUMENT_TYPES = ['PASSPORT', 'VISA', 'NATIONAL_ID', 'DRIVERS_LICENSE'];
const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function KycPage() {
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data, isLoading } = useSWR('/kyc/status', () => userService.getKycStatus());
  const kycStatus = data?.data?.data;

  const [form, setForm] = useState({ documentType: 'PASSPORT', documentNumber: '', expiryDate: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    if (!file) { toast('Please select a file to upload.', 'error'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await userService.uploadFile(formData);
      const documentUrl = uploadRes.data.data.url;
      await userService.uploadDocument({ ...form, documentUrl });
      toast('Document submitted. Pending review.', 'success');
      setFile(null);
      setForm(f => ({ ...f, documentNumber: '', expiryDate: '' }));
      mutate('/kyc/status');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    APPROVED: 'text-green-700 bg-green-50 border-green-200',
    IN_REVIEW: 'text-blue-700 bg-blue-50 border-blue-200',
    PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
    REJECTED: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>

        {/* Overall Status */}
        {isLoading ? (
          <Card className="p-5">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </Card>
        ) : kycStatus && (
          <Card className={`p-5 border ${statusColors[kycStatus.overallStatus] ?? 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1.5">Overall KYC Status</p>
                <Badge text={kycStatus.overallStatus} variant={statusVariant(kycStatus.overallStatus)} />
                <p className="text-sm mt-2 opacity-80">{kycStatus.message}</p>
              </div>
              {kycStatus.overallStatus === 'APPROVED' && (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Submitted Documents */}
        {kycStatus?.documents && kycStatus.documents.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Submitted Documents</h2>
            <div className="space-y-3">
              {kycStatus.documents.map((doc: any) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{doc.documentType.replace('_', ' ')}</p>
                      <p className="text-gray-400 text-sm mt-0.5">#{doc.documentNumber}</p>
                      {doc.rejectionReason && (
                        <p className="text-red-500 text-sm mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {doc.rejectionReason}
                        </p>
                      )}
                      {doc.createdAt && (
                        <p className="text-xs text-gray-400 mt-1.5">Submitted {formatDate(doc.createdAt)}</p>
                      )}
                    </div>
                    <Badge text={doc.status} variant={statusVariant(doc.status)} />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upload Form */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upload Document</h2>
          <Card className="p-6">
            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className={labelClass}>Document Type</label>
                <select
                  value={form.documentType}
                  onChange={e => setForm({ ...form, documentType: e.target.value })}
                  className={inputClass}
                >
                  {DOCUMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Document Number</label>
                <input
                  required
                  value={form.documentNumber}
                  onChange={e => setForm({ ...form, documentNumber: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. A1234567"
                />
              </div>

              <div>
                <label className={labelClass}>Document File</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors">
                  <div className="text-center px-4">
                    {file ? (
                      <>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-blue-600 truncate max-w-48">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Click to change</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-500">Click to select a file</p>
                        <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG up to 10 MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div>
                <label className={labelClass}>Expiry Date (optional)</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {loading ? 'Uploading…' : 'Upload Document'}
              </button>
            </form>
          </Card>
        </section>

        {kycStatus && !kycStatus.documents?.length && !isLoading && (
          <EmptyState
            icon="kyc"
            title="No documents submitted yet"
            description="Upload a government-issued ID to start your KYC verification."
          />
        )}
      </main>
    </div>
  );
}
