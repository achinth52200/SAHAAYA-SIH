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
  const lastSupportCheck = useRef<string>('');

  useEffect(() => {
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user.role === 'victim') {
      router.replace('/victim');
    }
  }, [pathname, router, user]);

  useEffect(() => {
    if (!user || user.role === 'victim') return;
    let active = true;
    const pollSupportRequests = async () => {
      try {
        const response = await api.getSupportRequests({
          role: user.role === 'counsellor' ? 'counsellor' : 'district_officer',
          since: lastSupportCheck.current || undefined,
        });
        const requests = response.data as Array<{ request_id: string; victim_id: string; request_type: string; created_at: string }>;
        if (!active || requests.length === 0) return;
        lastSupportCheck.current = requests[0].created_at;
        setSupportCount((count) => count + requests.length);
        if ('Notification' in window && Notification.permission === 'granted') {
          requests.forEach((request) => {
            new Notification('SAHAAYA support request', {
              body: `${request.request_type.replace('_', ' ')} request from ${request.victim_id}. Human review is required.`,
              tag: request.request_id,
            });
          });
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
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };

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
          'fixed left-0 top-0 z-50 h-screen bg-surface border-r border-border transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="SAHAAYA Dashboard">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-semibold text-heading-md text-text-primary">SAHAAYA</span>
            </Link>
            <button
              className="ml-auto lg:hidden p-2 rounded-lg hover:bg-secondary-100"
              onClick={() => toggleSidebar()}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Dashboard">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:bg-secondary-100 hover:text-text-primary'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">{user?.name}</p>
                <p className="text-caption text-text-muted capitalize">{user?.role?.replace('_', ' ')}</p>
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
              <h1 className="text-heading-lg font-semibold text-text-primary hidden sm:block">
                {navigation.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
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