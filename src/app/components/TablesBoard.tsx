'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { AddOrderDialog } from '@/app/components/AddOrderDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp01, Minus, Plus, ReceiptText, RefreshCcw, Printer } from 'lucide-react';
import { useOpenTables, OpenTable, SettlementHistoryEntry } from '../hooks/useTables';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '../hooks/useAuth';
import { useUtils } from '../hooks/useUtils';
import { useMenu } from '../hooks/useMenu';
import { extractApiErrorMessage } from '@/lib/api-error';
import { API_BASE_URL } from '@/lib/env';

type GroupedActiveItem = {
  key: string;
  name: string;
  note?: string | null;
  department?: string | null;
  totalQuantity: number;
  entries: { uuid: string; quantity: number; created_at?: string | null }[];
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const getDepartmentStep = (department?: string | null) => {
  const normalized = (department ?? '').toLowerCase();
  if (normalized === 'bar' || normalized === 'copa') {
    return 1;
  }
  return 0.5;
};

const formatQuantity = (quantity: number, department?: string | null) => {
  const step = getDepartmentStep(department);
  return quantity.toLocaleString('pt-BR', {
    minimumFractionDigits: step === 0.5 ? 1 : 0,
    maximumFractionDigits: step === 0.5 ? 1 : 0,
  });
};

const getDepartmentLabel = (department?: string | null) => {
  const normalized = (department ?? '').toLowerCase();
  if (normalized === 'bar' || normalized === 'copa') {
    return 'Copa';
  }
  return 'Cozinha';
};

const resolveTableStatusBadge = (status?: string, statusLabel?: string) => {
  if (!status && !statusLabel) {
    return null;
  }
  if (status === 'partially_paid') {
    return {
      label: statusLabel ?? 'Parcialmente fechada',
      className: 'bg-yellow-100 text-yellow-800',
    };
  }
  if (status === 'open') {
    return {
      label: statusLabel ?? 'Aberta',
      className: 'bg-green-100 text-green-800',
    };
  }
  return {
    label: statusLabel ?? status ?? '',
    className: 'bg-slate-100 text-slate-700',
  };
};

const formatElapsedTime = (dateString?: string | null, now: number = Date.now()) => {
  if (!dateString) return null;
  const timestamp = Date.parse(dateString);
  if (Number.isNaN(timestamp)) return null;
  const diffMs = Math.max(0, now - timestamp);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'há instantes';
  if (diffMinutes < 60) {
    if (diffMinutes === 1) {
      return 'há 1 min';
    }
    return `há ${diffMinutes} min`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes === 0) {
      return diffHours === 1 ? 'há 1h' : `há ${diffHours}h`;
    }
    const hourLabel = diffHours === 1 ? '1h' : `${diffHours}h`;
    return remainingMinutes === 1
      ? `há ${hourLabel} 1min`
      : `há ${hourLabel} ${remainingMinutes}min`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
};

export function TablesBoard() {
  const [activeTable, setActiveTable] = useState<OpenTable | null>(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [closeTable, setCloseTable] = useState<OpenTable | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeSelection, setCloseSelection] = useState<Record<string, number>>({});
  const [closeSelectionActive, setCloseSelectionActive] = useState<Record<string, boolean>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [removingGroupKey, setRemovingGroupKey] = useState<string | null>(null);
  const [quantityAdjusting, setQuantityAdjusting] = useState<{
    key: string;
    type: 'increase' | 'decrease';
  } | null>(null);
  const [reprintingSettlementId, setReprintingSettlementId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelingSettlement, setCancelingSettlement] =
    useState<SettlementHistoryEntry | null>(null);
  const [cancelJustification, setCancelJustification] = useState('');
  const [isCancellingSettlement, setIsCancellingSettlement] = useState(false);
  const [historyItemsSettlementUuid, setHistoryItemsSettlementUuid] = useState<string | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState<OpenTable | null>(null);
  const [editedTableNumber, setEditedTableNumber] = useState<number | ''>('');
  const [editedIsOutside, setEditedIsOutside] = useState(false);
  const [isUpdatingTableDetails, setIsUpdatingTableDetails] = useState(false);
  const [isRefreshingTables, setIsRefreshingTables] = useState(false);
  const { tables, history, isLoading, refetch } = useOpenTables();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const { makeAuthenticatedRequest, isSuperAdmin } = useAuth();
  const { showNotification } = useUtils();
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const lastItemsCountRef = useRef<number | null>(null);
  const canManageItems = isSuperAdmin;
  const canClosePartially = isSuperAdmin;
  const canEditTableMetadata = isSuperAdmin;
  const isCancelJustificationValid = cancelJustification.trim().length >= 15;

  const handleShowItems = (table: OpenTable) => {
    setActiveTable(table);
    setItemsDialogOpen(true);
    setShowAddForm(false);
    setNewItemQuantity(1);
    lastItemsCountRef.current = table.items?.length ?? 0;
  };

  const handleCloseItems = useCallback(() => {
    setItemsDialogOpen(false);
    setActiveTable(null);
    setShowAddForm(false);
    setNewItemQuantity(1);
    setIsAddingItem(false);
    lastItemsCountRef.current = null;
  }, []);

  const groupedActiveItems = useMemo(() => {
    if (!activeTable?.items) return [] as GroupedActiveItem[];
    const groups = activeTable.items.reduce<Record<string, GroupedActiveItem>>(
      (acc, item) => {
        const key = `${item.name}__${item.note ?? ''}__${item.department ?? ''}`;
        if (!acc[key]) {
          acc[key] = {
            key,
            name: item.name,
            note: item.note,
            department: item.department,
            totalQuantity: 0,
            entries: [],
          };
        }
        acc[key].totalQuantity += item.quantity;
        acc[key].entries.push({
          uuid: item.uuid,
          quantity: item.quantity,
          created_at: item.created_at,
        });
        return acc;
      },
      {},
    );
    return Object.values(groups);
  }, [activeTable]);

  const historyItemsEntry = useMemo(() => {
    if (!historyItemsSettlementUuid) return null;
    return history.find((entry) => entry.uuid === historyItemsSettlementUuid) ?? null;
  }, [history, historyItemsSettlementUuid]);

  const historyItemsDialogOpen = Boolean(historyItemsSettlementUuid && historyItemsEntry);

  const groupedHistoryItems = useMemo(() => {
    if (!historyItemsEntry?.items?.length) return [];
    const groups = historyItemsEntry.items.reduce<
      Record<
        string,
        {
          key: string;
          name: string;
          note?: string | null;
          department?: string | null;
          totalQuantity: number;
        }
      >
    >((acc, item) => {
      const key = `${item.name}__${item.note ?? ''}__${item.department ?? ''}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          name: item.name,
          note: item.note,
          department: item.department,
          totalQuantity: 0,
        };
      }
      acc[key].totalQuantity += item.quantity;
      return acc;
    }, {});
    return Object.values(groups);
  }, [historyItemsEntry]);

  const isValidEditedTableNumber =
    typeof editedTableNumber === 'number' &&
    Number.isFinite(editedTableNumber) &&
    editedTableNumber > 0;

  const hasTableChanges = Boolean(
    editingTable &&
      isValidEditedTableNumber &&
      (editedTableNumber !== editingTable.number ||
        editedIsOutside !== Boolean(editingTable.is_outside)),
  );
  const isUpdateTableDisabled = !hasTableChanges || isUpdatingTableDetails;

  useEffect(() => {
    if (!activeTable) return;
    const fresh = tables.find((table) => table.uuid === activeTable.uuid);
    if (fresh) {
      setActiveTable(fresh);
      return;
    }
    if (itemsDialogOpen) {
      handleCloseItems();
      showNotification('Conta fechada', 'success');
    } else {
      setActiveTable(null);
    }
  }, [tables, activeTable, itemsDialogOpen, handleCloseItems, showNotification]);

  useEffect(() => {
    setEditingTable((previous) => {
      if (!previous) return previous;
      const refreshed = tables.find((table) => table.uuid === previous.uuid);
      if (!refreshed) return null;
      if (
        refreshed.number === previous.number &&
        refreshed.is_outside === previous.is_outside &&
        refreshed.label === previous.label
      ) {
        return previous;
      }
      return refreshed;
    });
  }, [tables]);

  useEffect(() => {
    if (!editingTable) {
      setEditedTableNumber('');
      setEditedIsOutside(false);
      return;
    }
    setEditedTableNumber(editingTable.number);
    setEditedIsOutside(Boolean(editingTable.is_outside));
  }, [editingTable]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!historyItemsSettlementUuid) return;
    if (!historyItemsEntry) {
      setHistoryItemsSettlementUuid(null);
    }
  }, [historyItemsSettlementUuid, historyItemsEntry]);

  useEffect(() => {
    if (!itemsDialogOpen) {
      lastItemsCountRef.current = activeTable?.items?.length ?? null;
      return;
    }

    const currentCount = activeTable?.items?.length ?? 0;
    if (
      lastItemsCountRef.current !== null &&
      lastItemsCountRef.current > 0 &&
      currentCount === 0
    ) {
      setItemsDialogOpen(false);
      setActiveTable(null);
      setShowAddForm(false);
      setNewItemQuantity(1);
      setIsAddingItem(false);
      showNotification('Comanda finalizada', 'success');
    }
    lastItemsCountRef.current = currentCount;
  }, [activeTable?.items?.length, itemsDialogOpen, showNotification]);

  useEffect(() => {
    if (!canManageItems) {
      setShowAddForm(false);
    }
  }, [canManageItems]);

  useEffect(() => {
    if (!isLoading) {
      setIsRefreshingTables(false);
    }
  }, [isLoading]);

  const groupedCloseItems = useMemo(() => {
    if (!closeTable?.items) return [];
    const groups = closeTable.items.reduce<
      Record<
        string,
        {
          key: string;
          name: string;
          note?: string | null;
          department?: string | null;
          totalQuantity: number;
          entries: { uuid: string; quantity: number }[];
        }
      >
    >((acc, item) => {
      const key = `${item.name}__${item.note ?? ''}__${item.department ?? ''}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          name: item.name,
          note: item.note,
          department: item.department,
          totalQuantity: 0,
          entries: [],
        };
      }
      acc[key].totalQuantity += item.quantity;
      acc[key].entries.push({ uuid: item.uuid, quantity: item.quantity });
      return acc;
    }, {});
    return Object.values(groups);
  }, [closeTable?.items]);

  const handleOpenCloseDialog = (table: OpenTable) => {
    setCloseTable(table);
    setCloseDialogOpen(true);
  };

  const handleOpenHistoryItems = (entry: SettlementHistoryEntry) => {
    if (!entry.items?.length) return;
    setHistoryItemsSettlementUuid(entry.uuid);
  };

  const handleCloseHistoryItems = () => {
    setHistoryItemsSettlementUuid(null);
  };

  useEffect(() => {
    if (!closeDialogOpen) return;
    const defaultSelection = groupedCloseItems.reduce<Record<string, number>>((acc, group) => {
      acc[group.key] = group.totalQuantity;
      return acc;
    }, {});
    const activeSelection = groupedCloseItems.reduce<Record<string, boolean>>((acc, group) => {
      acc[group.key] = true;
      return acc;
    }, {});
    setCloseSelection(defaultSelection);
    setCloseSelectionActive(activeSelection);
  }, [groupedCloseItems, closeDialogOpen]);

  const handleCloseCloseDialog = () => {
    setCloseDialogOpen(false);
    setCloseTable(null);
    setCloseSelection({});
    setCloseSelectionActive({});
  };

  const handleSelectionChange = (key: string, value: number) => {
    if (!canClosePartially) return;
    setCloseSelection((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleItem = (key: string) => {
    if (!canClosePartially) return;
    setCloseSelectionActive((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    if (!canClosePartially || !groupedCloseItems.length) return;
    setCloseSelectionActive(
      groupedCloseItems.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.key] = true;
        return acc;
      }, {}),
    );
  };

  const handleDeselectAll = () => {
    if (!canClosePartially || !groupedCloseItems.length) return;
    setCloseSelectionActive(
      groupedCloseItems.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.key] = false;
        return acc;
      }, {}),
    );
  };

  const formatSettlementDate = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const handleManualRefresh = () => {
    if (isRefreshingTables) return;
    setIsRefreshingTables(true);
    refetch();
  };

  const handleReprintSettlement = async (settlementUuid: string) => {
    if (reprintingSettlementId) return;
    setReprintingSettlementId(settlementUuid);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/ticket-settlement/${settlementUuid}/reprint/`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errorMessage = extractApiErrorMessage(body) || 'Erro ao reimprimir cupom';
        throw new Error(errorMessage);
      }

      showNotification('Cupom enviado para impressão', 'success');
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Não foi possível reimprimir o cupom',
        'error',
      );
    } finally {
      setReprintingSettlementId(null);
    }
  };

  const handleOpenCancelDialog = (entry: SettlementHistoryEntry) => {
    if (!isSuperAdmin || !entry.can_cancel) return;
    setCancelingSettlement(entry);
    setCancelJustification('');
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = (force = false) => {
    if (!force && isCancellingSettlement) return;
    setCancelDialogOpen(false);
    setCancelingSettlement(null);
    setCancelJustification('');
  };

  const handleConfirmCancelSettlement = async () => {
    if (!cancelingSettlement) return;
    const justification = cancelJustification.trim();
    if (justification.length < 15) {
      showNotification('Informe uma justificativa com ao menos 15 caracteres.', 'error');
      return;
    }

    setIsCancellingSettlement(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/ticket-settlement/cancel/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settlement_uuid: cancelingSettlement.uuid,
            justification,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errorMessage = extractApiErrorMessage(body) || 'Erro ao cancelar fechamento';
        throw new Error(errorMessage);
      }

      showNotification('Fechamento cancelado com sucesso', 'success');
      handleCloseCancelDialog(true);
      refetch();
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Não foi possível cancelar o fechamento',
        'error',
      );
    } finally {
      setIsCancellingSettlement(false);
    }
  };

  const hasSelectedItems = useMemo(() => {
    if (!groupedCloseItems.length) return false;
    if (!canClosePartially) return true;
    return groupedCloseItems.some(
      (group) => closeSelectionActive[group.key] && (closeSelection[group.key] ?? 0) > 0,
    );
  }, [groupedCloseItems, closeSelection, closeSelectionActive, canClosePartially]);

  const menuOptions = useMemo(
    () =>
      menu.flatMap((category) =>
        (category.items ?? []).map((dish) => ({
          uuid: dish.uuid,
          label: `${category.category.name} — ${dish.name}`,
        })),
      ),
    [menu],
  );

  useEffect(() => {
    if (!selectedDishId && menuOptions.length) {
      setSelectedDishId(menuOptions[0].uuid);
    }
  }, [menuOptions, selectedDishId]);

  const handleProceedClose = async () => {
    if (!closeTable) return;
    const items = canClosePartially
      ? groupedCloseItems.flatMap((group) => {
          if (!closeSelectionActive[group.key]) return [];
          let remaining = closeSelection[group.key] ?? 0;
          if (remaining <= 0) return [];
          const groupItems = [];
          for (const entry of group.entries) {
            if (remaining <= 0) break;
            const amount = Math.min(entry.quantity, remaining);
            groupItems.push({
              dish_order_uuid: entry.uuid,
              dish_order_quantity: amount,
            });
            remaining -= amount;
          }
          return groupItems;
        })
      : (closeTable.items ?? []).map((item) => ({
          dish_order_uuid: item.uuid,
          dish_order_quantity: item.quantity,
        }));

    if (!items.length) return;

    setIsClosing(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/ticket-settlement/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket_number: closeTable.number,
            is_outside: closeTable.is_outside ?? false,
            items,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errorMessage = extractApiErrorMessage(body) || 'Erro ao fechar mesa';
        throw new Error(errorMessage);
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

  const removeItemQuantity = async (itemId: string, quantity: number) => {
    if (!activeTable) return false;
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/ticket-items/remove/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_number: activeTable.number,
          is_outside: activeTable.is_outside ?? false,
          dish_order_uuid: itemId,
          quantity,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const errorMessage = extractApiErrorMessage(body) || 'Erro ao remover item';
      throw new Error(errorMessage);
    }
    return true;
  };

  const increaseItemQuantity = async (itemId: string, quantity: number) => {
    if (!activeTable) return false;
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/ticket-items/increase/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_number: activeTable.number,
          is_outside: activeTable.is_outside ?? false,
          dish_order_uuid: itemId,
          quantity,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const errorMessage = extractApiErrorMessage(body) || 'Erro ao atualizar item';
      throw new Error(errorMessage);
    }
    return true;
  };

  const removeQuantityFromGroup = async (
    group: GroupedActiveItem,
    quantity: number,
  ) => {
    let remaining = quantity;
    for (const entry of group.entries) {
      if (remaining <= 0) break;
      const amount = Math.min(entry.quantity, remaining);
      if (amount > 0) {
        await removeItemQuantity(entry.uuid, amount);
        remaining = Number((remaining - amount).toFixed(10));
      }
    }
  };

  const handleAdjustGroupQuantity = async (
    groupKey: string,
    type: 'increase' | 'decrease',
  ) => {
    if (!activeTable) return;
    const group = groupedActiveItems.find((item) => item.key === groupKey);
    if (!group) return;
    const step = getDepartmentStep(group.department);

    if (type === 'decrease' && group.totalQuantity <= 0) {
      return;
    }

    setQuantityAdjusting({ key: groupKey, type });
    try {
      if (type === 'decrease') {
        const quantityToRemove = Math.min(step, group.totalQuantity);
        await removeQuantityFromGroup(group, quantityToRemove);
      } else {
        const targetEntry = group.entries[0];
        if (!targetEntry) return;
        await increaseItemQuantity(targetEntry.uuid, step);
      }
      showNotification('Quantidade atualizada', 'success');
      refetch();
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Não foi possível atualizar o item',
        'error',
      );
    } finally {
      setQuantityAdjusting(null);
    }
  };

  const handleRemoveGroup = async (groupKey: string) => {
    if (!activeTable) return;
    const group = groupedActiveItems.find((item) => item.key === groupKey);
    if (!group) return;
    const confirmed = window.confirm(
      `Remover todos os itens de "${group.name}" desta mesa?`,
    );
    if (!confirmed) return;

    setRemovingGroupKey(groupKey);
    try {
      await removeQuantityFromGroup(group, group.totalQuantity);
      showNotification('Item removido', 'success');
      refetch();
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Não foi possível remover o item',
        'error',
      );
    } finally {
      setRemovingGroupKey(null);
    }
  };

  const handleAddItemToTable = async () => {
    if (!activeTable) return;
    if (!selectedDishId) {
      showNotification('Selecione um item do cardápio', 'error');
      return;
    }
    if (!newItemQuantity || newItemQuantity <= 0) {
      showNotification('Informe uma quantidade válida', 'error');
      return;
    }

    setIsAddingItem(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/ticket-items/add/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket_number: activeTable.number,
            is_outside: activeTable.is_outside ?? false,
            dish_uuid: selectedDishId,
            amount: newItemQuantity,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errorMessage = extractApiErrorMessage(body) || 'Erro ao adicionar item';
        throw new Error(errorMessage);
      }

      showNotification('Item adicionado', 'success');
      setNewItemQuantity(1);
      refetch();
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Não foi possível adicionar o item',
        'error',
      );
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleOpenEditTableDialog = (table: OpenTable, event?: ReactMouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setEditingTable(table);
  };

  const handleCloseEditTableDialog = () => {
    if (isUpdatingTableDetails) return;
    setEditingTable(null);
  };

  const handleUpdateTableDetails = async () => {
    const targetTable = editingTable;
    if (!targetTable) return;
    if (typeof editedTableNumber !== 'number' || editedTableNumber <= 0) {
      showNotification('Informe um número de mesa válido.', 'error');
      return;
    }

    setIsUpdatingTableDetails(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/tickets/update/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket_uuid: targetTable.uuid,
            number: editedTableNumber,
            is_outside: editedIsOutside,
          }),
        },
      );

      const body = (await response.json().catch(() => null)) as
        | {
            detail?: string;
            updated?: boolean;
            ticket?: { number?: number; label?: string; is_outside?: boolean };
          }
        | null;

      if (!response.ok) {
        const errorMessage = extractApiErrorMessage(body) || 'Não foi possível atualizar a mesa';
        throw new Error(errorMessage);
      }

      const updated = body?.updated ?? true;
      const message =
        body?.detail ?? (updated ? 'Mesa atualizada com sucesso' : 'Nenhuma alteração aplicada');
      showNotification(message, 'success');

      if (updated) {
        const resolvedNumber =
          typeof body?.ticket?.number === 'number' ? body.ticket.number : editedTableNumber;
        const resolvedIsOutside =
          typeof body?.ticket?.is_outside === 'boolean'
            ? body.ticket.is_outside
            : editedIsOutside;
        const resolvedLabel =
          body?.ticket?.label ?? (resolvedIsOutside ? `R${resolvedNumber}` : String(resolvedNumber));

        setEditingTable((prev) =>
          prev
            ? {
                ...prev,
                number: resolvedNumber,
                is_outside: resolvedIsOutside,
                label: resolvedLabel,
              }
            : prev,
        );

        setActiveTable((prev) => {
          if (!prev) return prev;
          if (prev.uuid !== targetTable.uuid) return prev;
          return {
            ...prev,
            number: resolvedNumber,
            is_outside: resolvedIsOutside,
            label: resolvedLabel,
          };
        });

        if (closeTable && closeTable.uuid === targetTable.uuid) {
          setCloseTable((prev) =>
            prev
              ? {
                  ...prev,
                  number: resolvedNumber,
                  is_outside: resolvedIsOutside,
                  label: resolvedLabel,
                }
              : prev,
          );
        }

        setEditingTable(null);
      }

      refetch();
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Não foi possível atualizar a mesa',
        'error',
      );
    } finally {
      setIsUpdatingTableDetails(false);
    }
  };

  const normalizedTables = useMemo(
    () =>
      tables.map((table) => ({
        ...table,
        label: `Mesa ${
          table.label ?? (table.is_outside ? `R${table.number}` : String(table.number))
        }`,
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Mesas abertas</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleManualRefresh}
            disabled={isRefreshingTables || isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshingTables ? 'animate-spin' : ''}`} />
            {isRefreshingTables ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>

        <div className="space-y-3">
          {normalizedTables.map((table) => {
            const statusBadge = resolveTableStatusBadge(table.status, table.status_label);
            return (
              <Card
                key={table.uuid}
                onClick={() => handleShowItems(table)}
                className="cursor-pointer"
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    <div className="w-1/2">
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-semibold text-foreground">{table.label}</p>
                        {statusBadge?.label ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        ) : null}
                        {canEditTableMetadata ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-[#5c4227]"
                            onClick={(event) => handleOpenEditTableDialog(table, event)}
                            aria-label={`Editar mesa ${table.label}`}
                          >
                            <ArrowUp01 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
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
            );
          })}
          {!normalizedTables.length ? (
            <div className="rounded-xl border border-dashed border-muted/70 bg-white/60 p-4 text-center text-sm text-muted-foreground">
              Nenhuma mesa aberta no momento.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Histórico de fechamentos
        </p>
        <div className="space-y-2">
          {history.length ? (
            history.map((entry) => {
              const isReprintingCurrent = reprintingSettlementId === entry.uuid;
              const isCancelingCurrent =
                isCancellingSettlement && cancelingSettlement?.uuid === entry.uuid;
              const isCanceled = Boolean(entry.canceled);
              const isPartial = Boolean(entry.is_partial);
              const isClosed = !isPartial && !isCanceled;
              const canShowCancel = Boolean(isSuperAdmin && entry.can_cancel && !isCanceled);
              return (
                <div
                  key={entry.uuid}
                  className="flex flex-col gap-1 rounded-lg border border-muted/70 bg-white px-3 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-[#5c4227]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                      <span>Mesa {entry.ticket_label ?? entry.ticket_number}</span>
                        {isCanceled ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                            Cancelado
                          </span>
                        ) : null}
                        {isPartial && !isCanceled ? (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800">
                            Parcial
                          </span>
                        ) : null}
                        {isClosed ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800">
                            Fechada
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs font-normal text-muted-foreground">
                        Fechada por {entry.settled_by} em {formatSettlementDate(entry.created_at)}
                      </p>
                    </div>
                      <div className="flex flex-col items-end gap-1">
                        <span>{currencyFormatter.format(entry.final_value ?? 0)}</span>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => handleOpenHistoryItems(entry)}
                            disabled={!entry.items?.length}
                          >
                            <ReceiptText className="h-3 w-3" />
                            Ver itens
                          </Button>
                          {!isCanceled ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() => handleReprintSettlement(entry.uuid)}
                              disabled={isReprintingCurrent}
                            >
                              <Printer className="h-3 w-3" />
                              {isReprintingCurrent ? 'Reimprimindo...' : 'Reimprimir'}
                            </Button>
                          ) : null}
                          {canShowCancel ? (
                            <Button
                              variant="destructive"
                              size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleOpenCancelDialog(entry)}
                            disabled={isCancelingCurrent}
                          >
                            {isCancelingCurrent ? 'Cancelando...' : 'Cancelar Fechamento'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-muted/70 bg-white/60 px-4 py-4 text-center text-sm text-muted-foreground">
              Nenhum fechamento registrado recentemente.
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={historyItemsDialogOpen}
        onOpenChange={(open) => {
          if (open) return;
          handleCloseHistoryItems();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Itens fechados</DialogTitle>
            <DialogDescription>Itens liquidados no fechamento selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {historyItemsEntry ? (
              <div className="rounded-lg border border-muted/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <p className="text-base font-semibold text-foreground">
                  Mesa {historyItemsEntry.ticket_label ?? historyItemsEntry.ticket_number}
                </p>
                <p>Fechada em {formatSettlementDate(historyItemsEntry.created_at)}</p>
              </div>
            ) : null}
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {groupedHistoryItems.length ? (
                groupedHistoryItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-3 rounded-lg border border-muted/70 bg-white px-3 py-2 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      {item.note ? (
                        <p className="text-xs text-muted-foreground">Observação: {item.note}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#5c4227]">
                        Quantidade: {formatQuantity(item.totalQuantity, item.department)}
                      </p>
                      {item.department ? (
                        <p className="text-xs text-muted-foreground">
                          Destino: {getDepartmentLabel(item.department)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum item registrado para este fechamento.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={itemsDialogOpen} onOpenChange={(open) => (open ? null : handleCloseItems())}>
        <DialogContent className="left-0 top-0 flex h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none border-none bg-background p-0">
          <div className="shrink-0 border-b border-muted bg-background px-4 py-4">
            <DialogHeader>
              <DialogTitle>{activeTable?.label ?? 'Itens da mesa'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Itens atualmente vinculados à mesa.
            </p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#d7c6b4]">
            {canManageItems ? (
              <div className="rounded-lg border border-muted/70 bg-white px-3 py-3 shadow-sm">
                {showAddForm ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Adicionar item</p>
                        <p className="text-xs text-muted-foreground">
                          Selecione um item do cardápio e envie direto para a mesa.
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                    {isMenuLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Spinner size="md" />
                      </div>
                    ) : menuOptions.length ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            className="h-12 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c4227]"
                            value={selectedDishId}
                            onChange={(event) => setSelectedDishId(event.target.value)}
                          >
                            {menuOptions.map((option) => (
                              <option key={option.uuid} value={option.uuid}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            min={0.1}
                            step={0.5}
                            className="w-full sm:w-28"
                            value={newItemQuantity}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setNewItemQuantity(Number.isNaN(value) ? 0 : value);
                            }}
                            placeholder="Qtd."
                          />
                          <Button
                            className="w-full sm:w-auto bg-[#5c4227] hover:bg-[#5c4227]/90"
                            onClick={handleAddItemToTable}
                            disabled={isAddingItem || !activeTable}
                          >
                            {isAddingItem ? 'Adicionando...' : 'Adicionar'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum item do cardápio disponível para adicionar.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Adicionar item</p>
                      <p className="text-xs text-muted-foreground">
                        Use o botão para escolher itens do cardápio.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-[#5c4227] text-[#5c4227] hover:bg-[#5c4227] hover:text-white"
                      onClick={() => setShowAddForm(true)}
                    >
                      Adicionar
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            <div className="space-y-3">
            {groupedActiveItems.length ? (
              groupedActiveItems.map((group) => {
                const isAdjustingCurrent = quantityAdjusting?.key === group.key;
                const disableDecrease =
                  group.totalQuantity <= 0 || isAdjustingCurrent || removingGroupKey === group.key;
                const disableIncrease = isAdjustingCurrent || removingGroupKey === group.key;
                const oldestEntryDate = group.entries.reduce<string | null>((oldest, entry) => {
                  if (!entry.created_at) return oldest;
                  if (!oldest) return entry.created_at;
                  return Date.parse(entry.created_at) < Date.parse(oldest) ? entry.created_at : oldest;
                }, null);
                const timeSinceOrder = oldestEntryDate
                  ? formatElapsedTime(oldestEntryDate, currentTimestamp)
                  : null;

                return (
                  <div
                    key={group.key}
                    className="flex flex-col gap-3 rounded-lg border border-muted/70 bg-white px-3 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">{group.name}</p>
                        {group.note ? (
                          <p className="text-xs text-muted-foreground">Observação: {group.note}</p>
                        ) : null}
                        {timeSinceOrder ? (
                          <p className="text-xs text-muted-foreground">Pedido {timeSinceOrder}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#5c4227]">
                          Quantidade: {formatQuantity(group.totalQuantity, group.department)}
                        </p>
                        {group.department ? (
                          <p className="text-xs text-muted-foreground">
                            Destino: {getDepartmentLabel(group.department)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {canManageItems ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 border-[#5c4227] text-[#5c4227] hover:bg-[#5c4227]/10"
                            onClick={() => handleAdjustGroupQuantity(group.key, 'decrease')}
                            disabled={disableDecrease}
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[48px] text-center text-lg font-semibold text-[#5c4227]">
                            {formatQuantity(group.totalQuantity, group.department)}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 border-[#5c4227] text-[#5c4227] hover:bg-[#5c4227]/10"
                            onClick={() => handleAdjustGroupQuantity(group.key, 'increase')}
                            disabled={disableIncrease}
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveGroup(group.key)}
                          disabled={removingGroupKey === group.key}
                        >
                          {removingGroupKey === group.key ? 'Removendo...' : 'Remover item'}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
                <div className="rounded-xl border border-dashed border-muted/70 bg-white/60 p-4 text-center text-sm text-muted-foreground">
                  Nenhum item vinculado a esta mesa.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingTable)}
        onOpenChange={(open) => {
          if (open) return;
          handleCloseEditTableDialog();
        }}
      >
        <DialogContent className="max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>
              Editar mesa {editingTable?.label ?? (editingTable ? editingTable.number : '')}
            </DialogTitle>
            <DialogDescription>
              Informe o novo número e defina se a comanda pertence à área externa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor="edit-table-number"
              >
                Número da mesa
              </label>
              <Input
                id="edit-table-number"
                type="number"
                min={1}
                value={editedTableNumber === '' ? '' : editedTableNumber}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setEditedTableNumber(Number.isNaN(value) ? '' : value);
                }}
                disabled={!editingTable || isUpdatingTableDetails}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Local
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    !editedIsOutside
                      ? 'border-[#5c4227] bg-[#5c4227] text-white'
                      : 'border-muted text-muted-foreground hover:border-[#5c4227] hover:text-[#5c4227]'
                  }`}
                  aria-pressed={!editedIsOutside}
                  onClick={() => setEditedIsOutside(false)}
                  disabled={!editingTable || isUpdatingTableDetails}
                >
                  Salão
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    editedIsOutside
                      ? 'border-[#5c4227] bg-[#5c4227] text-white'
                      : 'border-muted text-muted-foreground hover:border-[#5c4227] hover:text-[#5c4227]'
                  }`}
                  aria-pressed={editedIsOutside}
                  onClick={() => setEditedIsOutside(true)}
                  disabled={!editingTable || isUpdatingTableDetails}
                >
                  Área externa
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mesas da área externa aparecem como R + número (ex: R3).
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={handleCloseEditTableDialog}
              disabled={isUpdatingTableDetails}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#5c4227] text-white hover:bg-[#5c4227]/90"
              onClick={handleUpdateTableDetails}
              disabled={isUpdateTableDisabled}
            >
              {isUpdatingTableDetails ? 'Salvando...' : 'Atualizar mesa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={(open) => (open ? null : handleCloseCloseDialog())}>
        <DialogContent className="left-0 top-0 flex h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none border-none bg-background p-0">
          <div className="shrink-0 border-b border-muted bg-background px-4 py-4">
            <DialogHeader>
              <DialogTitle>Fechar {closeTable?.label ?? 'mesa'}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#d7c6b4]">
            {canClosePartially && (
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
            )}
            {groupedCloseItems.map((group) => {
              const isGroupActive = canClosePartially ? closeSelectionActive[group.key] : true;
              return (
                <div
                  key={group.key}
                  className={`flex items-center justify-between rounded-lg border border-muted px-3 py-2 ${
                    isGroupActive ? '' : 'opacity-50'
                  }`}
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-3">
                      {canClosePartially ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-5 w-5 accent-[#5c4227]"
                            checked={closeSelectionActive[group.key] ?? false}
                            onChange={() => handleToggleItem(group.key)}
                          />
                          <p className="text-base font-semibold text-foreground">{group.name}</p>
                        </label>
                      ) : (
                        <p className="text-base font-semibold text-foreground">{group.name}</p>
                      )}
                    </div>
                    <p className={`${canClosePartially ? 'pl-7' : ''} text-xs text-muted-foreground`}>
                      Disponível: {group.totalQuantity}
                    </p>
                  </div>
                  {canClosePartially ? (
                    <select
                      className={`h-12 rounded-md border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#5c4227] ${
                        isGroupActive ? '' : 'opacity-50'
                      }`}
                      value={closeSelection[group.key] ?? group.totalQuantity}
                      disabled={!isGroupActive}
                      onChange={(event) => handleSelectionChange(group.key, Number(event.target.value))}
                    >
                      {(() => {
                        const step = group.department === 'bar' ? 1 : 0.5;
                        const options: number[] = [];
                        const max = group.totalQuantity + 1e-9;
                        for (let value = step; value <= max; value += step) {
                          options.push(Number(value.toFixed(2)));
                        }
                        return options;
                      })().map((option) => (
                        <option key={`${group.key}-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              );
            })}
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

      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setCancelDialogOpen(true);
          } else {
            handleCloseCancelDialog();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cancelar fechamento</DialogTitle>
            <DialogDescription>
              Esta ação reabrirá a comanda selecionada e enviará o cancelamento da NFC-e referente a
              este fechamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-muted/70 bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="text-base font-semibold text-foreground">
                Mesa {cancelingSettlement?.ticket_label ?? cancelingSettlement?.ticket_number ?? '—'}
              </p>
              <p>Valor: {currencyFormatter.format(cancelingSettlement?.final_value ?? 0)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="cancel-justification">
                Justificativa do cancelamento
              </label>
              <Textarea
                id="cancel-justification"
                rows={4}
                placeholder="Descreva o motivo do cancelamento"
                value={cancelJustification}
                onChange={(event) => setCancelJustification(event.target.value)}
                disabled={isCancellingSettlement}
              />
              <p className="text-xs text-muted-foreground">
                Informe pelo menos 15 caracteres. A justificativa será enviada junto ao cancelamento
                fiscal.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => handleCloseCancelDialog()}
              disabled={isCancellingSettlement}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancelSettlement}
              disabled={!isCancelJustificationValid || isCancellingSettlement}
            >
              {isCancellingSettlement ? 'Cancelando...' : 'Confirmar cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
