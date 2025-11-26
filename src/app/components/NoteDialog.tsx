'use client';

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ChevronLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Dish, useOrderContext } from '../../context/OrderContext';
import { cn } from '@/lib/utils';

type MenuSubItem = {
  id: string;
  dishUniqueId: string;
  name: string;
  departiment: string;
  description?: string;
  category: string;
  optionGroups: string[][];
};

type NoteDialogProps = {
  menuSubItems: MenuSubItem[];
  openDialog: boolean;
  onClose: () => void;
};

export default function NoteDialog({ menuSubItems, openDialog, onClose }: NoteDialogProps) {
  const { setDishes } = useOrderContext();
  const [selectedItem, setSelectedItem] = useState<MenuSubItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [optionGroups, setOptionGroups] = useState<string[][]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!openDialog) {
      setSelectedItem(null);
      setQuantity(1);
      setOptionGroups([]);
      setSelectedOptions({});
    }
  }, [openDialog]);

  const step = useMemo(() => (selectedItem?.departiment === 'cozinha' ? 0.5 : 1), [selectedItem]);
  const minQuantity = useMemo(() => (selectedItem?.departiment === 'cozinha' ? 0.5 : 1), [selectedItem]);

  const handleSelectItem = (item: MenuSubItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setOptionGroups(item.optionGroups ?? []);
    if (item.departiment === 'cozinha') {
      const defaults = item.optionGroups.reduce<Record<number, string>>((acc, group, index) => {
        if (group.length > 0) acc[index] = group[0];
        return acc;
      }, {});
      setSelectedOptions(defaults);
    } else {
      setSelectedOptions({});
    }
  };

  const increment = () => setQuantity((prev) => Number((prev + step).toFixed(2)));
  const decrement = () =>
    setQuantity((prev) => Number(Math.max(prev - step, minQuantity).toFixed(2)));

  const handleAddDish = () => {
    if (!selectedItem) return;
    const optionsNote = optionGroups
      .map((_, index) => selectedOptions[index])
      .filter(Boolean)
      .join(' | ');

    const newDish: Dish = {
      id: selectedItem.id,
      unique_id: `${selectedItem.id}_${Date.now()}`,
      name: selectedItem.name,
      departiment: selectedItem.departiment,
      amount: quantity,
      note: optionsNote.length ? optionsNote : null,
      category: selectedItem.category,
      optionGroups,
    };

    setDishes((prevDishes) => {
      const updated = [...prevDishes, newDish].sort((a, b) => {
        if (a.category === '🍲 Entradas' && b.category !== '🍲 Entradas') return -1;
        if (a.category !== '🍲 Entradas' && b.category === '🍲 Entradas') return 1;
        if (a.departiment === 'cozinha' && b.departiment === 'copa') return -1;
        if (a.departiment === 'copa' && b.departiment === 'cozinha') return 1;
        if (a.name && b.name) return a.name.localeCompare(b.name);
        return 0;
      });
      return updated;
    });

    setSelectedItem(null);
    onClose();
  };

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Adicionar itens</DialogTitle>
          <DialogDescription>
            {selectedItem ? 'Confirme a quantidade desejada.' : 'Escolha um item para adicionar.'}
          </DialogDescription>
        </DialogHeader>

        {selectedItem ? (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="flex items-center gap-2 text-sm font-semibold text-[#5c4227]"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para o cardápio
            </button>
            <div className="rounded-xl border border-muted bg-muted/30 px-4 py-3">
              <p className="text-base font-semibold text-foreground">{selectedItem.name}</p>
              {selectedItem.description ? (
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
              ) : null}
              <p className="text-xs uppercase text-muted-foreground">{selectedItem.category}</p>
            </div>

            {optionGroups.length > 0 ? (
              <div className="space-y-4">
                {optionGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5c4227]">
                      Escolha {groupIndex + 1}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.map((option, idx) => {
                        const isSelected = selectedOptions[groupIndex] === option;
                        return (
                          <button
                            type="button"
                            key={`${option}-${idx}`}
                            onClick={() =>
                              setSelectedOptions((prev) => ({ ...prev, [groupIndex]: option }))
                            }
                            className={cn(
                              'rounded-full border px-4 py-1 text-sm font-medium transition',
                              isSelected
                                ? 'border-[#5c4227] bg-[#5c4227] text-white'
                                : 'border-[#5c4227]/30 text-[#5c4227] hover:bg-[#f4ece3]',
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-full border border-[#5c4227]/30 bg-white px-4 py-3">
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#5c4227]/40 bg-[#5c4227]/10 text-[#5c4227] transition hover:bg-[#5c4227]/20 disabled:opacity-40"
                onClick={decrement}
                disabled={quantity <= minQuantity}
              >
                <Minus className="h-6 w-6" />
              </button>
              <span className="text-2xl font-semibold text-[#5c4227]">
                {Number.isInteger(quantity) ? quantity : quantity.toFixed(1)}
              </span>
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#5c4227]/40 bg-[#5c4227]/10 text-[#5c4227] transition hover:bg-[#5c4227]/20"
                onClick={increment}
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>

            <Button
              type="button"
              className="w-full bg-[#5c4227] py-5 text-white hover:bg-[#5c4227]/90"
              onClick={handleAddDish}
            >
              Adicionar à mesa
            </Button>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-2">
            {menuSubItems.map((item) => (
              <button
                key={item.dishUniqueId}
                type="button"
                onClick={() => handleSelectItem(item)}
                className="flex w-full items-center justify-between rounded-xl border border-muted/60 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#5c4227]"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
                <span className="text-xs uppercase text-muted-foreground">
                  {item.departiment}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
