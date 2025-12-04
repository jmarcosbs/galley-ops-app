'use client';

import { ReactNode, useContext, useEffect, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TablesBoard } from '@/app/components/TablesBoard';
import { OrderProvider } from '@/context/OrderContext';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {  AuthContext, AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { useAuth } from '../hooks/useAuth';

type LayoutShellProps = {
  children: ReactNode;
};

function LayoutShellContent({ children }: LayoutShellProps) {
  const [loading, setLoading] = useState(true);
  const [tablesOpen, setTablesOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const { authStatus } = useContext(AuthContext)!;

  useEffect(() => {
    setLoading(false);
  }, []);

  if (authStatus === 'unauthenticated') return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="-mx-4 -mt-6 space-y-4 bg-[#5c4227] px-4 py-4 text-white shadow">
        <div className="flex items-center gap-4">
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Restaurante
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-white">
              Marinheiro&apos;s
            </p>
          </div>
          <NavigationMenu className="w-full justify-end">
            <NavigationMenuList className="w-full border-white/30 bg-white/10 text-white backdrop-blur">
              <NavigationMenuItem>
                <Dialog open={tablesOpen} onOpenChange={setTablesOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className={`${navigationMenuTriggerStyle} text-[15px] bg-white text-[#5c4227] hover:bg-white/90`}
                      aria-label="Abrir mesas"
                    >
                      Gerenciar mesas
                    </button>
                  </DialogTrigger>
                  <DialogContent className="left-0 top-0 h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-background p-0 [&>button:last-child]:hidden">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Gerenciar mesas</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-full flex-col">
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            Mesas
                          </p>
                          <p className="text-lg font-semibold text-foreground">
                            Painel em tempo real
                          </p>
                        </div>
                        <DialogClose asChild>
                          <button
                            type="button"
                            aria-label="Fechar painel de mesas"
                            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#5c4227] text-white shadow transition hover:bg-[#4a331d] focus:outline-none focus:ring-2 focus:ring-[#5c4227]/60 focus:ring-offset-2 focus:ring-offset-background"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </DialogClose>
                      </div>
                      <div className="flex-1 overflow-y-auto px-4 py-4">
                        <TablesBoard />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>
      {children}
    </main>
  );
}

export default function LayoutShell({ children }: LayoutShellProps) {
  return (
    <AuthProvider>
    <OrderProvider>
      <LayoutShellContent>{children}</LayoutShellContent>
      <Toaster position="top-center" richColors/>
    </OrderProvider>
    </AuthProvider>
      
  );
}
