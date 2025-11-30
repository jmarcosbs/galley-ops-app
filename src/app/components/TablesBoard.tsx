'use client';

import { useMemo, useState } from 'react';
import { AddOrderDialog } from '@/app/components/AddOrderDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReceiptText } from 'lucide-react';
import { useOpenTables, OpenTable } from '../hooks/useTables';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '../hooks/useAuth';
import { useUtils } from '../hooks/useUtils';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function TablesBoard() {
  const [activeTable, setActiveTable] = useState<OpenTable | null>(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [closeTable, setCloseTable] = useState<OpenTable | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeSelection, setCloseSelection] = useState<Record<string, number>>({});
  const [closeSelectionActive, setCloseSelectionActive] = useState<Record<string, boolean>>({});
  const [isClosing, setIsClosing] = useState(false);
  const { tables, isLoading, refetch } = useOpenTables();
  const { makeAuthenticatedRequest } = useAuth();
  const { showNotification } = useUtils();

  const handleShowItems = (table: OpenTable) => {
    setActiveTable(table);
    setItemsDialogOpen(true);
  };

  const handleCloseItems = () => {
    setItemsDialogOpen(false);
    setActiveTable(null);
  };

  const handleOpenCloseDialog = (table: OpenTable) => {
    setCloseTable(table);
    const defaultSelection = (table.items ?? []).reduce<Record<string, number>>((acc, item) => {
      acc[item.uuid] = item.quantity;
      return acc;
    }, {});
    setCloseSelection(defaultSelection);
    const activeSelection = (table.items ?? []).reduce<Record<string, boolean>>((acc, item) => {
      acc[item.uuid] = true;
      return acc;
    }, {});
    setCloseSelectionActive(activeSelection);
    setCloseDialogOpen(true);
  };

  const handleCloseCloseDialog = () => {
    setCloseDialogOpen(false);
    setCloseTable(null);
    setCloseSelection({});
    setCloseSelectionActive({});
  };

  const handleSelectionChange = (itemId: string, value: number) => {
    setCloseSelection((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleToggleItem = (itemId: string) => {
    setCloseSelectionActive((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSelectAll = () => {
    if (!closeTable) return;
    setCloseSelectionActive((prev) =>
      (closeTable.items ?? []).reduce<Record<string, boolean>>((acc, item) => {
        acc[item.uuid] = true;
        return acc;
      }, {}),
    );
  };

  const handleDeselectAll = () => {
    if (!closeTable) return;
    setCloseSelectionActive((prev) =>
      (closeTable.items ?? []).reduce<Record<string, boolean>>((acc, item) => {
        acc[item.uuid] = false;
        return acc;
      }, {}),
    );
  };

  const hasSelectedItems = useMemo(
    () =>
      Object.entries(closeSelectionActive).some(
        ([itemId, isActive]) => isActive && (closeSelection[itemId] ?? 0) > 0,
      ),
    [closeSelection, closeSelectionActive],
  );

  const handleProceedClose = async () => {
    if (!closeTable) return;
    const items = Object.entries(closeSelectionActive)
      .filter(([itemId, isActive]) => isActive && (closeSelection[itemId] ?? 0) > 0)
      .map(([itemId]) => ({
        dish_order_uuid: itemId,
        dish_order_quantity: closeSelection[itemId],
      }));

    if (!items.length) return;

    setIsClosing(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/ticket-settlement/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket_number: closeTable.number,
            items,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail || 'Erro ao fechar mesa');
      }

      showNotification('Fechamento registrado', 'success');
      refetch();
      handleCloseCloseDialog();
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Erro ao registrar fechamento',
        'error',
      );
    } finally {
      setIsClosing(false);
    }
  };

  const normalizedTables = useMemo(
    () =>
      tables.map((table) => ({
        ...table,
        label: `Mesa ${table.number}`,
      })),
    [tables],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <AddOrderDialog />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Mesas abertas</p>
          </div>
        </div>

        <div className="space-y-3">
          {normalizedTables.map((table) => (
            <Card
              key={table.uuid}
              onClick={() => handleShowItems(table)}
              className="cursor-pointer"
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <div className="w-1/2">
                    <p className="text-xl font-semibold text-foreground">{table.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {table.total != null ? currencyFormatter.format(table.total) : 'Total pendente'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex h-10 flex-1 items-center justify-center gap-2 sm:flex-none sm:px-4"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleShowItems(table);
                    }}
                  >
                    <ReceiptText className="h-4 w-4" />
                    Ver itens
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none sm:px-4"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenCloseDialog(table);
                    }}
                  >
                    Fechar mesa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!normalizedTables.length ? (
            <div className="rounded-xl border border-dashed border-muted/70 bg-white/60 p-4 text-center text-sm text-muted-foreground">
              Nenhuma mesa aberta no momento.
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-dashed border-muted/60 px-4 py-3 text-sm text-muted-foreground">
          Histórico de mesas finalizadas não disponível nesta versão básica.
        </div>
      </section>

      <Dialog open={itemsDialogOpen} onOpenChange={(open) => (open ? null : handleCloseItems())}>
        <DialogContent className="left-0 top-0 flex h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-none bg-background p-0">
          <div className="shrink-0 border-b border-muted bg-background px-4 py-4">
            <DialogHeader>
              <DialogTitle>{activeTable?.label ?? 'Itens da mesa'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Itens atualmente vinculados à mesa.
            </p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#d7c6b4]">
            {activeTable?.items?.map((item) => (
              <div
                key={item.uuid}
                className="flex items-center justify-between rounded-lg border border-muted/70 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-base font-semibold text-foreground">{item.name}</p>
                  {item.note ? (
                    <p className="text-xs text-muted-foreground">Observação: {item.note}</p>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-[#5c4227]">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={(open) => (open ? null : handleCloseCloseDialog())}>
        <DialogContent className="left-0 top-0 flex h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-none bg-background p-0">
          <div className="shrink-0 border-b border-muted bg-background px-4 py-4">
            <DialogHeader>
              <DialogTitle>Fechar {closeTable?.label ?? 'mesa'}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#d7c6b4]">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex-1 rounded-full border border-[#5c4227] px-4 py-2 text-sm font-semibold text-[#5c4227] transition hover:bg-[#5c4227] hover:text-white sm:flex-none"
              >
                Selecionar todos
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="flex-1 rounded-full border border-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted sm:flex-none"
              >
                Desmarcar todos
              </button>
            </div>
            {closeTable?.items?.map((item) => (
              <div
                key={item.uuid}
                className={`flex items-center justify-between rounded-lg border border-muted px-3 py-2 ${
                  closeSelectionActive[item.uuid] ? '' : 'opacity-50'
                }`}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[#5c4227]"
                        checked={closeSelectionActive[item.uuid] ?? false}
                        onChange={() => handleToggleItem(item.uuid)}
                      />
                      <p className="text-base font-semibold text-foreground">{item.name}</p>
                    </label>
                  </div>
                  <p className="pl-7 text-xs text-muted-foreground">Disponível: {item.quantity}</p>
                </div>
                <select
                  className={`h-12 rounded-md border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#5c4227] ${
                    closeSelectionActive[item.uuid] ? '' : 'opacity-50'
                  }`}
                  value={closeSelection[item.uuid] ?? 1}
                  disabled={!closeSelectionActive[item.uuid]}
                  onChange={(event) => handleSelectionChange(item.uuid, Number(event.target.value))}
                >
                  {Array.from({ length: item.quantity }, (_, index) => index + 1).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="border-t border-muted pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
              <Button
                className="w-full bg-[#5c4227] py-9 text-lg font-semibold text-white hover:bg-[#5c4227]/90"
                disabled={!hasSelectedItems || isClosing}
                onClick={handleProceedClose}
              >
                {isClosing ? 'Enviando...' : 'Fechar conta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
