'use client'
import TableNumber from '@/app/components/TableNumber';
import ShowItemsButton from '@/app/components/ShowItemsButton'
import OrderList from '@/app/components/OrderList'
import Comment from '@/app/components/Comment'
import SendOrderButton from '@/app/components/SendOrderButton'
import { OrderProvider } from '@/app/context/OrderContext';
import { CircularProgress } from '@mui/material';
import { Suspense, useState, useEffect } from 'react';


export default function Home() {
  const [loading, setLoading] = useState(true);

  // Esperar até que todos os componentes sejam carregados
  useEffect(() => {
      setLoading(false)
  }, []);

  return (
    <>
    {loading ? (
        <div className='flex items-center justify-center min-h-screen'><CircularProgress style={{color : '#5c4227'}}/></div> // Fallback de carregamento
      ) : (
    <Suspense fallback={<div>Carregando...</div>}>
      <div className='flex items-center w-screen justify-center'>
        
          <main>
            <div className='grid grid-cols-1 gap-4 w-[100%] min-w-[400px] border p-4'>
              <OrderProvider>
                <TableNumber/>
                <ShowItemsButton />
                <OrderList />
                <Comment/>
                <SendOrderButton />
              </OrderProvider>
            </div>
          </main>

          <footer></footer>
        </div>
    </Suspense>
      )}
    </>
  );
}
