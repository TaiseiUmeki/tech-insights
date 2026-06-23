'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Label } from '@/shared/ui/shadcn/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/shadcn/ui/card';
import { useLoginAction } from '../lib/use-login-action';

const loginSchema = z.object({
  loginId: z.string().min(1, 'ログインIDは必須です'),
  password: z.string().min(1, 'パスワードは必須です'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const loginMutation = useLoginAction();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold'>ログイン</CardTitle>
        <CardDescription>アカウントにログインしてください</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='loginId'>ログインID</Label>
            <Input
              id='loginId'
              type='text'
              placeholder='ログインIDを入力'
              {...register('loginId')}
            />
            {errors.loginId && (
              <p className='text-sm text-destructive'>
                {errors.loginId.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>パスワード</Label>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              {...register('password')}
            />
            {errors.password && (
              <p className='text-sm text-destructive'>
                {errors.password.message}
              </p>
            )}
          </div>

          {loginMutation.isError && (
            <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
              ログインに失敗しました。ログインIDとパスワードを確認してください。
            </div>
          )}

          <Button
            type='submit'
            className='w-full'
            disabled={loginMutation.isPending || isSubmitting}
          >
            {loginMutation.isPending ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
