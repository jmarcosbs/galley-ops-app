'use client';

import { useMemo, useState } from 'react';
import { AddOrderDialog } from '@/app/components/AddOrderDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, ReceiptText } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type TableItem = {
  id: string;
  name: string;
  quantity: number;
  note?: string;
};

type OpenTable = {
  id: string;
  label: string;
  guests: number;
  waiter: string;
  status: string;
  lastUpdate: string;
  total: number;
  highlights: string[];
  items: TableItem[];
};

const openTables: OpenTable[] = [
  {
    id: 'mesa-01',
    label: 'Varanda 01',
    guests: 8,
    waiter: 'Pedro Santos',
    status: 'Conta em conferência',
    lastUpdate: 'agora',
    total: 864.3,
    highlights: ['Sequência de frutos do mar', 'Drinks autorais', 'Sobremesas variadas'],
    items: [
      { id: 'mesa-01-item-1', name: 'Sequência mediterrânea', quantity: 3 },
      { id: 'mesa-01-item-2', name: 'Risoto de polvo', quantity: 2 },
      { id: 'mesa-01-item-3', name: 'Lagosta grelhada', quantity: 1 },
      { id: 'mesa-01-item-4', name: 'Tartar de salmão', quantity: 2 },
      { id: 'mesa-01-item-5', name: 'Ceviche clássico', quantity: 2 },
      { id: 'mesa-01-item-6', name: 'Tábua de queijos', quantity: 1 },
      { id: 'mesa-01-item-7', name: 'Vinho branco reserva', quantity: 3 },
      { id: 'mesa-01-item-8', name: 'Gin tropical', quantity: 4 },
      { id: 'mesa-01-item-9', name: 'Negroni artesanal', quantity: 4 },
      { id: 'mesa-01-item-10', name: 'Limonada siciliana', quantity: 5 },
      { id: 'mesa-01-item-11', name: 'Água com gás', quantity: 6 },
      { id: 'mesa-01-item-12', name: 'Brownie com sorvete', quantity: 2 },
      { id: 'mesa-01-item-13', name: 'Cheesecake de frutas vermelhas', quantity: 2 },
      { id: 'mesa-01-item-14', name: 'Petit gâteau', quantity: 3 },
      { id: 'mesa-01-item-15', name: 'Café espresso', quantity: 6 },
    ],
  },
  {
    id: 'mesa-07',
    label: 'Mesa 07',
    guests: 4,
    waiter: 'Joana Oliveira',
    status: 'Pratos principais em preparo',
    lastUpdate: 'há 5 minutos',
    total: 268.5,
    highlights: ['2x Camarão grelhado', '1x Vinho branco', '1x Tábua mediterrânea'],
    items: [
      { id: 'mesa-07-item-1', name: 'Camarão grelhado', quantity: 2, note: 'Molho à parte' },
      { id: 'mesa-07-item-2', name: 'Vinho branco', quantity: 1 },
      { id: 'mesa-07-item-3', name: 'Tábua mediterrânea', quantity: 1 },
    ],
  },
  {
    id: 'mesa-02',
    label: 'Mesa 02',
    guests: 2,
    waiter: 'Carlos Nunes',
    status: 'Sobremesas liberadas',
    lastUpdate: 'há 12 minutos',
    total: 142.9,
    highlights: ['1x Brownie com sorvete', '2x Café espresso'],
    items: [
      { id: 'mesa-02-item-1', name: 'Brownie com sorvete', quantity: 1, note: 'Sorvete extra' },
      { id: 'mesa-02-item-2', name: 'Café espresso', quantity: 2 },
    ],
  },
  {
    id: 'mesa-11',
    label: 'Deck externo 11',
    guests: 6,
    waiter: 'Bia Costa',
    status: 'Drinks na fila',
    lastUpdate: 'há 2 minutos',
    total: 512.0,
    highlights: ['Jarra Spritz', 'Ronda de Gin tônica'],
    items: [
      { id: 'mesa-11-item-1', name: 'Jarra Spritz', quantity: 1 },
      { id: 'mesa-11-item-2', name: 'Gin tônica', quantity: 6, note: 'Com pepino' },
    ],
  },
];

const finishedTables = [
  {
    id: 'mesa-04',
    label: 'Mesa 04',
    total: 389.4,
    payment: 'Cartão crédito',
    closedAt: 'há 25 minutos',
  },
  {
    id: 'mesa-09',
    label: 'Balcão 09',
    total: 96.0,
    payment: 'Pix',
    closedAt: 'há 40 minutos',
  },
  {
    id: 'mesa-15',
    label: 'Terraço 15',
    total: 612.7,
    payment: 'Cartão corporativo',
    closedAt: 'há 1 hora',
  },
];

export function TablesBoard() {
  const [activeTable, setActiveTable] = useState<OpenTable | null>(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [closeTable, setCloseTable] = useState<OpenTable | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeSelection, setCloseSelection] = useState<Record<string, number>>({});
  const [closeSelectionActive, setCloseSelectionActive] = useState<Record<string, boolean>>({});

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
    const defaultSelection = table.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
    setCloseSelection(defaultSelection);
    const activeSelection = table.items.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = true;
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
      closeTable.items.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {}),
    );
  };

  const handleDeselectAll = () => {
    if (!closeTable) return;
    setCloseSelectionActive((prev) =>
      closeTable.items.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.id] = false;
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

  const handleProceedClose = () => {
    console.log('Itens selecionados para fechamento', closeSelection);
    handleCloseCloseDialog();
  };

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
          {openTables.map((table) => (
            <Card
              key={table.id}
              onClick={() => handleShowItems(table)}
              className="cursor-pointer"
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <div className="w-1/2">
                    <p className="text-xl font-semibold text-foreground">{table.label}</p>
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
        </div>
      </section>

      <section>
        <Accordion type="single" collapsible className="w-full rounded-lg border">
          <AccordionItem value="finished">
            <AccordionTrigger>
              <div className="ml-4 flex items-center justify-between">
                Mesas finalizadas ({finishedTables.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {finishedTables.map((table) => (
                  <Card key={table.id} className="bg-muted/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{table.label}</p>
                        <p className="text-xs text-muted-foreground">Encerrada {table.closedAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{table.payment}</p>
                        <p className="text-base font-semibold">
                          {currencyFormatter.format(table.total)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Reabrir mesa
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
            {activeTable?.items.map((item) => (
              <div
                key={item.id}
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
            {closeTable?.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-lg border border-muted px-3 py-2 ${
                  closeSelectionActive[item.id] ? '' : 'opacity-50'
                }`}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[#5c4227]"
                        checked={closeSelectionActive[item.id] ?? false}
                        onChange={() => handleToggleItem(item.id)}
                      />
                      <p className="text-base font-semibold text-foreground">{item.name}</p>
                    </label>
                  </div>
                  <p className="pl-7 text-xs text-muted-foreground">Disponível: {item.quantity}</p>
                </div>
                <select
                  className={`h-12 rounded-md border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#5c4227] ${
                    closeSelectionActive[item.id] ? '' : 'opacity-50'
                  }`}
                  value={closeSelection[item.id] ?? 1}
                  disabled={!closeSelectionActive[item.id]}
                  onChange={(event) => handleSelectionChange(item.id, Number(event.target.value))}
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
                disabled={!hasSelectedItems}
                onClick={handleProceedClose}
              >
                Fechar conta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
