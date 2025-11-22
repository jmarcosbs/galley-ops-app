'use client'
import React, { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOrderContext } from '../../context/OrderContext';


export default function CommentOrder() {

    const { note, setNote } = useOrderContext();

    const handleChange = ( functionNote : string) => {
        setNote(functionNote)
        localStorage.setItem('note', functionNote)
    }

    useEffect(() => {
        const storedNote = localStorage.getItem('note');
        if (storedNote && !note) { // Carrega apenas se `note` ainda estiver vazio
            setNote(storedNote);
        }
    }, [setNote, note]);

    return (
        <div className="space-y-2">
            <Label htmlFor="general-note" className="text-[#5c4227] text-sm font-semibold uppercase tracking-wide">
                Observação geral
            </Label>
            <Textarea
                id="general-note"
                required
                value={note || ""}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Informações adicionais do pedido"
                className="min-h-[100px] border-[#5c4227]/40 focus-visible:ring-[#5c4227]"
            />
        </div>
    );
}
