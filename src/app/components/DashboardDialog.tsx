'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCcw, X, CalendarDays } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUtils } from '../hooks/useUtils';
import { extractApiErrorMessage } from '@/lib/api-error';
import { API_BASE_URL } from '@/lib/env';

type DashboardEntry = {
  uuid: string;
  ticket_number: number;
  ticket_label?: string;
  is_outside?: boolean;
  final_value: number;
  additions_value: number;
  created_at: string;
};

type DashboardSummary = {
  date: string;
  total_sales: number;
  total_additions: number;
  settlements: DashboardEntry[];
};

type DashboardDialogProps = {
  open: boolean;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const formatIsoTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--:--';
  }
  return parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DashboardDialog({ open }: DashboardDialogProps) {
  const { makeAuthenticatedRequest } = useAuth();
  const { showNotification } = useUtils();
  const [selectedDate, setSelectedDate] = useState(() => formatDateInputValue(new Date()));
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef(makeAuthenticatedRequest);
  const notificationRef = useRef(showNotification);

  useEffect(() => {
    requestRef.current = makeAuthenticatedRequest;
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    notificationRef.current = showNotification;
  }, [showNotification]);

  const hasSettlements = useMemo(() => (data?.settlements?.length ?? 0) > 0, [data?.settlements]);

  const fetchSummary = useCallback(
    async (dateValue: string) => {
      const baseUrl = API_BASE_URL;
      if (!baseUrl) {
        notificationRef.current('URL da API não configurada.', 'error');
        return;
      }

      setIsLoading(true);
      try {
        const url = new URL('/api/dashboard/', baseUrl);
        url.searchParams.set('date', dateValue);

        const response = await requestRef.current(url.toString());
        let payload: DashboardSummary | Record<string, unknown> | null = null;
        try {
          payload = await response.json();
        } catch (error) {
          payload = null;
        }

        if (!response.ok || !payload) {
          const message = extractApiErrorMessage(payload) ?? 'Erro ao carregar dados do dashboard.';
          throw new Error(message);
        }

        const normalizedSettlements = Array.isArray(payload.settlements)
          ? (payload.settlements as DashboardEntry[]).map((entry) => ({
              ...entry,
              ticket_label:
                entry.ticket_label ??
                (entry.is_outside ? `R${entry.ticket_number}` : String(entry.ticket_number)),
            }))
          : [];

        setData({
          ...(payload as DashboardSummary),
          settlements: normalizedSettlements,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar dados do dashboard.';
        notificationRef.current(message, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    fetchSummary(selectedDate);
  }, [open, selectedDate, fetchSummary]);

  const summaryDate = useMemo(() => {
    if (!data?.date) {
      return '';
    }
    const parsed = new Date(data.date);
    if (Number.isNaN(parsed.getTime())) {
      return data.date;
    }
    return parsed.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    });
  }, [data?.date]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dashboard</p>
          <h2 className="text-lg font-semibold text-foreground">Resumo diário</h2>
          {summaryDate && (
            <p className="text-sm text-muted-foreground capitalize">{summaryDate}</p>
          )}
        </div>
        <DialogClose asChild>
          <Button variant="ghost" size="icon" aria-label="Fechar dashboard">
            <X className="h-5 w-5" />
          </Button>
        </DialogClose>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="dashboard-date">
          Selecione uma data
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              id="dashboard-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="pr-10"
            />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Atualizar dados"
            onClick={() => fetchSummary(selectedDate)}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
          <Spinner size="lg" />
          <p>Carregando dados do dia…</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total da venda
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {currencyFormatter.format(data?.total_sales ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Valor total dos 10%
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {currencyFormatter.format(data?.total_additions ?? 0)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-foreground">Histórico de fechamentos</p>
              <p className="text-xs text-muted-foreground">
                Valores consolidados do dia selecionado
              </p>
            </div>
            {hasSettlements ? (
              <div className="space-y-3">
                {data?.settlements?.map((entry) => (
                  <div key={entry.uuid} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-sm font-medium text-foreground">
                      <span>Mesa #{entry.ticket_label ?? entry.ticket_number}</span>
                      <span className="text-muted-foreground">{formatIsoTime(entry.created_at)}</span>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                        <p className="text-base font-semibold text-foreground">
                          {currencyFormatter.format(entry.final_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">10%</p>
                        <p className="text-base font-semibold text-foreground">
                          {currencyFormatter.format(entry.additions_value)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhum fechamento encontrado para esta data.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
