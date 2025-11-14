import React, { useState } from "react";
import menuItems from "../data/menuItems.json";
import CustomItem from '../components/CustomItem'
import NoteDialog from "./NoteDialog";

export default function Items() {
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
    dishUniqueId: string;
  };

  const handleClickOpen = (items: Item[], category: string) => {
    const itemsWithCategory = items.map((item) => { 
      return { 
        ...item,
        category,
        dishUniqueId: `${item.id}_${Date.now()}`, // Gera um ID único baseado no timestamp
      } 
    });
    setMenuSubItems(itemsWithCategory);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const menuItem : MenuItem [] = menuItems["menu"]

  return (
    <>
      <div className="grid grid-cols-2 gap-2 items-stretch">
        {menuItem.map((menuItem: MenuItem, index) => (
          <button
              key={index}
              type="button"
              onClick={() => handleClickOpen(menuItem.items, menuItem.category)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-[#ead9c7] bg-white p-4 text-left shadow-sm transition hover:border-[#c08a55] hover:shadow"
            >
              <span
                className="h-5 w-1 rounded-full"
                style={{ backgroundColor: menuItem.color }}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#2b160c]">
                      {menuItem.category}
                    </p>
                  </div>
                </div>
              </div>
            </button>
        ))}
        <div className="col-span-2 sm:col-span-1">
          <CustomItem />
        </div>
      </div>
      
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
