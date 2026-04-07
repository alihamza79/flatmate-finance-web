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

type PageState = 'loading' | 'ready' | 'error' | 'success';

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Parse the hash fragment — Supabase puts the token here:
    // #access_token=xxx&refresh_token=yyy&type=recovery
    const hash = window.location.hash.slice(1); // strip leading #
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (type === 'recovery' && accessToken && refreshToken) {
      // Exchange the tokens to establish a session
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setErrorMsg(error.message);
            setPageState('error');
          } else {
            setPageState('ready');
          }
        });
      return;
    }

    // Also listen for the PASSWORD_RECOVERY event (when detectSessionInUrl handles it)
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
      }
    });

    // Give onAuthStateChange a moment to fire; if nothing after 3s, show error
    const timeout = setTimeout(() => {
      setErrorMsg('This link is invalid or has expired. Please request a new one.');
      setPageState('error');
    }, 3000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
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
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw new Error(error.message);
      setPageState('success');
      setTimeout(() => router.replace('/group'), 2500);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to reset password',
      });
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-3">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        <p className="text-slate-400 text-sm">Verifying recovery link...</p>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h1 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h1>
          <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
          <Button label="Back to Login" onPress={() => router.replace('/login')} size="lg" />
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <span className="text-5xl mb-4 block">✅</span>
          <h1 className="text-xl font-bold text-white mb-2">Password Updated!</h1>
          <p className="text-slate-400 text-sm">Taking you into the app...</p>
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
