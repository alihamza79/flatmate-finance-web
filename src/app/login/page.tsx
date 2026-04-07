'use client';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const QUICK_LOGINS = [
  { name: 'Husnain', email: 'husnain.ashfaq3939@gmail.com', emoji: '👨' },
  { name: 'Noman', email: 'nomiahmed307@gmail.com', emoji: '👨‍💻' },
  { name: 'Ali', email: 'hamzachaudhay79@gmail.com', emoji: '🧑' },
  { name: 'Abdullah', email: 'mabdkhanniazi@gmail.com', emoji: '👦' },
];

export default function LoginPage(): React.JSX.Element {
  const { signIn } = useAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      await signIn(data.email, data.password);
      router.replace('/group');
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Login failed',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <span className="text-5xl mb-3 block">🏠</span>
          <h1 className="text-3xl font-bold text-white">Flatmate Finance</h1>
          <p className="text-slate-400 mt-2">
            Track shared & personal expenses together
          </p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Quick Login
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LOGINS.map((u) => (
              <button
                key={u.email}
                onClick={() => {
                  setValue('email', u.email);
                  setValue('password', 'Flatmate@123');
                }}
                className="bg-bg-card border border-slate-700 rounded-xl px-4 py-2.5 flex items-center hover:border-slate-500 transition-colors cursor-pointer"
              >
                <span className="text-base mr-2">{u.emoji}</span>
                <span className="text-sm font-medium text-slate-300">{u.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-bg-card rounded-3xl p-6 border border-slate-700/50">
          {errors.root ? (
            <div className="bg-red-900/30 rounded-xl p-3 mb-4">
              <p className="text-danger text-sm text-center">
                {errors.root.message}
              </p>
            </div>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@flatmate.app"
                type="email"
                autoComplete="email"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            fullWidth
            size="lg"
          />
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Password for all accounts: Flatmate@123
        </p>
      </div>
    </div>
  );
}
