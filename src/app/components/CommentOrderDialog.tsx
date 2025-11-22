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
import menuItems from "../data/menuItems.json";
import { cn } from '@/lib/utils';

interface Item {
    id: number;
    name: string;
    departiment: string;
    description?: string;
}

interface Option {
    category: string;
    departiment: string;
    options: string[][];
    color: string;
    items: Item[];
}

const menu: Option[] = menuItems["menu"];

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

    useEffect(() => {
        if (props.openDialog) {
            setTempNote(props.note || ''); // Reseta `tempNote` ao abrir o diálogo
            setSelectedOptions({}); // Reseta as opções selecionadas ao abrir o diálogo
        }
    }, [props.openDialog, props.note]);

    const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTempNote(event.target.value); // Atualiza a observação temporária
    };

    const handleAddNote = () => {
        const finalNote = tempNote + (Object.keys(selectedOptions).length > 0 
            ? ` - ${Object.values(selectedOptions).join(' e ')}` 
            : '');
        
        if (finalNote.length > 0) {
            setDishes((prevDishes) =>
                prevDishes.map((dish) =>
                    dish.unique_id === props.dishUniqueId ? { ...dish, note: finalNote } : dish
                )
            );
        }

        props.onClose();
        setTempNote('');
    };

    function getCategoryByItemId(itemId: number): string[][] | null {
        for (const option of menu) {
            const item = option.items.find(item => item.id === itemId);
            if (item) {
                return option.options;
            }
        }
        return null; // Retorna null caso o item não seja encontrado
    }

    function getDishId(): number {
        const dish = dishes.find((dish) => dish.unique_id === props.dishUniqueId);
        return dish ? dish.id : 0;
    }

    const itemOptions: string[][] | null = getCategoryByItemId(getDishId());

    const handleOptionChange = (option: string, groupIndex: number) => {
        setSelectedOptions(prevSelected => ({
            ...prevSelected,
            [groupIndex]: option, // Armazena a seleção para cada grupo
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
                                {option.map((item, idx) => {
                                    const isSelected = selectedOptions[groupIndex] === item;
                                    return (
                                        <button
                                            type="button"
                                            key={`${item}-${idx}`}
                                            onClick={() => handleOptionChange(item, groupIndex)}
                                            className={cn(
                                                "rounded-full border px-3 py-1 text-sm font-medium transition",
                                                isSelected
                                                    ? "border-[#5c4227] bg-[#5c4227] text-white"
                                                    : "border-[#5c4227]/30 text-[#5c4227] hover:bg-[#f4ece3]"
                                            )}
                                        >
                                            {item}
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
