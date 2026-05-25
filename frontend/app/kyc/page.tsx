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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

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
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">KYC Verification</h1>

        {/* Status banner */}
        {kycStatus && (
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-slate-400 text-sm">Overall Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge text={kycStatus.overallStatus} variant={statusVariant(kycStatus.overallStatus)} />
                </div>
                <p className="text-slate-400 text-sm mt-2">{kycStatus.message}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Uploaded documents */}
        {kycStatus?.documents && kycStatus.documents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Submitted Documents</h2>
            <div className="space-y-3">
              {kycStatus.documents.map((doc: any) => (
                <Card key={doc.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{doc.documentType}</p>
                    <p className="text-slate-400 text-sm">#{doc.documentNumber}</p>
                    {doc.rejectionReason && (
                      <p className="text-red-400 text-sm mt-1">Reason: {doc.rejectionReason}</p>
                    )}
                  </div>
                  <Badge text={doc.status} variant={statusVariant(doc.status)} />
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upload form */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Upload Document</h2>
          <Card>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Document Type</label>
                <select
                  value={form.documentType}
                  onChange={e => setForm({ ...form, documentType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Document Number</label>
                <input
                  required
                  value={form.documentNumber}
                  onChange={e => setForm({ ...form, documentNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. A1234567"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Document File</label>
                <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-900 hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {file ? (
                      <p className="text-white text-sm">{file.name}</p>
                    ) : (
                      <>
                        <p className="text-slate-400 text-sm">Click to select a file</p>
                        <p className="text-slate-500 text-xs mt-1">PDF, JPG, PNG up to 10MB</p>
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
                <label className="block text-sm text-slate-400 mb-1">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? 'Uploading…' : 'Upload Document'}
              </button>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
