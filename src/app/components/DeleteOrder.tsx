import { Trash2 } from 'lucide-react';
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
import { useOrderContext } from '../../context/OrderContext';

interface DeleteOrderProps {
    dishIndex : number;
}

export default function DeleteOrder({ dishIndex } : DeleteOrderProps) {

	const { dishes, setDishes } = useOrderContext();

	const [open, setOpen] = useState(false);

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const handleDeleteItem = () => {
		setDishes((prevDishes) => 
			prevDishes.filter((_, index) => index !== dishIndex) // Remove o item do índice especificado
		);
	
		setOpen(false);
	};

	const handleItemName = () => {
		const dish = dishes[dishIndex]; // Acessa o prato no índice dishIndex
		return dish ? dish.name : ''; // Retorna o nome ou uma string vazia se o prato não existir
	};
	
	return (

		<>
		
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Remover item"
					onClick={handleClickOpen}
					className="text-red-500 hover:bg-red-50"
				>
                    <Trash2 className="h-5 w-5" />
                </Button>

				<Dialog open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}>
					<DialogContent className="max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>{"Deseja excluir " + handleItemName() + '?'}</DialogTitle>
							<DialogDescription>Confirme a exclusão do item</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleClose}>
								Não
							</Button>
							<Button type="button" variant="destructive" onClick={handleDeleteItem}>
								Sim
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
		
		</>

	)

}
