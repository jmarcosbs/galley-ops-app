import React, { useState } from "react";
import {
Dialog,
DialogTitle,
DialogContent,
DialogActions,
Button,
TextField,
FormControl,
InputLabel,
Select,
MenuItem,
FormHelperText
} from "@mui/material";
import { ListItemText, ListItemButton } from "@mui/material";
import { useOrderContext, Dish } from '../context/OrderContext';

export default function CustomItem() {
const { setDishes } = useOrderContext();
const [open, setOpen] = useState(false);
const [nameValue, setNameValue] = useState("");
const [selectValue, setSelectValue] = useState("");
const [noteValue, setNoteValue] = useState("");

const handleClickOpen = () => {
setOpen(true);
};

const handleClose = () => {
setOpen(false);
};

const handleClickSubItem = (name : string, department : string, note : string) => {
	const newDish: Dish = {
	id: 0,
	name: name,
	departiment: department, // Usa o departamento passado como argumento
	amount: 1, // Substitua pelo valor correto
	note: note != "" ? note : null, // Inicializa note como null
	category: null
	};

	setDishes((prevDishes: Dish[]) => { // Specify the type of prevDishes
	const updatedDishes = [...prevDishes, newDish];
	return updatedDishes; // Return the updated array
	});

	setNameValue("");
	setSelectValue("");
	setNoteValue("");

	handleClose()
};

return (
<div className="ml-0 mt-2">
	<ListItemButton
	onClick={handleClickOpen}
	sx={{
		backgroundColor: "#362616",
		color: "#fff",
		borderRadius: "5px",
		boxShadow: "3px 3px 5px 0px #5c422730",
		"&:hover": { backgroundColor: "#24190f" },
	}}
	>
	<ListItemText primary="📝 Personalizado" />
	</ListItemButton>

	<Dialog open={open} onClose={handleClose}>
	<DialogTitle>Pedido personalizado</DialogTitle>
	<DialogContent>
		<FormControl fullWidth margin="dense">
		<TextField
			required
			label="Nome do pedido"
			variant="outlined"
			value={nameValue}
			onChange={(e) => setNameValue(e.target.value)}
		/>
		</FormControl>
		<FormControl fullWidth margin="dense" required variant="outlined">
		<InputLabel>Selecione o destino</InputLabel>
		<Select
			value={selectValue}
			onChange={(e) => setSelectValue(e.target.value)}
			label="Selecione uma Categoria"
		>
			<MenuItem value="cozinha">Cozinha</MenuItem>
			<MenuItem value="copa">Copa</MenuItem>
		</Select>
		<FormHelperText>Pra onde vai o pedido?</FormHelperText>
		</FormControl>
		<FormControl fullWidth margin="dense">
		<TextField
			required
			label="Observação"
			variant="outlined"
			value={noteValue}
			onChange={(e) => setNoteValue(e.target.value)}
		/>
		</FormControl>
	</DialogContent>
	<DialogActions>
		<Button sx={{ color: "#5c422799", fontWeight: "bold" }} onClick={handleClose}>
		Cancelar
		</Button>
		<Button
		sx={{ color: "#5c4227", fontWeight: "bold" }}
		onClick={() => (handleClickSubItem(nameValue, selectValue, noteValue))}
		disabled={!nameValue || !selectValue} // Desabilita o botão se os campos estiverem vazios
		>
		Adicionar
		</Button>
	</DialogActions>
	</Dialog>
</div>
);
}
