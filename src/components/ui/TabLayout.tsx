'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Wallet, BarChart3 } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { Loader2 } from 'lucide-react';

const TABS = [
  { href: '/group', label: 'Group', icon: Users },
  { href: '/personal', label: 'Personal', icon: Wallet },
  { href: '/dashboard', label: 'Insights', icon: BarChart3 },
] as const;

export function TabLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login');
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!session) return <></>;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-slate-700/50 z-50">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                  isActive ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
