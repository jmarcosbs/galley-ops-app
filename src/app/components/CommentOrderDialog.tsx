import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrderContext } from '../../context/OrderContext';
import type { SelectedSideDish } from '../../context/OrderContext';
import { cn } from '@/lib/utils';
import { SideDishOption } from '../types/menu';

interface CommentOrderProps {
    dishUniqueId: string;
    openDialog: boolean;
    onClose: () => void;
    note?: string;
}

export default function CommentOrderDialog(props: CommentOrderProps) {

    const [tempNote, setTempNote] = useState(''); // Estado para a observação temporária
    const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({}); // Estado para armazenar as opções selecionadas por grupo
    const { dishes, setDishes } = useOrderContext();
    const dish = dishes.find((dish) => dish.unique_id === props.dishUniqueId);

    useEffect(() => {
        if (props.openDialog) {
            setTempNote(props.note || ''); // Reseta `tempNote` ao abrir o diálogo
            const defaults =
                dish?.selectedSideDishes?.reduce<Record<number, string>>((acc, item, index) => {
                    acc[index] = item.sideDishUuid;
                    return acc;
                }, {}) ?? {};
            if (Object.keys(defaults).length === 0) {
                const sideDishDefaults =
                    dish?.sideDishOptions?.reduce<Record<number, string>>((acc, option, index) => {
                        const defaultItem = option.default_side_dish ?? option.side_dishes[0];
                        if (defaultItem) {
                            acc[index] = defaultItem.uuid;
                        }
                        return acc;
                    }, {}) ?? {};
                setSelectedOptions(sideDishDefaults);
            } else {
                setSelectedOptions(defaults);
            }
        }
    }, [props.openDialog, props.note, dish?.selectedSideDishes, dish?.sideDishOptions]);

    const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTempNote(event.target.value); // Atualiza a observação temporária
    };

    const handleAddNote = () => {
        const selectedSideDishes =
            dish?.sideDishOptions?.reduce<SelectedSideDish[]>((acc, option, index) => {
                const selectedUuid =
                    selectedOptions[index] || option.default_side_dish?.uuid || option.side_dishes[0]?.uuid;
                const selected = option.side_dishes.find((item) => item.uuid === selectedUuid);
                if (selected) {
                    acc.push({
                        optionUuid: option.uuid,
                        sideDishUuid: selected.uuid,
                        name: selected.name,
                    });
                }
                return acc;
            }, []) ?? [];

        const finalNote =
            tempNote +
            (selectedSideDishes.length > 0
                ? ` - ${selectedSideDishes.map((item) => item?.name).filter(Boolean).join(' e ')}`
                : '');
        
        setDishes((prevDishes) =>
            prevDishes.map((dish) =>
                dish.unique_id === props.dishUniqueId
                    ? { ...dish, note: finalNote || null, selectedSideDishes }
                    : dish
            )
        );

        props.onClose();
        setTempNote('');
    };

    const itemOptions: SideDishOption[] = dish?.sideDishOptions ?? [];

    const handleOptionChange = (optionUuid: string, groupIndex: number) => {
        setSelectedOptions(prevSelected => ({
            ...prevSelected,
            [groupIndex]: optionUuid, // Armazena a seleção para cada grupo
        }));
    };

    return (
        <Dialog open={props.openDialog} onOpenChange={(isOpen) => (!isOpen ? props.onClose() : null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar observação</DialogTitle>
                    <DialogDescription>
                        Adicione instruções e selecione as opções necessárias.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="item-note" className="text-[#5c4227]">
                            Observação
                        </Label>
                        <Textarea
                            id="item-note"
                            required
                            value={tempNote}
                            onChange={handleNoteChange}
                            placeholder="Ex.: sem cebola"
                            className="min-h-[80px] border-[#5c4227]/30 focus-visible:ring-[#5c4227]"
                        />
                    </div>

                    {itemOptions?.map((option, groupIndex) => (
                        <div className="space-y-2" key={groupIndex}>
                            <p className="text-sm font-medium text-[#5c4227]">
                                {`Opção ${groupIndex + 1}`}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {option.side_dishes.map((item, idx) => {
                                    const isSelected = selectedOptions[groupIndex] === item.uuid;
                                    return (
                                        <button
                                            type="button"
                                            key={`${item.uuid}-${idx}`}
                                            onClick={() => handleOptionChange(item.uuid, groupIndex)}
                                            className={cn(
                                                "rounded-full border px-3 py-1 text-sm font-medium transition",
                                                isSelected
                                                    ? "border-[#5c4227] bg-[#5c4227] text-white"
                                                    : "border-[#5c4227]/30 text-[#5c4227] hover:bg-[#f4ece3]"
                                            )}
                                        >
                                            {item.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={props.onClose}>
                        Sem observação
                    </Button>
                    <Button
                        type="button"
                        className="bg-[#5c4227] hover:bg-[#5c4227]/90"
                        onClick={handleAddNote}
                    >
                        Adicionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
