import React, { useState } from "react";
import CustomItem from '../components/CustomItem'
import NoteDialog from "./NoteDialog";
import { useMenu } from "../hooks/useMenu";
import { MenuCategory, MenuDish, SideDishOption } from "../types/menu";
import { Spinner } from "@/components/ui/spinner";

type MenuSubItemType = {
  id: string;
  name: string;
  departiment: string;
  description?: string;
  isAvailable: boolean;
  category: string;
  dishUniqueId: string;
  optionGroups: string[][];
  sideDishOptions: SideDishOption[];
};

export default function Items() {
  const [openDialog, setOpenDialog] = useState(false); // Controle do estado do diálogo
  const [menuSubItems, setMenuSubItems] = useState<MenuSubItemType[]>([]); // Subitens para o diálogo
  const { menu, isLoading } = useMenu();

  const normalizeColor = (color: string) => (color.startsWith('#') ? color : `#${color}`);
  const normalizeDepartment = (department?: string) =>
    department === 'bar' ? 'copa' : 'cozinha';

  const handleClickOpen = (items: MenuDish[], categoryName: string) => {
    const itemsWithCategory = items.map((item) => {
      return {
        id: item.uuid,
        name: item.name,
        departiment: normalizeDepartment(item.department),
        isAvailable: item.is_available,
        description: item.description,
        category: categoryName,
        optionGroups: (item.side_dish_options ?? []).map((group) =>
          (group.side_dishes ?? []).map((sideDish) => sideDish.name)
        ),
        sideDishOptions: item.side_dish_options ?? [],
        dishUniqueId: `${item.uuid}_${Date.now()}`, // Gera um ID único baseado no timestamp
      };
    });
    setMenuSubItems(itemsWithCategory);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const menuItemsList: MenuCategory[] = menu;

  if (isLoading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!menuItemsList.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ead9c7] bg-white/60 p-6 text-center text-sm text-[#5c4227]/80">
        Nenhum item disponível no cardápio.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 items-stretch">
        {menuItemsList.map((menuItem: MenuCategory, index) => (
          <button
              key={index}
              type="button"
              onClick={() => handleClickOpen(menuItem.items, menuItem.category.name)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-[#ead9c7] bg-white p-4 text-left shadow-sm transition hover:border-[#c08a55] hover:shadow"
            >
              <span
                className="h-5 w-1 rounded-full"
                style={{ backgroundColor: normalizeColor(menuItem.category.color) }}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#2b160c]">
                      {menuItem.category.name}
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
