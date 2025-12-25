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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dish, useOrderContext } from '../../context/OrderContext';
import { cn } from '@/lib/utils';
import { SideDishOption } from '../types/menu';

type MenuSubItem = {
  id: string;
  dishUniqueId: string;
  name: string;
  departiment: string;
  isAvailable: boolean;
  description?: string;
  category: string;
  optionGroups: string[][];
  sideDishOptions: SideDishOption[];
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
  const [sideDishOptions, setSideDishOptions] = useState<SideDishOption[]>([]);
  const [selectedSideDishes, setSelectedSideDishes] = useState<Record<number, string>>({});
  const [itemNote, setItemNote] = useState<string>('');

  useEffect(() => {
    if (!openDialog) {
      setSelectedItem(null);
      setQuantity(1);
      setOptionGroups([]);
      setSideDishOptions([]);
      setSelectedSideDishes({});
      setItemNote('');
    }
  }, [openDialog]);

  const step = useMemo(() => (selectedItem?.departiment === 'cozinha' ? 0.5 : 1), [selectedItem]);
  const minQuantity = useMemo(() => (selectedItem?.departiment === 'cozinha' ? 0.5 : 1), [selectedItem]);

  const handleSelectItem = (item: MenuSubItem) => {
    if (!item.isAvailable) return;
    setSelectedItem(item);
    setQuantity(1);
    setOptionGroups(item.optionGroups ?? []);
    setSideDishOptions(item.sideDishOptions ?? []);
    setItemNote('');

    const defaults = (item.sideDishOptions ?? []).reduce<Record<number, string>>(
      (acc, option, index) => {
        const defaultDish = option.default_side_dish;
        if (defaultDish) {
          acc[index] = defaultDish.uuid;
        }
        return acc;
      },
      {},
    );

    setSelectedSideDishes(defaults);
  };

  const increment = () => setQuantity((prev) => Number((prev + step).toFixed(2)));
  const decrement = () =>
    setQuantity((prev) => Number(Math.max(prev - step, minQuantity).toFixed(2)));

  const handleAddDish = () => {
    if (!selectedItem) return;

    const normalizedSideDishes =
      sideDishOptions
        ?.map((option, index) => {
          const selectedUuid =
            selectedSideDishes[index] ||
            option.default_side_dish?.uuid;
          if (!selectedUuid) {
            return null;
          }
          const selected = option.side_dishes.find((sd) => sd.uuid === selectedUuid);
          if (!selected) return null;
          return {
            optionUuid: option.uuid,
            sideDishUuid: selected.uuid,
            name: selected.name,
          };
        })
        .filter(Boolean) ?? [];

    const nonDefaultSideDishes =
      normalizedSideDishes.filter((item) => {
        if (!item) return false;
        const option = sideDishOptions?.find((opt) => opt.uuid === item.optionUuid);
        if (!option) return false;
        const defaultUuid = option.default_side_dish?.uuid;
        if (!defaultUuid) {
          return true;
        }
        return item.sideDishUuid !== defaultUuid;
      }) ?? [];

    const optionsNote = nonDefaultSideDishes
      .map((item) => item?.name)
      .filter(Boolean)
      .join(' | ');

    const combinedNote = [optionsNote, itemNote.trim()].filter(Boolean).join(' | ');

    const newDish: Dish = {
      id: selectedItem.id,
      unique_id: `${selectedItem.id}_${Date.now()}`,
      custom_dish: null,
      name: selectedItem.name,
      departiment: selectedItem.departiment,
      amount: quantity,
      note: combinedNote.length ? combinedNote : null,
      category: selectedItem.category,
      optionGroups,
      sideDishOptions,
      selectedSideDishes: normalizedSideDishes as Dish['selectedSideDishes'],
    };

    setDishes((prevDishes) => {
      const serializeSideDishes = (items?: Dish['selectedSideDishes']) =>
        JSON.stringify(
          (items ?? [])
            .map((item) => `${item.optionUuid}-${item.sideDishUuid}`)
            .sort(),
        );

      const targetKey = `${newDish.id}|${newDish.note ?? ''}|${serializeSideDishes(newDish.selectedSideDishes)}`;
      let merged = false;

      const mergedDishes = prevDishes.map((dish) => {
        const currentKey = `${dish.id}|${dish.note ?? ''}|${serializeSideDishes(dish.selectedSideDishes)}`;
        if (currentKey === targetKey) {
          merged = true;
          return {
            ...dish,
            amount: (dish.amount ?? 0) + (newDish.amount ?? 0),
          };
        }
        return dish;
      });

      const updatedList = merged ? mergedDishes : [...mergedDishes, newDish];

      return updatedList.sort((a, b) => {
        if (a.category === '🍲 Entradas' && b.category !== '🍲 Entradas') return -1;
        if (a.category !== '🍲 Entradas' && b.category === '🍲 Entradas') return 1;
        if (a.departiment === 'cozinha' && b.departiment === 'copa') return -1;
        if (a.departiment === 'copa' && b.departiment === 'cozinha') return 1;
        if (a.name && b.name) return a.name.localeCompare(b.name);
        return 0;
      });
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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

            {sideDishOptions.length > 0 ? (
              <div className="space-y-4">
                {sideDishOptions.map((option, groupIndex) => (
                  <div key={option.uuid ?? groupIndex} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5c4227]">
                      Escolha {groupIndex + 1}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {option.side_dishes.map((item) => {
                        const isSelected = selectedSideDishes[groupIndex] === item.uuid;

                        return (
                          <button
                            type="button"
                            key={item.uuid}
                            onClick={() => {
                              setSelectedSideDishes((prev) => ({
                                ...prev,
                                [groupIndex]: item.uuid,
                              }));
                            }}
                            className={cn(
                              'rounded-full border px-4 py-1 text-sm font-medium transition',
                              isSelected
                                ? 'border-[#5c4227] bg-[#5c4227] text-white'
                                : 'border-[#5c4227]/30 text-[#5c4227] hover:bg-[#f4ece3]',
                            )}
                          >
                            {item.name}
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
                <Minus className="h-6 w-6" strokeWidth={3} />
              </button>
              <span className="text-2xl font-semibold text-[#5c4227]">
                {Number.isInteger(quantity) ? quantity : quantity.toFixed(1)}
              </span>
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#5c4227]/40 bg-[#5c4227]/10 text-[#5c4227] transition hover:bg-[#5c4227]/20"
                onClick={increment}
              >
                <Plus className="h-6 w-6" strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-note" className="text-sm font-medium text-[#5c4227]">
                Observação do item
              </Label>
              <Textarea
                id="item-note"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Ex.: sem cebola, bem passado..."
                className="border-[#5c4227]/30 focus-visible:ring-[#5c4227]"
              />
              <p className="text-xs text-muted-foreground">
                Essa observação será enviada junto com o item.
              </p>
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
                disabled={!item.isAvailable}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border border-muted/60 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#5c4227]",
                  !item.isAvailable && "cursor-not-allowed opacity-40 hover:border-muted/60"
                )}
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
