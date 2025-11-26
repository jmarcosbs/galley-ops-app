'use client'
import TableNumber from '@/app/components/TableNumber';
import Items from '@/app/components/Items'
import OrderList from '@/app/components/OrderList'
import Comment from '@/app/components/Comment'
import SendOrderButton from '@/app/components/SendOrderButton'
import { Spinner } from '@/components/ui/spinner';
import { Suspense, useState, useEffect } from 'react';


export default function Home() {
  const [loading, setLoading] = useState(true);

  // const [user, orders, settings] = await Promise.all([
  //   fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/users/me/`, { cache: "no-store" }).then(r => r.json()),
  //   fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/orders/`, { cache: "no-store" }).then(r => r.json()),
  //   fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/settings/`, { cache: "no-store" }).then(r => r.json())
  // ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLoading(false), 250);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <div className='flex items-center w-full justify-center'>
        <main className='w-full space-y-6'>
          <Items />
          <OrderList />
          <Comment />
          <TableNumber />
          <SendOrderButton />
        </main>

        <footer></footer>
      </div>
    </Suspense>
  );
}
