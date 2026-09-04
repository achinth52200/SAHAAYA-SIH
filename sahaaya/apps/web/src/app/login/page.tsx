'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf, Shield, Lock, User, Mail, Eye, EyeOff, AlertTriangle,
  ArrowLeft, ArrowRight, ScanSearch, UserCheck, HeartHandshake,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { Button, Input } from '@/components/ui';
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

      const victimMatch = email.match(/^victim(\d*)@sahaaya\.gov\.in$/i);
      const victimNumber = victimMatch ? Number(victimMatch[1] || '1') : 0;
      const user = victimMatch && victimNumber >= 1 && victimNumber <= 25
        ? { id: `VICTIM_${String(victimNumber).padStart(4, '0')}`, role: 'victim' as const, name: `Anonymous Victim ${victimNumber}` }
        : demoUsers[email as keyof typeof demoUsers];
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

  const officerAccounts = [
    { email: 'counsellor@sahaaya.gov.in', role: 'Counsellor', name: 'Dr. Priya Sharma' },
    { email: 'district@sahaaya.gov.in', role: 'District Officer', name: 'Officer Rajesh Kumar' },
    { email: 'state@sahaaya.gov.in', role: 'State Officer', name: 'Officer Anjali Patel' },
    { email: 'national@sahaaya.gov.in', role: 'National Admin', name: 'Director General' },
  ];

  const victimAccounts = [
    { email: 'victim@sahaaya.gov.in', role: 'Survivor view', name: 'Anonymous Victim 1' },
    { email: 'victim2@sahaaya.gov.in', role: 'Survivor view', name: 'Anonymous Victim 2' },
    { email: 'victim3@sahaaya.gov.in', role: 'Survivor view', name: 'Anonymous Victim 3' },
  ];

  const fill = (account: { email: string }) => {
    setEmail(account.email);
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ===== Brand panel ===== */}
      <aside className="relative hidden lg:flex hero-dark grain overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 grid-lines grid-fade" aria-hidden="true" />
        <div className="aurora-blob animate-drift-slow w-[480px] h-[480px] -top-24 -left-16 bg-primary-500/25" aria-hidden="true" />
        <div className="aurora-blob animate-drift-slower w-[420px] h-[420px] bottom-0 -right-20 bg-[#4E9E6B]/20" aria-hidden="true" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="SAHAAYA home">
            <div className="w-9 h-9 rounded-xl bg-primary-400 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-[#0B140F]" />
            </div>
            <span className="font-heading font-semibold text-heading-md text-white">SAHAAYA</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-mono tracking-[0.18em] text-primary-300/70 mb-5">OFFICER CONSOLE</p>
          <h1 className="font-heading font-bold text-white text-[2.5rem] leading-[1.1] tracking-[-0.02em]">
            The alert explains itself.
            <br />
            <span className="text-shine">You make the call.</span>
          </h1>
          <p className="mt-5 text-body text-white/55 leading-relaxed">
            Every distress score you review arrives with its contributing factors, the person&apos;s own baseline,
            and a decision that only a trained human can make.
          </p>

          <ul className="mt-9 space-y-4">
            {[
              { Icon: ScanSearch, text: 'Six signals fused into one explainable score' },
              { Icon: UserCheck, text: 'No Orange or Red alert closes without a person' },
              { Icon: Shield, text: 'Consent-gated, RBAC, fully audit-logged' },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07] border border-white/10">
                  <Icon className="h-4 w-4 text-primary-300" />
                </span>
                <span className="text-body-sm text-white/70 leading-relaxed pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-white/35">
          <span>Smart India Hackathon 2026 · PS 26094</span>
          <span className="h-3 w-px bg-white/15" />
          <span>Synthetic prototype data only</span>
        </div>
      </aside>

      {/* ===== Form panel ===== */}
      <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-body-sm text-text-secondary transition-colors hover:text-text-primary lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <h2 className="font-heading text-display-sm font-bold text-text-primary">Sign in</h2>
              <p className="mt-1.5 text-body text-text-secondary">
                Access the officer console for your role.
              </p>
            </div>

            {error && (
              <motion.div
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-distress-red/25 bg-distress-red/5 px-4 py-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-distress-red" />
                <span className="text-body-sm text-distress-red">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="officer@sahaaya.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                leftIcon={<Mail className="h-[18px] w-[18px]" />}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  leftIcon={<Lock className="h-[18px] w-[18px]" />}
                />
                <button
                  type="button"
                  className="absolute right-3 top-[38px] text-text-muted transition-colors hover:text-text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-body-sm text-text-secondary">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-body-sm text-primary-500 hover:text-primary-600">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
                Sign in
                <ArrowRight className="h-[18px] w-[18px]" />
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-caption text-text-muted">or use a demo account</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <p className="mb-2 text-[11px] font-medium tracking-[0.12em] text-text-muted">OFFICERS &amp; COUNSELLORS</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {officerAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fill(account)}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-200',
                      email === account.email
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border bg-surface hover:border-primary-200 hover:bg-secondary-50'
                    )}
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                      <User className="h-4 w-4 text-primary-600" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-text-primary">{account.name}</span>
                      <span className="block truncate text-[11px] text-text-muted">{account.role}</span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-4 text-[11px] font-medium tracking-[0.12em] text-text-muted">SURVIVOR EXPERIENCE</p>
              <div className="flex flex-wrap gap-2">
                {victimAccounts.map((account, i) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fill(account)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] transition-all duration-200',
                      email === account.email
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border bg-surface text-text-secondary hover:border-primary-200 hover:bg-secondary-50'
                    )}
                  >
                    <HeartHandshake className="h-4 w-4 text-primary-500" />
                    Victim {i + 1}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-center text-caption text-text-muted">
                All demo accounts use the password <span className="font-mono text-text-secondary">demo123</span>
              </p>
            </div>

            <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-border bg-secondary-50 px-4 py-3">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
              <p className="text-caption text-text-secondary leading-relaxed">
                Token-based authentication with role-based access control. Every action in the console is audit-logged.
                Never share credentials.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
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
