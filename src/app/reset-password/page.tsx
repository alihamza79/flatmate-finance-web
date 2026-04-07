'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ResetFormData): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw new Error(error.message);

      setSuccess(true);
      setTimeout(() => {
        router.replace('/group');
      }, 2000);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to reset password',
      });
    }
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        {authError ? (
          <div className="w-full max-w-md text-center">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h1 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h1>
            <p className="text-slate-400 text-sm mb-6">{authError}</p>
            <Button label="Go to Login" onPress={() => router.replace('/login')} size="lg" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            <p className="text-slate-400 text-sm">Verifying recovery link...</p>
          </div>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <span className="text-5xl mb-4 block">✅</span>
          <h1 className="text-xl font-bold text-white mb-2">Password Updated!</h1>
          <p className="text-slate-400 text-sm">Redirecting you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-5xl mb-3 block">🔒</span>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 mt-2 text-sm">Enter your new password below</p>
        </div>

        <div className="bg-bg-card rounded-3xl p-6 border border-slate-700/50">
          {errors.root ? (
            <div className="bg-red-900/30 rounded-xl p-3 mb-4">
              <p className="text-danger text-sm text-center">{errors.root.message}</p>
            </div>
          ) : null}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="Minimum 8 characters"
                type="password"
                autoComplete="new-password"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                type="password"
                autoComplete="new-password"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            label="Update Password"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            fullWidth
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
