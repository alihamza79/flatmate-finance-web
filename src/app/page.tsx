'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Loader2 } from 'lucide-react';

export default function HomePage(): React.JSX.Element {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for Supabase recovery hash BEFORE doing the normal auth redirect.
    // Supabase emails link to the Site URL (/) with #access_token=...&type=recovery
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Preserve the full hash so reset-password page can exchange the token
      router.replace(`/reset-password${hash}`);
      return;
    }

    if (!isLoading) {
      if (session) {
        router.replace('/group');
      } else {
        router.replace('/login');
      }
    }
  }, [session, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  );
}
