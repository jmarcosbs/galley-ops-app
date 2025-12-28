import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_BASE_URL } from '@/lib/env';

const formatTableLabel = (options: {
  number: number;
  isOutside?: boolean;
  label?: string;
}) => {
  if (options.label) {
    return options.label;
  }
  const suffix = options.isOutside ? `R${options.number}` : String(options.number);
  return suffix;
};

export type TableItem = {
  uuid: string;
  name: string;
  quantity: number;
  note?: string | null;
  price?: number;
  department?: string | null;
  created_at?: string | null;
};

export type OpenTable = {
  uuid: string;
  number: number;
  is_outside?: boolean;
  status: string;
  status_label?: string;
  created_at: string;
  updated_at: string;
  total?: number | null;
  items?: TableItem[];
  label?: string;
};

export type SettlementHistoryItem = {
  uuid: string;
  dish_order_uuid?: string;
  name: string;
  quantity: number;
  note?: string | null;
  department?: string | null;
};

export type SettlementHistoryEntry = {
  uuid: string;
  ticket_number: number;
  ticket_label?: string;
  final_value: number;
  additions_value?: number;
  discounts_value?: number;
  settled_by: string;
  created_at: string;
  can_cancel?: boolean;
  canceled?: boolean;
  is_partial?: boolean;
  is_outside?: boolean;
  items?: SettlementHistoryItem[];
};

export const useOpenTables = () => {
  const [tables, setTables] = useState<OpenTable[]>([]);
  const [history, setHistory] = useState<SettlementHistoryEntry[]>([]);
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
    const wsBase = WS_BASE_URL;
    if (!wsBase) {
      console.warn('NEXT_PUBLIC_WS_BASE_URL não definido; painel de mesas desativado.');
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
        if (payload?.event === 'open_tables') {
          if (Array.isArray(payload.tables)) {
            const normalizedTables = (payload.tables as OpenTable[]).map((table) => ({
              ...table,
              label: formatTableLabel({
                number: table.number,
                isOutside: table.is_outside,
                label: table.label,
              }),
            }));
            setTables(normalizedTables);
          }
          if (Array.isArray(payload.history)) {
            const normalizedHistory = (payload.history as SettlementHistoryEntry[]).map(
              (entry) => ({
                ...entry,
                ticket_label: formatTableLabel({
                  number: entry.ticket_number,
                  isOutside: entry.is_outside,
                  label: entry.ticket_label,
                }),
              }),
            );
            setHistory(normalizedHistory);
          }
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

  return { tables, history, isLoading, refetch: requestTables };
};
