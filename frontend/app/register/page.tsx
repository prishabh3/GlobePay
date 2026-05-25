'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.register(form);
      localStorage.clear();
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10">
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-slate-400 mb-1">Welcome to GlobePay, {form.firstName}.</p>
            <p className="text-slate-500 text-sm">Redirecting you to login in 3 seconds…</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Globe<span className="text-blue-400">Pay</span></h1>
          <p className="text-slate-400 mt-2">Open your global account</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field('firstName', 'First Name', 'text', 'John')}
              {field('lastName', 'Last Name', 'text', 'Doe')}
            </div>
            {field('email', 'Email', 'email', 'you@example.com')}
            {field('password', 'Password', 'password', '••••••••')}
            <p className="text-xs text-slate-500 -mt-2">Must be at least 8 characters.</p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
