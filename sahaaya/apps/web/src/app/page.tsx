'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Leaf,
  Shield,
  Brain,
  Users,
  BarChart3,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  TrendingUp,
  Smartphone,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/CountUp';
import { ScrollProgress } from '@/components/landing/ScrollProgress';
import { SpotlightCard } from '@/components/landing/SpotlightCard';
import { LiveMonitorPanel } from '@/components/landing/LiveMonitorPanel';
import { PipelineFlow } from '@/components/landing/PipelineFlow';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

/** Design guarantees of the system — each one is verifiable in the build, not a projected metric. */
const stats = [
  { value: 6, suffix: '', label: 'Signal streams fused', sub: 'self-report · text · voice · behaviour · case events · trend', icon: BarChart3 },
  { value: 12, suffix: '', label: 'Languages targeted', sub: 'multilingual check-ins, chat and IVRS', icon: Globe },
  { value: 100, suffix: '%', label: 'High-risk alerts human-reviewed', sub: 'no Orange or Red alert closes itself', icon: Users },
  { value: 0, suffix: '', label: 'Autonomous interventions', sub: 'the AI explains — a person decides', icon: Shield },
];

const LANGUAGES = [
  'हिन्दी', 'বাংলা', 'मराठी', 'తెలుగు', 'தமிழ்', 'ગુજરાતી',
  'اردو', 'ಕನ್ನಡ', 'ଓଡ଼ିଆ', 'മലയാളം', 'ਪੰਜਾਬੀ', 'অসমীয়া', 'English',
];

const features = [
  {
    icon: Brain,
    title: 'Dynamic Distress Scoring',
    description:
      'A single 0–100 score fuses self-reports, text emotion, behavioural patterns, voice indicators, case events and longitudinal trend — weighted, and adjusted against the person\'s own baseline.',
  },
  {
    icon: MessageSquare,
    title: 'Multilingual Emotion Detection',
    description: 'Fear, anger, hopelessness, threat, sadness and anxiety classified across Indian languages from chat and check-in text.',
  },
  {
    icon: TrendingUp,
    title: 'Personal Baseline',
    description: 'Each person is measured against their own history — never a universal threshold.',
  },
  {
    icon: Lock,
    title: 'Privacy-First',
    description: 'Consent management, encryption, data minimisation, immutable audit logs.',
  },
  {
    icon: Shield,
    title: 'Human-in-the-Loop Review',
    description: 'Every Orange and Red alert lands in an officer inbox with a decision it cannot make for itself. Full audit trail and RBAC across five roles — counsellor to national admin.',
  },
  {
    icon: Leaf,
    title: 'Explainable by Construction',
    description: 'Feature importance, a plain-language narrative, a clinical summary and counterfactual scenarios ship with every alert. No score is ever shown without its reason.',
  },
];

const principles = [
  'Never diagnose, prescribe, or auto-trigger an intervention',
  'Voice analysis stays a supporting signal — never the deciding one',
  'A single check-in never determines a risk level',
  'Personal baseline over universal thresholds',
  'Consent, RBAC and audit logs are non-negotiable',
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />

      {/* ===== Navigation ===== */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'bg-background/85 backdrop-blur-xl border-b border-border' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5" aria-label="SAHAAYA home">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-500',
                  scrolled ? 'bg-primary-500' : 'bg-white/10 border border-white/15'
                )}
              >
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span
                className={cn(
                  'font-heading font-semibold text-heading-md transition-colors duration-500',
                  scrolled ? 'text-text-primary' : 'text-white'
                )}
              >
                SAHAAYA
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {[
                { href: '#architecture', label: 'Architecture' },
                { href: '#features', label: 'Capabilities' },
                { href: '#principles', label: 'Principles' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'text-body-sm transition-colors duration-500',
                    scrolled ? 'text-text-secondary hover:text-text-primary' : 'text-white/65 hover:text-white'
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/login"
                className={cn(
                  'text-body-sm font-medium px-4 py-2 rounded-xl transition-all duration-500',
                  scrolled
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-white/10 text-white border border-white/15 hover:bg-white/20'
                )}
              >
                Officer Login
              </Link>
            </div>

            <Link
              href="/login"
              className={cn(
                'md:hidden text-body-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-500',
                scrolled ? 'bg-primary-500 text-white' : 'bg-white/10 text-white border border-white/15'
              )}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative hero-dark grain overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        {/* atmosphere */}
        <div className="absolute inset-0 grid-lines grid-fade" aria-hidden="true" />
        <div className="aurora-blob animate-drift-slow w-[560px] h-[560px] -top-40 -left-32 bg-primary-500/25" aria-hidden="true" />
        <div className="aurora-blob animate-drift-slower w-[620px] h-[620px] top-10 -right-40 bg-[#4E9E6B]/20" aria-hidden="true" />
        <div className="aurora-blob animate-drift-slow w-[420px] h-[420px] bottom-0 left-1/3 bg-distress-yellow/10" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
            <motion.div variants={container} initial="hidden" animate="visible" className="text-center lg:text-left">
              <motion.div
                variants={item}
                className="inline-flex items-center gap-2.5 rounded-full glass-panel py-1.5 pl-1.5 pr-3.5 text-[12px] font-medium text-white/80 mb-7"
              >
                {/* The mark's navy bulb outline, rays and "SIH" wordmark disappear on the
                    near-black hero, so it sits on a light chip where the whole logo reads. */}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95">
                  <img src="/sih-logo.png" alt="Smart India Hackathon" className="h-5 w-5 object-contain" />
                </span>
                Smart India Hackathon 2026 · PS 26094
                <span className="h-3 w-px bg-white/20" />
                <span className="text-white/50">Synthetic data only</span>
              </motion.div>

              <motion.h1
                variants={item}
                className="font-heading font-bold text-white text-[2.75rem] leading-[1.06] sm:text-[3.5rem] lg:text-[4.25rem] tracking-[-0.02em] mb-6"
              >
                Distress, caught
                <br />
                <span className="text-shine">before it becomes</span>
                <br />
                a crisis.
              </motion.h1>

              <motion.p variants={item} className="text-body-lg text-white/60 max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
                SAHAAYA continuously reads six independent signals from victims of atrocities — check-ins, language,
                voice, behaviour, case events and trend — into one explainable distress score, and puts a trained human
                in front of every serious decision.
              </motion.p>

              <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/dashboard"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary-400 text-[#0B140F] font-semibold text-body transition-all duration-300 hover:bg-primary-300 hover:shadow-[0_16px_40px_-12px_rgba(142,185,150,0.6)] hover:-translate-y-0.5"
                >
                  <LayoutDashboard className="w-[18px] h-[18px]" />
                  Open Officer Dashboard
                  <ArrowRight className="w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/victim"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass-panel text-white font-medium text-body transition-all duration-300 hover:bg-white/[0.12]"
                >
                  <Smartphone className="w-[18px] h-[18px]" />
                  Victim Experience
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="animate-float-soft"
            >
              <LiveMonitorPanel />
            </motion.div>
          </div>

          {/* Language marquee */}
          <div className="mt-20 lg:mt-24">
            <p className="text-center text-[11px] tracking-[0.18em] text-white/30 mb-5">
              BUILT TO MEET PEOPLE IN THEIR OWN LANGUAGE
            </p>
            <div className="relative overflow-hidden mask-fade-x">
              <div className="flex gap-10 w-max animate-marquee">
                {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
                  <span key={i} className="text-heading-lg font-heading text-white/25 whitespace-nowrap select-none">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* fade into the light section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background" aria-hidden="true" />
      </section>

      {/* ===== Stats ===== */}
      <section className="relative py-20 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item}>
                <SpotlightCard className="h-full rounded-2xl border border-border bg-surface p-6 hover:border-primary-200 transition-colors duration-300">
                  <stat.icon className="w-6 h-6 text-primary-500 mb-4" />
                  <p className="font-heading font-bold text-[2.75rem] leading-none text-text-primary tabular-nums">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-body font-medium text-text-primary mt-2.5">{stat.label}</p>
                  <p className="text-body-sm text-text-muted mt-1 leading-snug">{stat.sub}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== Architecture ===== */}
      <section id="architecture" className="relative hero-dark grain overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 grid-lines grid-fade" aria-hidden="true" />
        <div className="aurora-blob animate-drift-slower w-[500px] h-[500px] -top-32 right-0 bg-primary-500/20" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-3xl mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-mono tracking-[0.18em] text-primary-300/70 mb-4">SYSTEM ARCHITECTURE</p>
            <h2 className="font-heading font-bold text-white text-[2.25rem] lg:text-[3rem] leading-[1.1] tracking-[-0.02em] mb-5">
              Six layers, deliberately separated.
            </h2>
            <p className="text-body-lg text-white/55 leading-relaxed">
              Interaction, scoring, explanation and human review never collapse into one another. That separation is what
              makes the system auditable — and what keeps the final call with a person.
            </p>
          </motion.div>

          <PipelineFlow />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background" aria-hidden="true" />
      </section>

      {/* ===== Capabilities (bento) ===== */}
      <section id="features" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-3xl mb-14"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-mono tracking-[0.18em] text-primary-500 mb-4">CAPABILITIES</p>
            <h2 className="font-heading font-bold text-text-primary text-[2.25rem] lg:text-[3rem] leading-[1.1] tracking-[-0.02em] mb-5">
              Every feature traces to a requirement.
            </h2>
            <p className="text-body-lg text-text-secondary">
              Nothing here is decorative — each capability maps to a functional requirement in the problem statement.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {features.map((feature, i) => {
              const featured = i === 0;
              // Bento spans chosen so the 4-column grid fills with no gaps:
              // [2x2 feature] [2 wide] / [1] [1] / [2 wide] [2 wide]
              const spans = ['lg:col-span-2 lg:row-span-2', 'lg:col-span-2', 'lg:col-span-1', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-2'];
              return (
                <motion.div key={feature.title} variants={item} className={spans[i]}>
                  <SpotlightCard
                    glow={featured ? 'rgba(255,255,255,0.14)' : 'rgba(94, 154, 109, 0.18)'}
                    className={cn(
                      'h-full rounded-3xl transition-all duration-300',
                      featured
                        ? 'bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white p-8 lg:p-10 shadow-[0_24px_70px_-24px_rgba(39,78,58,0.7)]'
                        : 'bg-surface border border-border p-7 hover:border-primary-200 hover:shadow-card'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl flex items-center justify-center mb-5',
                        featured ? 'w-14 h-14 bg-white/15 text-white' : 'w-12 h-12 bg-primary-50 text-primary-600'
                      )}
                    >
                      <feature.icon className={featured ? 'w-7 h-7' : 'w-6 h-6'} />
                    </div>
                    <h3
                      className={cn(
                        'font-heading font-semibold mb-2.5',
                        featured ? 'text-heading-xl lg:text-display-sm text-white leading-tight' : 'text-heading-md text-text-primary'
                      )}
                    >
                      {feature.title}
                    </h3>
                    <p className={cn('leading-relaxed', featured ? 'text-body-lg text-white/80' : 'text-body-sm text-text-secondary')}>
                      {feature.description}
                    </p>

                    {featured && (
                      <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-3 gap-4">
                        {[
                          { k: '35%', v: 'Self-report' },
                          { k: '20%', v: 'Text emotion' },
                          { k: '15%', v: 'Behaviour' },
                        ].map((w) => (
                          <div key={w.v}>
                            <p className="font-heading font-bold text-heading-lg text-white tabular-nums">{w.k}</p>
                            <p className="text-[12px] text-white/60">{w.v}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== Principles ===== */}
      <section id="principles" className="py-24 lg:py-28 bg-secondary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-mono tracking-[0.18em] text-primary-500 mb-4">NON-NEGOTIABLE</p>
              <h2 className="font-heading font-bold text-text-primary text-[2.25rem] lg:text-[2.75rem] leading-[1.1] tracking-[-0.02em] mb-5">
                Constraints we designed around, not away from.
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                Working with trauma survivors means the failure modes matter more than the features. These five rules
                bound every decision in the system.
              </p>
            </motion.div>

            <motion.ul
              className="space-y-3"
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              {principles.map((text, i) => (
                <motion.li key={text} variants={item}>
                  <SpotlightCard
                    className="rounded-2xl bg-surface border border-border p-5 hover:border-primary-200 transition-colors duration-300"
                    innerClassName="flex items-center gap-4"
                  >
                    <span className="font-mono text-[12px] text-text-muted tabular-nums">0{i + 1}</span>
                    <CheckCircle2 className="w-5 h-5 text-distress-green flex-shrink-0" />
                    <p className="text-body text-text-primary leading-snug">{text}</p>
                  </SpotlightCard>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative hero-dark grain overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 grid-lines grid-fade" aria-hidden="true" />
        <div className="aurora-blob animate-drift-slow w-[600px] h-[600px] -bottom-40 left-1/4 bg-primary-500/25" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-heading font-bold text-white text-[2.25rem] lg:text-[3.25rem] leading-[1.08] tracking-[-0.02em] mb-6">
              See the whole loop,
              <br />
              <span className="text-shine">end to end.</span>
            </h2>
            <p className="text-body-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
              A live officer dashboard running on the real scoring and explainability pipeline — alerts, distress trends,
              contributing factors, case timelines and the human review decision itself.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/dashboard"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-primary-400 text-[#0B140F] font-semibold text-body-lg transition-all duration-300 hover:bg-primary-300 hover:shadow-[0_16px_40px_-12px_rgba(142,185,150,0.6)] hover:-translate-y-0.5"
              >
                Launch the Dashboard
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/victim"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl glass-panel text-white font-medium text-body-lg transition-all duration-300 hover:bg-white/[0.12]"
              >
                Victim Experience
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0B140F] border-t border-white/10 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-primary-300" />
                </div>
                <span className="font-heading font-semibold text-heading-md text-white">SAHAAYA</span>
              </div>
              <p className="text-body-sm text-white/45 max-w-sm leading-relaxed">
                AI-assisted mental health monitoring and distress prediction for victims of atrocities. Explainable,
                consent-based, and human-decided.
              </p>
            </div>
            <div>
              <h4 className="text-body-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-body-sm text-white/45">
                <li><Link href="#architecture" className="hover:text-white transition-colors">Architecture</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Capabilities</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Officer Dashboard</Link></li>
                <li><Link href="/victim" className="hover:text-white transition-colors">Victim Experience</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-body-sm font-semibold text-white mb-4">Compliance</h4>
              <div className="mb-4 inline-flex items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-2.5">
                <img src="/sih-logo.png" alt="Smart India Hackathon" className="h-10 w-10 object-contain" />
                <span className="text-[11px] font-semibold leading-tight text-[#0B140F]">
                  Smart India
                  <br />
                  Hackathon 2026
                </span>
              </div>
              <ul className="space-y-2.5 text-body-sm text-white/45">
                <li>PS 26094</li>
                <li>Prototype data only</li>
                <li>No real victim data</li>
                <li>Human-in-the-loop</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-white/30">© 2026 SAHAAYA — prototype for Smart India Hackathon. Not for clinical use.</p>
            <p className="text-[12px] text-white/30">Every alert carries an explanation. Every decision carries a name.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
