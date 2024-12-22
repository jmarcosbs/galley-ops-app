import React, { useState } from "react";
import menuItems from "../data/menuItems.json";
import { ListItemText, ListItemButton, Dialog, DialogTitle, List, ListItem, Button } from "@mui/material";
import { useOrderContext, Dish } from '../context/OrderContext';
import CustomItem from '../components/CustomItem'
import NoteDialog from "./NoteDialog";
import CommentOrderDialog from "./CommentOrderDialog";

export default function Items() {
  const { setDishes } = useOrderContext();
  const [openDialog, setOpenDialog] = useState(false); // Controle do estado do diálogo
  const [menuSubItems, setMenuSubItems] = useState<MenuSubItemType[]>([]); // Subitens para o diálogo

  interface MenuItem {
    category: string;
    departiment?: string;
    color: string;
    items: Item[];
  }

  interface Item {
    id: number;
    name: string;
    departiment: string;
    description?: string; // Agora é opcional
  }

  type MenuSubItemType = Item & {
    category: string;
  };

  const handleClickOpen = (items: Item[], category: string) => {
    const itemsWithCategory = items.map((item) => { return { ...item, category } });
    setMenuSubItems(itemsWithCategory);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const menuItem : MenuItem [] = menuItems["menu"]

  return (
    <>
      <List>
        <div className="grid grid-cols-2 gap-1 items-stretch">
          {menuItem.map((menuItem: MenuItem, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={() => handleClickOpen(menuItem.items, menuItem.category)} // Abre o diálogo com os subitens
                sx={{
                  color: "#fff",
                  backgroundColor: "#56422d",
                  borderLeft: `7px ${menuItem.color} solid`,
                  borderRadius: "5px",
                  boxShadow: "3px 3px 5px 0px #5c422730",
                  "&:hover": { backgroundColor: "#56422d" },
                }}
              >
                <ListItemText primary={menuItem.category} />
              </ListItemButton>
            </ListItem>
          ))}
          <CustomItem />
        </div>
      </List>
      
      <NoteDialog menuSubItems={menuSubItems} openDialog={openDialog} onClose={handleClose}/>
    </>
  );
}

// <div className="grid grid-cols-2 gap-1">
    //   {menuItems["menu"].map((menuItem: MenuItem, index) => (
    //     <div className={openIndex === index ? "col-span-2" : "col-span-1"} key={menuItem.category} id={`item-${index}`}>
    //       <List key={menuItem.category}>
    //         <ListItemButton 
    //           sx={{
    //             backgroundColor: menuItem.departiment === "copa" ? '#4d3720' : '#7d654b', // different color for "copa"
    //             color: '#fff',
    //             borderRadius: '5px',
    //             boxShadow: '3px 3px 5px 0px #5c422730',
    //             '&:hover': { backgroundColor: menuItem.departiment === "copa" ? '#362616' : '#5c4227' }}} 
    //           onClick={() => {
    //             handleClickItem(index);
    //           }}
    //         >
    //           <ListItemText primary={menuItem.category} />
    //           {openIndex === index ? <ExpandLess /> : <ExpandMore />}
    //         </ListItemButton>

    //         {menuItem.items.map((subItem: Item) => (
    //           <Collapse key={subItem.id} in={openIndex === index} timeout="auto" unmountOnExit>
    //             <List component="div" disablePadding>
    //               <ListItemButton onClick={() => handleClickSubItem(subItem, menuItem.departiment!)}>
    //                 <ListItemIcon>
    //                   <AddBoxTwoTone />
    //                 </ListItemIcon>
    //                 <ListItemText primary={subItem.name} />
    //               </ListItemButton>
    //             </List>
    //           </Collapse>
    //         ))}
    //       </List>
    //     </div>
    //   ))}
    //   <CustomItem/>
    // </div>