'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Loader2 } from 'lucide-react';

export default function HomePage(): React.JSX.Element {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
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
