import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderContext } from '../context/OrderContext';
import CommentOrderDialog from './CommentOrderDialog';

interface CommentOrderProps {
    dishUniqueId : string;
}

export default function CommentOrder({ dishUniqueId } : CommentOrderProps) {

    const [open, setOpen] = useState(false);
    const [tempNote, setTempNote] = useState(''); // Estado para a observação temporária
    const { dishes } = useOrderContext();

    const handleClickOpen = () => { 
        const dishIndex = dishes.findIndex(dish => dish.unique_id === dishUniqueId); // Encontra o índice do prato
        if (dishIndex === -1) return; // Se não encontrar, não faz nada
        setTempNote(dishes[dishIndex]?.note || ''); // Inicializa tempNote com a observação existente
        setOpen(true);
    }; 

    const handleClose = () => { 
        setOpen(false);
    }; 


    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Adicionar observação"
                onClick={handleClickOpen}
                className="text-[#5c4227] hover:bg-[#5c4227]/10"
            >
                <MessageCircle className="h-5 w-5" />
            </Button>

            <CommentOrderDialog dishUniqueId={dishUniqueId} openDialog={open} onClose={handleClose} note={tempNote}/>
        </>
    );
}
