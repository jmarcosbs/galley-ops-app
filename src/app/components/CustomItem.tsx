import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrderContext, Dish } from '../../context/OrderContext';

export default function CustomItem() {
const { setDishes } = useOrderContext();
const [open, setOpen] = useState(false);
const [nameValue, setNameValue] = useState("");
const [selectValue, setSelectValue] = useState("");
const [foodTypeValue, setFoodTypeValue] = useState("");
const [noteValue, setNoteValue] = useState("");

const handleClickOpen = () => {
setOpen(true);
};

const handleClose = () => {
setOpen(false);
};

const handleClickSubItem = (name : string, department : string, note : string, foodType: string) => {
	const newDish: Dish = {
		id: 'custom',
		unique_id: `custom_${Date.now()}`, // Gera um ID único baseado no timestamp
		name: name,
		departiment: department, // Usa o departamento passado como argumento
		amount: 1, // Substitua pelo valor correto
		note: note != "" ? note : null, // Inicializa note como null
		category: foodType || null,
		optionGroups: []
	};

	setDishes((prevDishes: Dish[]) => {
		let merged = false;
		const updated = prevDishes.map((dish) => {
			const sameName = (dish.name || '').trim() === (newDish.name || '').trim();
			const sameDept = (dish.departiment || '') === (newDish.departiment || '');
			const sameNote = (dish.note || '') === (newDish.note || '');
			const sameCategory = (dish.category || '') === (newDish.category || '');
			if (sameName && sameDept && sameNote && sameCategory) {
				merged = true;
				return { ...dish, amount: (dish.amount ?? 0) + 1 };
			}
			return dish;
		});
		return merged ? updated : [...updated, newDish];
	});

	setNameValue("");
	setSelectValue("");
	setFoodTypeValue("");
	setNoteValue("");

	handleClose()
};

return (
<>
	<button
		type="button"
		onClick={handleClickOpen}
		className="col-span-2 flex w-full items-center gap-3 rounded-2xl border border-[#ead9c7] bg-white p-4 text-left shadow-sm transition hover:border-[#c08a55] hover:shadow sm:col-span-1"
	>
		<span
			className="h-5 w-1 rounded-full"
			style={{ backgroundColor: '#5c4227' }}
		/>
		<div>
			<p className="text-base font-semibold text-[#2b160c]">Personalizado</p>
			<p className="text-xs text-[#5c4227]/70">Adicionar item manualmente</p>
		</div>
	</button>

	<Dialog open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Pedido personalizado</DialogTitle>
			</DialogHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="custom-name" className="text-[#5c4227]">
						Nome do pedido
					</Label>
					<Input
						id="custom-name"
						required
						value={nameValue}
						onChange={(e) => setNameValue(e.target.value)}
						placeholder="Ex.: Risoto especial"
						className="border-[#5c4227]/30 focus-visible:ring-[#5c4227]"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="custom-destination" className="text-[#5c4227]">
						Selecione o destino
					</Label>
					<select
						id="custom-destination"
						required
						value={selectValue}
						onChange={(e) => setSelectValue(e.target.value)}
						className="h-10 w-full rounded-md border border-[#5c4227]/30 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c4227]"
					>
						<option value="" disabled>
							Escolha uma opção
						</option>
						<option value="cozinha">Cozinha</option>
						<option value="copa">Copa</option>
					</select>
					<p className="text-xs text-muted-foreground">Pra onde vai o pedido?</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="custom-food-type" className="text-[#5c4227]">
						Tipo de alimento
					</Label>
					<select
						id="custom-food-type"
						required
						value={foodTypeValue}
						onChange={(e) => setFoodTypeValue(e.target.value)}
						className="h-10 w-full rounded-md border border-[#5c4227]/30 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c4227]"
					>
						<option value="" disabled>
							Selecione o tipo
						</option>
						<option value="Peixe">Peixe</option>
						<option value="Frango">Frango</option>
						<option value="Carne">Carne</option>
						<option value="Bebida">Bebida</option>
						<option value="Outros">Outros</option>
					</select>
					<p className="text-xs text-muted-foreground">Ajuda a indicar a categoria do personalizado.</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="custom-note" className="text-[#5c4227]">
						Observação
					</Label>
					<Textarea
						id="custom-note"
						required
						value={noteValue}
						onChange={(e) => setNoteValue(e.target.value)}
						placeholder="Detalhes adicionais"
						className="border-[#5c4227]/30 focus-visible:ring-[#5c4227]"
					/>
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={handleClose}>
					Cancelar
				</Button>
				<Button
					type="button"
					className="bg-[#5c4227] hover:bg-[#5c4227]/90"
					onClick={() => handleClickSubItem(nameValue, selectValue, noteValue, foodTypeValue)}
					disabled={!nameValue || !selectValue || !foodTypeValue}
				>
					Adicionar
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</>
);
}
