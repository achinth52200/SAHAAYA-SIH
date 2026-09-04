'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Shield,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/lib/store';
import { api } from '@/lib/api';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle },
  { name: 'Victims', href: '/dashboard/victims', icon: Users },
  { name: 'Districts', href: '/dashboard/districts', icon: MapPin },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

/**
 * The most specific matching nav entry. Matching by prefix alone makes "/dashboard"
 * match every sub-route, which lit up two sidebar items at once.
 */
function activeNavHref(pathname: string) {
  // Routes without their own nav entry belong to a section they were reached from.
  if (pathname.startsWith('/dashboard/states')) return '/dashboard/districts';

  return [...navigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.href;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [supportCount, setSupportCount] = useState(0);
  const seenSupportRequests = useRef<Set<string>>(new Set());
  // Guards the first poll so pre-existing requests seed the "seen" set silently.
  const hasBaselinedSupport = useRef(false);

  // The auth store persists to localStorage and rehydrates asynchronously. Without waiting
  // for that, a hard refresh (or opening a dashboard URL directly) sees `user === null` on
  // the first render and bounces a signed-in officer back to the login page.
  // Starts false so server and first client render agree; the persist API only exists in the browser.
  const [hydrated, setHydrated] = useState(false);

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
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user.role === 'victim') {
      router.replace('/victim');
    }
  }, [hydrated, pathname, router, user]);

  useEffect(() => {
    if (!user || user.role === 'victim') return;
    let active = true;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch((error) => {
        console.error('Failed to request notification permission:', error);
      });
    }
    type SupportRequest = { id?: string; request_id?: string; victim_id: string; request_type: string; created_at: string };
    const idOf = (r: SupportRequest) => r.id || r.request_id || `${r.victim_id}-${r.created_at}`;

    const pollSupportRequests = async () => {
      try {
        const response = await api.getSupportRequests({
          role: user.role === 'counsellor' ? 'counsellor' : 'district_officer',
        });
        if (!active) return;
        const requests = (response.data ?? []) as SupportRequest[];

        // The first poll only establishes a baseline. Requests that already existed when
        // this console opened are history, not news — notifying for each of them is what
        // produced a burst of notifications on every page load.
        if (!hasBaselinedSupport.current) {
          requests.forEach((request) => seenSupportRequests.current.add(idOf(request)));
          hasBaselinedSupport.current = true;
          return;
        }

        const newRequests = requests.filter((request) => !seenSupportRequests.current.has(idOf(request)));
        if (newRequests.length === 0) return;
        newRequests.forEach((request) => seenSupportRequests.current.add(idOf(request)));

        setSupportCount((count) => count + newRequests.length);

        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          // Surface only the most recent request. A burst collapses into one notification,
          // and the fixed tag makes it replace the previous one instead of stacking.
          const latest = [...newRequests].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          const others = newRequests.length - 1;
          const registration = await navigator.serviceWorker.ready;
          if (!active) return;
          registration.showNotification('SAHAAYA support request', {
            body: `${latest.request_type.replace('_', ' ')} request from ${latest.victim_id}. Human review is required.`
              + (others > 0 ? ` (+${others} more waiting)` : ''),
            tag: 'sahaaya-support-request',
            renotify: true,
            icon: '/icon.svg',
          } as NotificationOptions);
        }
      } catch (error) {
        console.error('Failed to poll support requests:', error);
      }
    };
    pollSupportRequests();
    const timer = window.setInterval(pollSupportRequests, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user]);

  const enableNotifications = async () => {
    // Acknowledging clears the badge — previously the count only ever grew.
    setSupportCount(0);
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || user.role === 'victim') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => toggleSidebar()}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen hero-dark transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        {/* subtle edge highlight */}
        <div
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary-400/30 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 py-5">
            <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="SAHAAYA Dashboard">
              <div className="w-9 h-9 rounded-xl bg-primary-400 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#0B140F]" />
              </div>
              <span>
                <span className="block font-heading font-semibold text-heading-sm text-white leading-none">SAHAAYA</span>
                <span className="block text-[10px] tracking-[0.14em] text-primary-300/70 mt-1">OFFICER CONSOLE</span>
              </span>
            </Link>
            <button
              className="ml-auto lg:hidden p-2 rounded-lg text-white/60 hover:bg-white/10"
              onClick={() => toggleSidebar()}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Dashboard">
            <p className="px-3 pb-2 text-[10px] font-medium tracking-[0.16em] text-white/30">MONITORING</p>
            {navigation.map((item) => {
              const isActive = item.href === activeNavHref(pathname);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-white/[0.09] text-white'
                      : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary-300"
                      aria-hidden="true"
                    />
                  )}
                  <item.icon
                    className={cn(
                      'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                      isActive ? 'text-primary-300' : 'text-white/45 group-hover:text-white/80'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Pipeline status */}
          <div className="px-3 pb-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-distress-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-distress-green" />
                </span>
                <span className="text-[11px] font-medium text-white/70">Pipeline online</span>
              </div>
              <p className="text-[10px] text-white/35 leading-snug">
                Synthetic prototype data · no real victim records
              </p>
            </div>
          </div>

          {/* Bottom */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <User className="w-[18px] h-[18px] text-primary-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-white/40 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('lg:pl-64 transition-all duration-300', sidebarOpen && 'lg:pl-64')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-secondary-100"
                onClick={() => toggleSidebar()}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-body-sm">
                <span className="text-text-muted">Console</span>
                <span className="text-text-muted/50">/</span>
                <span className="font-medium text-text-primary">
                  {navigation.find((n) => n.href === activeNavHref(pathname))?.name || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-[11px] font-medium">
                <Shield className="w-3.5 h-3.5" />
                Human-in-the-loop enforced
              </span>

              {/* Notifications */}
              <button onClick={enableNotifications} className="relative p-2 rounded-xl hover:bg-secondary-100 transition-colors" aria-label="Enable support notifications">
                <Bell className="w-5 h-5 text-text-secondary" />
                {supportCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-distress-red px-1 text-center text-[10px] text-white">{supportCount}</span>}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary-100 transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="hidden sm:block text-body-sm font-medium text-text-primary">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-text-muted hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl border border-border shadow-elevated py-1 z-50 animate-in slide-down">
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2 px-4 py-2 text-body-sm text-text-secondary hover:bg-secondary-100 hover:text-text-primary"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-4 py-2 text-body-sm text-text-secondary hover:bg-secondary-100 hover:text-text-primary"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-body-sm text-text-secondary hover:bg-secondary-100 hover:text-text-primary"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}