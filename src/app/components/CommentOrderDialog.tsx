import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button, Radio, RadioGroup, FormControlLabel, FormLabel } from '@mui/material';
import { useOrderContext, Dish } from '../context/OrderContext';
import menuItems from "../data/menuItems.json";

interface Item {
    id: number;
    name: string;
    departiment: string;
    description?: string;
}

interface Option {
    category: string;
    departiment: string;
    options: string[][]; // Aqui será um array de arrays de strings
    color: string;
    items: Item[];
}

const menu: Option[] = menuItems["menu"];

interface CommentOrderProps {
    dishIndex: number;
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

    const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTempNote(event.target.value); // Atualiza a observação temporária
    };

    const handleAddNote = () => {
        // Adiciona as opções selecionadas ao tempNote
        const finalNote = tempNote + (Object.keys(selectedOptions).length > 0 
            ? ` - ${Object.values(selectedOptions).join(' e ')}` 
            : '');
        
        if (finalNote.length > 0) {
            setDishes((prevDishes) =>
                prevDishes.map((dish, index) =>
                    index === props.dishIndex ? { ...dish, note: finalNote } : dish
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
        const dish = dishes.find((dish, index) => index === props.dishIndex);
        return dish ? dish.id : 0;
    }

    const itemOptions: string[][] | null = getCategoryByItemId(getDishId());

    // Função para atualizar a opção selecionada
    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>, option: string, groupIndex: number) => {
        setSelectedOptions(prevSelected => ({
            ...prevSelected,
            [groupIndex]: option, // Armazena a seleção para cada grupo de rádio
        }));
    };

    return (
        <Dialog open={props.openDialog} onClose={props.onClose}>
            <DialogTitle>Adicionar observação</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Adicione uma observação no item.
                </DialogContentText>

                <TextField
                    autoFocus={false}
                    required
                    margin="dense"
                    id="note"
                    name="note"
                    label="Observação"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={tempNote}
                    onChange={handleNoteChange}
                />

                {itemOptions?.map((option, groupIndex) => (
                    <div className="mt-[20px]" key={groupIndex}>
                        <FormLabel>{`Opção ${groupIndex + 1}`}</FormLabel>
                        <RadioGroup
                            aria-labelledby="demo-radio-buttons-group-label"
                            value={selectedOptions[groupIndex] || ""} // Valor atual selecionado
                            onChange={(event) => handleOptionChange(event, event.target.value, groupIndex)} // Atualiza a seleção para o grupo
                            name={`radio-group-${groupIndex}`}
                            className="flex flex-row mt-[5px]"
                        >
                            {option.map((item, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    value={item}
                                    control={<Radio />}
                                    label={item}
                                />
                            ))}
                        </RadioGroup>
                    </div>
                ))}

            </DialogContent>
            <DialogActions>
                <Button sx={{ color: '#5c422799', fontWeight: 'bold' }} onClick={props.onClose}>Sem observação</Button>
                <Button sx={{ color: '#5c4227', fontWeight: 'bold' }} onClick={handleAddNote}>Adicionar</Button>
            </DialogActions>
        </Dialog>
    );
}
