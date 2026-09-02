'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Leaf,
  Shield,
  Brain,
  Users,
  BarChart3,
  MessageSquare,
  Heart,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DemoJourneyPanel } from '@/components/DemoJourneyPanel';
import { CountUp } from '@/components/CountUp';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const stats = [
  { value: 50, suffix: 'K+', label: 'Victims Supported', icon: Users },
  { value: 94, suffix: '%', label: 'Early Detection Rate', icon: TrendingUp },
  { value: 24, suffix: '/7', label: 'Continuous Monitoring', icon: Shield },
  { value: 12, suffix: '', label: 'Languages Supported', icon: Globe },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Distress Scoring',
    description: 'Dynamic 0-100 distress score combining self-reports, text emotion, behavioural patterns, voice indicators, case events, and longitudinal trends.',
  },
  {
    icon: MessageSquare,
    title: 'Multilingual Emotion Detection',
    description: 'Real-time emotion classification (fear, anger, hopelessness, threat, sadness, anxiety) across 12 Indian languages using fine-tuned transformers.',
  },
  {
    icon: BarChart3,
    title: 'Personal Baseline Model',
    description: 'Each victim compared against their own history, not universal thresholds. Tracks 7-day and 30-day escalation probability with trend analysis.',
  },
  {
    icon: Shield,
    title: 'Human-in-the-Loop Review',
    description: 'Every Orange/Red alert requires human review. AI explains, humans decide. Complete audit trail with RBAC for counsellors, district, state, and national officers.',
  },
  {
    icon: Leaf,
    title: 'Explainable AI',
    description: 'SHAP-based feature importance, rule-based explanations, and counterfactual scenarios. Every alert includes clinical summary and recommended actions.',
  },
  {
    icon: Lock,
    title: 'Privacy-First Architecture',
    description: 'Explicit consent management, encryption in transit/at rest, token-based auth, audit logging, data minimisation. Synthetic prototype data only.',
  },
];

const principles = [
  { icon: CheckCircle, text: 'Never diagnose, prescribe, or auto-trigger interventions' },
  { icon: CheckCircle, text: 'Voice analysis as supporting signal only' },
  { icon: CheckCircle, text: 'Single check-in never determines risk level' },
  { icon: CheckCircle, text: 'Personal baseline over universal thresholds' },
  { icon: CheckCircle, text: 'Consent, RBAC, and audit logs are non-negotiable' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2" aria-label="SAHAAYA Home">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-semibold text-heading-md text-text-primary">SAHAAYA</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#how-it-works" className="text-body-sm text-text-secondary hover:text-text-primary transition-colors">
                How It Works
              </Link>
              <Link href="#features" className="text-body-sm text-text-secondary hover:text-text-primary transition-colors">
                Features
              </Link>
              <Link href="#principles" className="text-body-sm text-text-secondary hover:text-text-primary transition-colors">
                Principles
              </Link>
              <Link href="/login" className="text-body-sm text-text-secondary hover:text-text-primary transition-colors">
                Officer Login
              </Link>
            </div>
            <div className="flex items-center gap-3 md:hidden">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Officer Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-background" aria-hidden="true" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" aria-hidden="true" />
        <div className="absolute -top-10 -right-20 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-50/60 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-8 items-center">
            <motion.div
              className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-body-sm font-medium mb-8"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                </span>
                Prototype Demo - Synthetic Data Only
              </motion.div>

              <motion.h1
                className="text-display-xl lg:text-display-lg font-heading font-bold text-text-primary mb-6"
                variants={itemVariants}
              >
                AI-Powered Mental Health Monitoring
                <br />
                <span className="gradient-text">for Victims of Atrocities</span>
              </motion.h1>

              <motion.p
                className="text-body-lg lg:text-heading-sm text-text-secondary max-w-2xl mb-10"
                variants={itemVariants}
              >
                SAHAAYA combines periodic check-ins, multilingual text/voice analysis, behavioural patterns, and case events into a dynamic distress score (0–100) with explainable alerts — keeping a human in the loop for every serious action.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                variants={itemVariants}
              >
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    View Officer Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                  <Link href="#how-it-works">Learn How It Works</Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <DemoJourneyPanel />
            </motion.div>
          </div>

          {/* Stats Grid */}
          <motion.div
            className="mt-16 lg:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="card bg-surface/80 backdrop-blur-sm px-6 py-5 text-center"
                variants={itemVariants}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(31,42,36,0.12)' }}
              >
                <stat.icon className="w-7 h-7 text-primary-500 mx-auto mb-2" />
                <p className="text-display-sm font-heading font-bold text-text-primary">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-body-sm text-text-secondary mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-display-md font-heading font-bold text-text-primary mb-4">
              How SAHAAYA Works
            </h2>
            <p className="text-body-lg text-text-secondary">
              A six-layer architecture from victim interaction to national dashboard — every layer separate, every alert explainable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                title: 'Victim Interaction',
                description: 'Mobile app, chatbot, IVRS, SMS — multilingual, low-friction check-ins with mood, anxiety, sleep, safety, hopelessness, isolation, and urgent-help flag.',
                icon: MessageSquare,
              },
              {
                number: '02',
                title: 'Data Collection',
                description: 'Consented self-reports, text emotion, behavioural signals (missed check-ins, cancelled sessions), optional voice acoustics, and case events (FIR, hearings, threats, delays).',
                icon: BarChart3,
              },
              {
                number: '03',
                title: 'AI Analysis',
                description: 'Multilingual BERT for emotion classification, XGBoost for behavioural patterns, acoustic feature extraction for voice — all processed separately, never mixed.',
                icon: Brain,
              },
              {
                number: '04',
                title: 'Dynamic Risk Engine',
                description: 'Weighted composite (35% self-report, 20% text, 15% behaviour, 10% voice, 10% case events, 10% trend) with personal baseline adjustment. Bands: Green/Yellow/Orange/Red.',
                icon: TrendingUp,
              },
              {
                number: '05',
                title: 'Explainable Alerts',
                description: 'SHAP feature importance, rule-based narratives, clinical summaries, recommended actions, and counterfactual scenarios — every Orange/Red alert ships with full explanation.',
                icon: Shield,
              },
              {
                number: '06',
                title: 'Human Review & Dashboards',
                description: 'Officer inbox with priority sorting, district/state/national aggregates, intervention tracking, audit logs, and RBAC — AI detects, explains, routes; human decides and acts.',
                icon: Users,
              },
            ].map((step, i) => (
              <motion.div
                key={step.number}
                className="card p-6 group"
                variants={itemVariants}
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ borderColor: 'primary-300', boxShadow: '0 12px 40px rgba(31,42,36,0.12)' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-caption font-medium text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                        Step {step.number}
                      </span>
                    </div>
                    <h3 className="text-heading-md font-semibold text-text-primary mb-2">{step.title}</h3>
                    <p className="text-body text-text-secondary">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-display-md font-heading font-bold text-text-primary mb-4">
              Core Capabilities
            </h2>
            <p className="text-body-lg text-text-secondary">
              Built for the SIH 2026 hackathon — every feature traces to a functional requirement in the PDR.
            </p>
          </motion.div>

          {/* Bento grid: first two features get emphasis, rest support */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {features.slice(0, 3).map((feature, i) => (
              <motion.div
                key={feature.title}
                className={cn(
                  'card group h-full',
                  i === 0 ? 'lg:col-span-2 lg:row-span-2 p-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white border-transparent' : 'lg:col-span-2 p-6'
                )}
                variants={itemVariants}
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div
                  className={cn(
                    'rounded-xl flex items-center justify-center mb-4 transition-colors',
                    i === 0 ? 'w-14 h-14 bg-white/15 text-white' : 'w-12 h-12 bg-primary-100 text-primary-600 group-hover:bg-primary-500 group-hover:text-white'
                  )}
                >
                  <feature.icon className={i === 0 ? 'w-7 h-7' : 'w-6 h-6'} />
                </div>
                <h3 className={cn('font-heading font-semibold mb-2', i === 0 ? 'text-heading-xl' : 'text-heading-md text-text-primary')}>
                  {feature.title}
                </h3>
                <p className={cn(i === 0 ? 'text-body-lg text-white/85' : 'text-body text-text-secondary')}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.slice(3).map((feature, i) => (
              <motion.div
                key={feature.title}
                className="card p-6 h-full group"
                variants={itemVariants}
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 mb-4 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-heading-md font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-body text-text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section id="principles" className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-display-md font-heading font-bold text-text-primary mb-4">
              Non-Negotiable Principles
            </h2>
            <p className="text-body-lg text-text-secondary">
              Hard constraints that define SAHAAYA — violated at the cost of victim trust and safety.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((principle, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 p-5 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors"
                variants={itemVariants}
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-distress-green/10 flex items-center justify-center text-distress-green">
                  <principle.icon className="w-5 h-5" />
                </div>
                <p className="text-body text-text-primary">{principle.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="max-w-3xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-display-md lg:text-display-lg font-heading font-bold text-white mb-6">
              Ready to See the Dashboard?
            </h2>
            <p className="text-body-lg text-primary-100 mb-8">
              Explore the officer dashboard with live synthetic data, distress trends, explainable alerts, and intervention workflows.
            </p>
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">
                Launch Officer Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6" />
                </div>
                <span className="font-heading font-semibold text-heading-md">SAHAAYA</span>
              </Link>
              <p className="text-body text-white/70 max-w-xs">
                AI-powered mental health monitoring and distress prediction for victims of atrocities. Human-in-the-loop, explainable, privacy-first.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-heading-sm mb-4">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">Officer Dashboard</a></li>
                <li><a href="/victim-app" className="hover:text-white transition-colors">Victim App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading-sm mb-4">Resources</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/consent" className="hover:text-white transition-colors">Consent Management</a></li>
                <li><a href="/api-docs" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="/security" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-heading-sm mb-4">Compliance</h4>
              <ul className="space-y-2 text-white/70">
                <li><span className="text-white/70">SIH 2026 PS 26094</span></li>
                <li><span className="text-white/70">Prototype Data Only</span></li>
                <li><span className="text-white/70">No Real Victim Data</span></li>
                <li><span className="text-white/70">Human-in-the-Loop</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-body-sm text-white/50">
              © 2026 SAHAAYA. Prototype for SIH 2026. Not for clinical use.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/50 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}