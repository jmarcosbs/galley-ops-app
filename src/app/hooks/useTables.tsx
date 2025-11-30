import { useCallback, useEffect, useRef, useState } from 'react';

export type TableItem = {
  uuid: string;
  name: string;
  quantity: number;
  note?: string | null;
  price?: number;
};

export type OpenTable = {
  uuid: string;
  number: number;
  status: string;
  created_at: string;
  updated_at: string;
  total?: number | null;
  items?: TableItem[];
};

export const useOpenTables = () => {
  const [tables, setTables] = useState<OpenTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  const requestTables = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      socket.send(JSON.stringify({ type: 'refresh' }));
    }
  }, []);

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsBase) {
      console.warn('NEXT_PUBLIC_WS_URL não definido; painel de mesas desativado.');
      setIsLoading(false);
      return;
    }
    let isClosed = false;
    const socket = new WebSocket(`${wsBase}/ws/open-tables/`);
    socketRef.current = socket;

    socket.addEventListener('open', requestTables);

    socket.addEventListener('message', (event) => {
      if (isClosed) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event === 'open_tables' && Array.isArray(payload.tables)) {
          setTables(payload.tables);
        } else {
          console.warn('Mensagem de WS ignorada', payload);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem do websocket', error);
      } finally {
        setIsLoading(false);
      }
    });

    socket.addEventListener('error', (error) => {
      if (isClosed) return;
      setIsLoading(false);
      console.error('Erro no websocket de mesas', error);
    });

    return () => {
      isClosed = true;
      socket.removeEventListener('open', requestTables);
      socket.close();
      socketRef.current = null;
    };
  }, [requestTables]);

  return { tables, isLoading, refetch: requestTables };
};
