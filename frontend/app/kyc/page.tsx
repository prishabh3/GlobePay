'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { isAuthenticated } from '@/lib/auth';
import { userService } from '@/services/user.service';

const DOCUMENT_TYPES = ['PASSPORT', 'VISA', 'NATIONAL_ID', 'DRIVERS_LICENSE'];
const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function KycPage() {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.push('/login'); }, [router]);

  const { data } = useSWR('/kyc/status', () => userService.getKycStatus());
  const kycStatus = data?.data?.data;

  const [form, setForm] = useState({ documentType: 'PASSPORT', documentNumber: '', documentUrl: '', expiryDate: '' });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file) { setError('Please select a file to upload.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await userService.uploadFile(formData);
      const documentUrl = uploadRes.data.data.url;
      await userService.uploadDocument({ ...form, documentUrl });
      setSuccess('Document uploaded successfully. Pending review.');
      setFile(null);
      mutate('/kyc/status');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>

        {kycStatus && (
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Overall Status</p>
                <Badge text={kycStatus.overallStatus} variant={statusVariant(kycStatus.overallStatus)} />
                <p className="text-sm text-gray-500 mt-2">{kycStatus.message}</p>
              </div>
            </div>
          </Card>
        )}

        {kycStatus?.documents && kycStatus.documents.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Submitted Documents</h2>
            <div className="space-y-3">
              {kycStatus.documents.map((doc: any) => (
                <Card key={doc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{doc.documentType}</p>
                    <p className="text-gray-400 text-sm">#{doc.documentNumber}</p>
                    {doc.rejectionReason && <p className="text-red-500 text-sm mt-1">{doc.rejectionReason}</p>}
                  </div>
                  <Badge text={doc.status} variant={statusVariant(doc.status)} />
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Upload Document</h2>
          <Card className="p-6">
            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className={labelClass}>Document Type</label>
                <select value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })} className={inputClass}>
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Document Number</label>
                <input required value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} className={inputClass} placeholder="e.g. A1234567" />
              </div>
              <div>
                <label className={labelClass}>Document File</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    {file ? (
                      <>
                        <p className="text-sm font-medium text-blue-600">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Click to change</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-500">Click to select a file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div>
                <label className={labelClass}>Expiry Date (optional)</label>
                <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className={inputClass} />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
              {success && <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3">{success}</p>}
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                {loading ? 'Uploading…' : 'Upload Document'}
              </button>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
