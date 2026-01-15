'use client';

import { Anchor, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { FormEvent, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { brandConfig } from '@/config/brand';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await login(username, password);
      if (!success) {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Erro ao realizar login', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0d0804] via-[#2b1a10] to-[#5c4227] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(240,199,153,0.14),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_60%_70%,rgba(140,94,53,0.2),transparent_40%)]" />
        <div className="absolute inset-6 rounded-[32px] border border-white/5" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-6">
          <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Anchor className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                {brandConfig.shortName}
              </p>
              <p className="text-sm font-semibold text-white">
                {brandConfig.badgeLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 w-full max-w-md lg:mt-0">
          <div className="rounded-2xl bg-white/95 p-8 shadow-2xl shadow-[#2b1a0f]/40 ring-1 ring-white/50 backdrop-blur">
            <div className="mb-6 space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-[#5c4227]">
                Acesso seguro
              </p>
              <h2 className="text-2xl font-semibold text-[#2b1a0f]">Login</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#2b1a0f]">Usuário</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a38b77]" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="garcom"
                    className="h-12 border-[#e4d7c9] bg-white/70 pl-11 text-[#2b1a0f] placeholder:text-[#9e8a76]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#2b1a0f]">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a38b77]" />
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 border-[#e4d7c9] bg-white/70 pl-11 pr-24 text-[#2b1a0f]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-xs font-semibold text-[#5c4227] transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-[#5c4227]/50"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="h-12 w-full text-base font-semibold shadow-lg shadow-[#5c4227]/25 transition hover:shadow-[#5c4227]/40 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Entrar
              </Button>
            </form>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/90 text-[#2b1a0f]">
          <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
            <Spinner size="lg" aria-label="Carregando" />
            <p className="text-sm text-muted-foreground">Entrando, redirecionando…</p>
          </div>
        </div>
      )}
    </div>
  );
}
