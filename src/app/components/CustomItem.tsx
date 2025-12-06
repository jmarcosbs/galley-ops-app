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
import { OrderDish } from '../types/order';

export default function CustomItem() {
	
const { setDishes } = useOrderContext();
const [open, setOpen] = useState(false);
const [nameValue, setNameValue] = useState("");
const [selectValue, setSelectValue] = useState("");
const [foodTypeValue, setFoodTypeValue] = useState("");
const [noteValue, setNoteValue] = useState("");
const [priceValue, setPriceValue] = useState("");

const handleClickOpen = () => {
setOpen(true);
};

const handleClose = () => {
setOpen(false);
};

const handleClickSubItem = (name : string, department : string, note : string, ncm: string, price: number) => {
	const newDish: Dish = {
		id: null,
		custom_dish: {
			name: name,
			price: price,
			ncm: ncm,
			department: department,
		},
		unique_id: `custom_${Date.now()}`, // Gera um ID único baseado no timestamp
		name: name,
		departiment: department, // Usa o departamento passado como argumento
		amount: 1, // Substitua pelo valor correto
		note: note != "" ? note : null, // Inicializa note como null
		category: "Personalizado",
		optionGroups: []
	};

	setDishes((prevDishes: Dish[]) => {
		return [...prevDishes, newDish];
	});

	setNameValue("");
	setSelectValue("");
	setFoodTypeValue("");
	setNoteValue("");
	setPriceValue("");

	handleClose()
};

const normalizedPriceValue = priceValue.replace(',', '.');
const parsedPrice = parseFloat(normalizedPriceValue);
const isPriceValid = Number.isFinite(parsedPrice) && parsedPrice >= 0;

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
						<option value="kitchen">Cozinha</option>
						<option value="bar">Copa</option>
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
						<option value="21069090">Comida</option>
						<option value="22021000">Refrigerante</option>
						<option value="20089900">Suco</option>
						<option value="21069029">Outros</option>
					</select>
					<p className="text-xs text-muted-foreground">Ajuda a indicar a categoria do personalizado.</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="custom-price" className="text-[#5c4227]">
						Preço
					</Label>
					<Input
						id="custom-price"
						value={priceValue}
						onChange={(e) => setPriceValue(e.target.value)}
						placeholder="Ex.: 10.00"
						className="border-[#5c4227]/30 focus-visible:ring-[#5c4227]"
					/>
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
					onClick={() => handleClickSubItem(
						nameValue,
						selectValue,
						noteValue,
						foodTypeValue,
						parsedPrice
					)}
					disabled={!nameValue || !selectValue || !foodTypeValue || !isPriceValid}
				>
					Adicionar
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</>
);
}
