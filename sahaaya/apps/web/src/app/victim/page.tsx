'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, LogOut, MessageCircle, ShieldCheck, LifeBuoy, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { WellbeingState } from '@/components/victim/WellbeingState';
import { WellbeingTrend } from '@/components/victim/WellbeingTrend';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { DistressScore, Victim } from '@/types';

type HistoryPoint = { date: string; score: number; band: string };
type CheckinStep = 'mood' | 'stress' | 'sleep' | 'safety' | 'hope' | 'message';

const checkinQuestions: Record<Exclude<CheckinStep, 'message'>, {
  label: string;
  prompt: string;
}> = {
  mood: {
    label: 'How you are feeling',
    prompt: 'How have you been feeling overall today?',
  },
  stress: {
    label: 'Stress',
    prompt: 'How much stress or worry have you felt today?',
  },
  sleep: {
    label: 'Sleep',
    prompt: 'How was your sleep recently?',
  },
  safety: {
    label: 'Safety',
    prompt: 'How safe do you feel right now?',
  },
  hope: {
    label: 'Connection and hope',
    prompt: 'How connected and hopeful have you felt?',
  },
};

export default function VictimPortalPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [victim, setVictim] = useState<Victim | null>(null);
  const [score, setScore] = useState<DistressScore | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportType, setSupportType] = useState<'urgent_safety' | 'counselling' | 'legal_aid'>('counselling');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinSending, setCheckinSending] = useState(false);
  const [mood, setMood] = useState(50);
  const [anxiety, setAnxiety] = useState(50);
  const [sleep, setSleep] = useState(50);
  const [safety, setSafety] = useState(50);
  const [hopelessness, setHopelessness] = useState(50);
  const [isolation, setIsolation] = useState(50);
  const [urgentHelp, setUrgentHelp] = useState(0);
  const [checkinMessage, setCheckinMessage] = useState('');
  const [checkinStep, setCheckinStep] = useState<CheckinStep>('mood');
  const [checkinAnswers, setCheckinAnswers] = useState<Record<string, number>>({});
  const [checkinInput, setCheckinInput] = useState('');
  const [checkinMessages, setCheckinMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([]);
  // Wait for the persisted auth store to rehydrate before deciding to redirect,
  // otherwise a direct visit or refresh bounces a signed-in victim to /login.
  const [hydrated, setHydrated] = useState(false);

  const loadData = async () => {
    if (!user || user.role !== 'victim') return;
    setLoading(true);
    setError('');
    try {
      const [victimResponse, scoreResponse, historyResponse] = await Promise.all([
        api.getVictim(user.id),
        api.getVictimDistress(user.id),
        api.getVictimDistressHistory(user.id),
      ]);
      setVictim(victimResponse.data.profile);
      setScore(scoreResponse.data);
      setHistory(historyResponse.data.map((point: HistoryPoint) => ({
        ...point,
        distress_score: point.score,
        checkin_date: point.date,
      })));
    } catch (loadError) {
      console.error('Failed to load victim portal:', loadError);
      setError('We could not load your wellbeing information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const persist = useAuthStore.persist;
    if (!persist) {
      setHydrated(true);
      return;
    }
    if (persist.hasHydrated()) setHydrated(true);
    return persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login?redirect=%2Fvictim');
    } else if (user.role !== 'victim') {
      router.replace('/dashboard');
    } else {
      loadData();
    }
  }, [hydrated, router, user]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'victim') return null;

  const handleSignOut = () => {
    logout();
    router.replace('/');
  };

  const submitSupportRequest = async () => {
    setSupportSending(true);
    setError('');
    try {
      const response = await api.createSupportRequest({
        victim_id: user.id,
        request_type: supportType,
        message: supportMessage || undefined,
      });
      setSupportOpen(false);
      setSupportMessage('');
      setError(`Request sent to: ${response.data.routed_roles.join(' and ')}. A trained human will follow up.`);
    } catch (requestError) {
      console.error('Failed to send support request:', requestError);
      setError('We could not send your request. Please try again or use your approved emergency channel.');
    } finally {
      setSupportSending(false);
    }
  };

  const submitCheckin = async () => {
    setCheckinSending(true);
    setError('');
    try {
      const response = await api.submitCheckin({
        victim_id: user.id,
        scores: { mood, anxiety_stress: anxiety, sleep_quality: sleep, safety, hopelessness, isolation, urgent_help: urgentHelp },
        message: checkinMessage || undefined,
      });
      setCheckinOpen(false);
      setCheckinMessage('');
      setCheckinInput('');
      setCheckinMessages([{ role: 'assistant', text: 'Hi. I am here to listen. You can answer in your own words, and you can stop at any time.' }]);
      await loadData();
      setError(response.data.human_review
        ? `Check-in submitted. A review notification was sent to: ${response.data.routed_roles.join(' and ')}. A trained human will follow up.`
        : 'Check-in submitted. Your wellbeing view has been updated.');
    } catch (submitError) {
      console.error('Failed to submit check-in:', submitError);
      setError('We could not submit your check-in. Please try again.');
    } finally {
      setCheckinSending(false);
    }
  };

  const beginCheckin = () => {
    setCheckinAnswers({});
    setCheckinMessage('');
    setUrgentHelp(0);
    setCheckinStep('mood');
    setCheckinOpen(true);
  };

  const scoreTypedAnswer = (step: Exclude<CheckinStep, 'message'>, answer: string) => {
    const text = answer.toLowerCase();
    if (step === 'mood' && /(need help|unsafe|very distress|terrible|bad)/.test(text)) return 15;
    if (step === 'stress' && /(overwhelm|very high|extreme|a lot)/.test(text)) return 15;
    if (step === 'sleep' && /(none|couldn't|cannot|very difficult|bad)/.test(text)) return 15;
    if (step === 'safety' && /(unsafe|threat|danger|afraid)/.test(text)) return 10;
    if (step === 'hope' && /(alone|isolat|no hope|hopeless|disconnected)/.test(text)) return 15;
    if (/(better|good|safe|restful|calm|hopeful|connected|little|okay|fine)/.test(text)) return 70;
    if (/(stress|worry|difficult|hard|sad|anxious|uncertain|not great)/.test(text)) return 35;
    return 50;
  };

  const answerCheckin = (step: Exclude<CheckinStep, 'message'>, answer: string) => {
    const value = scoreTypedAnswer(step, answer);
    setCheckinAnswers((answers) => ({ ...answers, [step]: value }));
    if (step === 'mood') setMood(value);
    if (step === 'mood' && value <= 15) setUrgentHelp(1);
    if (step === 'stress') setAnxiety(value);
    if (step === 'sleep') setSleep(value);
    if (step === 'safety') setSafety(value);
    if (step === 'hope') {
      setHopelessness(value);
      setIsolation(value);
    }
    const next: Record<Exclude<CheckinStep, 'message'>, CheckinStep> = {
      mood: 'stress',
      stress: 'sleep',
      sleep: 'safety',
      safety: 'hope',
      hope: 'message',
    };
    setCheckinStep(next[step]);
  };

  const sendCheckinMessage = () => {
    const answer = checkinInput.trim();
    if (!answer || checkinSending) return;
    setCheckinMessages((messages) => [...messages, { role: 'user', text: answer }]);
    setCheckinInput('');
    if (checkinStep === 'message') {
      setCheckinMessage(answer);
      if (/\b(unsafe|danger|threat|hurt myself|self harm|harm myself|suicid|kill myself|no hope|hopeless|afraid|scared for my life|violence|not good|feel bad|feeling bad|very bad|terrible)\b/i.test(answer)) {
        setUrgentHelp(1);
        setCheckinMessages((messages) => [...messages, { role: 'assistant', text: 'I hear that this may need attention. I will flag this check-in for a counsellor and the authorised safety authority to review. I cannot contact emergency services automatically.' }]);
        return;
      }
      setCheckinMessages((messages) => [...messages, { role: 'assistant', text: 'Thank you. I have added that to your private check-in. You can send it when you are ready.' }]);
      return;
    }
    answerCheckin(checkinStep, answer);
    const next: Record<Exclude<CheckinStep, 'message'>, CheckinStep> = { mood: 'stress', stress: 'sleep', sleep: 'safety', safety: 'hope', hope: 'message' };
    const nextStep = next[checkinStep];
    setTimeout(() => {
      setCheckinMessages((messages) => [...messages, {
        role: 'assistant',
        text: nextStep === 'message' ? 'Thank you for telling me. Is there anything else you would like a trained support person to understand? This is optional.' : checkinQuestions[nextStep].prompt,
      }]);
    }, 250);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="SAHAAYA home">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
              <HeartHandshake className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-text-primary">SAHAAYA</p>
              <p className="text-caption text-text-muted">Your support space</p>
            </div>
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm text-text-secondary hover:bg-secondary-100">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-secondary-50 to-background p-7 sm:p-10">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-distress-yellow/10 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <p className="text-body-sm font-medium text-primary-600">Welcome back, {user.name}</p>
            <h1 className="mt-2.5 max-w-xl font-heading text-[2.25rem] font-bold leading-[1.15] tracking-[-0.02em] text-text-primary sm:text-[2.75rem]">
              How are you feeling today?
            </h1>
            <p className="mt-3 max-w-xl text-body text-text-secondary leading-relaxed">
              This is your private space. Check in when you want to, see how you have been over time, and reach a
              trained person whenever you need one. Nothing here happens automatically.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={beginCheckin}
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3.5 text-body font-medium text-white transition-all duration-300 hover:bg-primary-600 hover:shadow-[0_14px_34px_-14px_rgba(62,124,89,0.8)] hover:-translate-y-0.5"
              >
                <HeartHandshake className="h-[18px] w-[18px]" />
                Start a check-in
              </button>
              <button
                onClick={() => setSupportOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-primary-200 bg-surface/80 px-6 py-3.5 text-body font-medium text-primary-700 backdrop-blur-sm transition-colors hover:bg-surface"
              >
                <LifeBuoy className="h-[18px] w-[18px]" />
                Ask for support
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-body-sm text-primary-700">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Dismiss message">Dismiss</button>
          </div>
        )}

        {supportOpen && (
          <div className="rounded-2xl border border-primary-200 bg-surface p-5 shadow-card">
            <h2 className="font-heading text-heading-md font-semibold text-text-primary">Ask a trained person for support</h2>
            <p className="mt-1 text-body-sm text-text-secondary">Your request is routed to people, not handled automatically.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['counselling', 'Counselling'],
                ['urgent_safety', 'Urgent safety'],
                ['legal_aid', 'Legal aid'],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setSupportType(value as typeof supportType)} className={`rounded-xl border p-3 text-left text-body-sm ${supportType === value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border text-text-secondary'}`}>
                  {label}
                </button>
              ))}
            </div>
            <textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} placeholder="Optional: tell the support team what you need" className="mt-4 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-body-sm outline-none focus:border-primary-500" />
            <div className="mt-4 flex gap-3">
              <Button onClick={submitSupportRequest} loading={supportSending}>Send request</Button>
              <Button variant="outline" onClick={() => setSupportOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {checkinOpen && (
          <div className="rounded-2xl border border-primary-200 bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption font-medium uppercase tracking-wide text-primary-600">Private check-in</p>
                <h2 className="mt-1 font-heading text-heading-md font-semibold text-text-primary">Let&apos;s take this one step at a time</h2>
                <p className="mt-1 text-body-sm text-text-secondary">There are no right or wrong answers. You can stop whenever you want.</p>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-caption text-primary-700">
                {checkinStep === 'message' ? '6 of 6' : `${Object.keys(checkinAnswers).length + 1} of 6`}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-background p-3">
                {checkinMessages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-body-sm ${message.role === 'user' ? 'rounded-tr-sm bg-primary-500 text-white' : 'rounded-tl-sm bg-secondary-50 text-text-primary'}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={checkinInput}
                  onChange={(event) => setCheckinInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendCheckinMessage();
                    }
                  }}
                  placeholder="Type your answer..."
                  aria-label="Type your check-in answer"
                  rows={2}
                  className="min-h-12 flex-1 resize-none rounded-xl border border-border bg-background p-3 text-body-sm outline-none focus:border-primary-500"
                />
                <Button onClick={sendCheckinMessage} disabled={!checkinInput.trim() || checkinSending} aria-label="Send message">
                  <MessageCircle className="h-4 w-4" />
                  Send
                </Button>
              </div>
              {checkinStep === 'message' && (
                <div className="flex flex-wrap gap-3 border-t border-border pt-3">
                  <Button onClick={submitCheckin} loading={checkinSending}>Submit check-in</Button>
                  <Button variant="outline" onClick={() => setCheckinOpen(false)}>Cancel</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-secondary">Loading your private wellbeing view...</div>
        ) : score && victim ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <WellbeingState
                band={score.band}
                trend={score.trend_direction}
                onAskForSupport={() => setSupportOpen(true)}
              />
              <Card>
                <CardHeader>
                  <CardTitle>How you have been feeling</CardTitle>
                  <p className="text-body-sm text-text-secondary">Your own check-ins over recent weeks</p>
                </CardHeader>
                <CardContent>
                  <WellbeingTrend points={history} baseline={score.personal_baseline} />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <p className="text-caption text-text-muted">Check-ins recorded</p>
                  <p className="mt-1 text-heading-lg font-semibold text-text-primary">{history.length}</p>
                  <p className="mt-1 text-body-sm text-text-secondary">Every one of them is yours</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-caption text-text-muted">Who can see this</p>
                  <p className="mt-1 text-heading-lg font-semibold text-text-primary">Your support team</p>
                  <p className="mt-1 text-body-sm text-text-secondary">Only people you have consented to</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-caption text-text-muted">Your case</p>
                  <p className="mt-1 text-body-sm font-semibold text-text-primary">{victim.case_type}</p>
                  <p className="mt-1 text-body-sm text-text-secondary">{victim.district}, {victim.state}</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle><ShieldCheck className="mr-2 inline h-5 w-5 text-primary-500" />Privacy and consent</CardTitle></CardHeader>
                <CardContent><p className="text-body-sm text-text-secondary">Your wellbeing information is shown only to authorised support staff. You can review or withdraw consent through your support team.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle><MessageCircle className="mr-2 inline h-5 w-5 text-primary-500" />Need to talk?</CardTitle></CardHeader>
                <CardContent><p className="text-body-sm text-text-secondary">You are not alone. Contact your assigned counsellor or approved local emergency support if you feel unsafe.</p></CardContent>
              </Card>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-body text-text-secondary">{error || 'No wellbeing information is available yet.'}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}><RefreshCw className="h-4 w-4" />Try again</Button>
          </div>
        )}
      </div>
    </main>
  );
}
