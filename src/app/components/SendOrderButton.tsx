'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';
import { useAuth } from '../hooks/useAuth';
import { useUtils } from '../hooks/useUtils';

interface FeedbackState {
    open: boolean;
    message: string;
    type: 'success' | 'error';
}

type SendOrderResult = { success: true } | { success: false; message: string };

export default function SendOrderButton() {
    const { tableNumber, isOutside, dishes, getOrderAsJson } = useOrderContext();
    const [feedback, setFeedback] = useState<FeedbackState>({ open: false, message: '', type: 'success' });
    const [isSending, setIsSending] = useState(false);
    const { makeAuthenticatedRequest } = useAuth();
    const { showNotification } = useUtils();

    const apiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL
    const fullUrl = `${apiUrl}/api/order/`;    

    const handleSubmit = async () => {
        let errors = '';

        if (!tableNumber) errors += 'Erro: O número da mesa está vazio.\n';
        if (isOutside === undefined) errors += 'Erro: A informação de local (fora/dentro) está ausente.\n';
        if (dishes.length === 0) errors += 'Erro: Nenhum prato foi adicionado.\n';

        const payload = JSON.parse(getOrderAsJson());
        const uuidRegex = /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[1-5][0-9a-fA-F-]{3}-[89abAB][0-9a-fA-F-]{3}-[0-9a-fA-F-]{12}$/;
        const hasInvalidDish = payload.dishes.some(
            (dish: any) => !dish.dish_uuid || !uuidRegex.test(dish.dish_uuid) || !dish.amount
        );
        if (hasInvalidDish) {
            errors += 'Erro: Existem itens inválidos no pedido (itens personalizados ainda não são enviados).\n';
        }

        if (errors) {
            setFeedback({ open: true, message: errors.trim(), type: 'error' });
            return;
        }

        setIsSending(true);
        const result = await sendOrder();
        setIsSending(false);

        if (result.success) {
            setFeedback({ open: true, message: 'Pedido enviado com sucesso!', type: 'success' });
            cleanApp();
        } else {
            setFeedback({
                open: true,
                message: result.message || 'Erro ao enviar pedido.',
                type: 'error',
            });
        }
    };

    const cleanApp = () => {
        localStorage.removeItem('tableNumber'); // Remove o item em vez de definir como ""
        localStorage.removeItem('isOutside'); // Remove o item
        localStorage.removeItem('dishes'); // Remove o item
        localStorage.removeItem('note'); // Remove o item
        setTimeout(() => (window.location.reload()), 2000)
        
    };

    const sendOrder = async (): Promise<SendOrderResult> => {
        const orderData = getOrderAsJson();
    
        try {
            const response = await makeAuthenticatedRequest(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: orderData,
            });
    
            if (response.ok) {
                showNotification('Pedido enviado com sucesso!', 'success');
                return { success: true } as const;
            }

            let errorBody: any = {};
            let errorText = '';
            try {
                errorBody = await response.json();
            } catch (error) {
                try {
                    errorText = await response.text();
                } catch (_err) {
                    // ignore
                }
            }
            console.error('Erro na resposta da API:', errorBody || errorText);
            const detail =
                errorBody?.detail ||
                errorBody?.message ||
                errorText ||
                `Erro HTTP ${response.status}`;
            return { success: false, message: `Erro: ${detail}` } as const;
    
        } catch (error) {
            console.error('Erro ao enviar pedido:', error);
            return { success: false, message: `Erro ao enviar pedido: ${error}` } as const;
        }
    };

    return (
        <>
            <Button
                onClick={handleSubmit}
                aria-label="Enviar pedido"
                className="w-full bg-[#5c4227] py-9 text-lg font-semibold text-white hover:bg-[#5c4227]/90"
            >
                Enviar pedido
            </Button>

            <Dialog open={feedback.open} onOpenChange={(isOpen) => (!isOpen ? setFeedback((prev) => ({ ...prev, open: false })) : null)}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-3 text-[#5c4227]">
                            {feedback.type === 'error' ? (
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            ) : (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            )}
                            <DialogTitle>{feedback.type === 'error' ? 'Atenção' : 'Enviado!'}</DialogTitle>
                        </div>
                        <DialogDescription className="whitespace-pre-line text-[#5c4227]">
                            {feedback.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" onClick={() => setFeedback((prev) => ({ ...prev, open: false }))}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isSending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center gap-3 rounded-lg bg-white px-6 py-5 text-[#5c4227] shadow-lg">
                        <Spinner size="lg" />
                        <p className="text-sm font-medium">Enviando pedido...</p>
                    </div>
                </div>
            )}
        </>
    );
}
