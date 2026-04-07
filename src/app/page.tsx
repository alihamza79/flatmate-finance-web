'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Loader2 } from 'lucide-react';

export default function HomePage(): React.JSX.Element {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;

    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      redirectedRef.current = true;
      router.replace(`/reset-password${hash}`);
      return;
    }

    if (!isLoading) {
      redirectedRef.current = true;
      router.replace(session ? '/group' : '/login');
    }
  }, [session, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  );
}
