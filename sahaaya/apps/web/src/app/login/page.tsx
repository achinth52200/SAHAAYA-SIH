'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Shield, Lock, User, Mail, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo credentials for different roles
      const demoUsers = {
        'counsellor@sahaaya.gov.in': { id: 'COUNSELLOR_001', role: 'counsellor' as const, name: 'Dr. Priya Sharma' },
        'district@sahaaya.gov.in': { id: 'DISTRICT_001', role: 'district_officer' as const, name: 'Officer Rajesh Kumar' },
        'state@sahaaya.gov.in': { id: 'STATE_001', role: 'state_officer' as const, name: 'Officer Anjali Patel' },
        'national@sahaaya.gov.in': { id: 'NATIONAL_001', role: 'national_admin' as const, name: 'Director General' },
        'victim@sahaaya.gov.in': { id: 'VICTIM_0001', role: 'victim' as const, name: 'Anonymous Victim' },
      };

      const user = demoUsers[email as keyof typeof demoUsers];
      if (user && password === 'demo123') {
        login(user);
        router.push(redirect || (user.role === 'victim' ? '/victim' : '/dashboard'));
        router.refresh();
      } else {
        setError('Invalid credentials. Use demo accounts with password "demo123"');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'counsellor@sahaaya.gov.in', role: 'Counsellor', name: 'Dr. Priya Sharma' },
    { email: 'district@sahaaya.gov.in', role: 'District Officer', name: 'Officer Rajesh Kumar' },
    { email: 'state@sahaaya.gov.in', role: 'State Officer', name: 'Officer Anjali Patel' },
    { email: 'national@sahaaya.gov.in', role: 'National Admin', name: 'Director General' },
    { email: 'victim@sahaaya.gov.in', role: 'Victim (Demo)', name: 'Anonymous Victim' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-background to-background" aria-hidden="true" />
      <div className="fixed top-20 left-10 w-72 h-72 bg-primary-100/50 rounded-full blur-3xl" aria-hidden="true" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-primary-50/50 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-4" aria-label="SAHAAYA Home">
            <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <span className="font-heading font-bold text-display-sm text-text-primary">SAHAAYA</span>
          </Link>
          <p className="text-body text-text-secondary">Sign in to access the dashboard</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className="card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CardHeader className="text-center pb-6">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <motion.div
                className="alert alert-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="officer@sahaaya.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                leftIcon={<Mail className="w-5 h-5" />}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  leftIcon={<Lock className="w-5 h-5" />}
                />
                <button
                  type="button"
                  className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-body-sm text-text-secondary">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-body-sm text-primary-500 hover:text-primary-600">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-text-muted">Or continue with demo account</span>
              </div>
            </div>

            {/* Demo Accounts */}
            <div className="space-y-2">
              {demoAccounts.map((account, i) => (
                <motion.button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('demo123');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary-50 hover:bg-secondary-100 hover:border-primary-200 transition-all text-left"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-body-sm font-medium text-text-primary truncate">{account.name}</p>
                    <p className="text-caption text-text-muted">{account.role}</p>
                  </div>
                  <span className="text-caption text-text-muted">demo123</span>
                </motion.button>
              ))}
            </div>

            <p className="text-center text-caption text-text-muted">
              Demo mode — All data is synthetic prototype data
            </p>
          </CardContent>
        </motion.div>

        {/* Security notice */}
        <motion.div
          className="mt-6 p-4 rounded-xl bg-primary-50 border border-primary-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary-700 mb-1">Secure Access</p>
              <p className="text-body-sm text-primary-600">
                This system uses token-based authentication with RBAC. All actions are audit-logged.
                <br />
                <span className="font-medium">Never share credentials.</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}