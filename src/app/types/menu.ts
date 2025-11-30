export type MenuResponse = {
  menu: MenuCategory[];
};

export type MenuCategory = {
  category: CategoryInfo;
  items: MenuDish[];
};

export type CategoryInfo = {
  uuid: string;
  name: string;
  color: string;
};

export type MenuDish = {
  uuid: string;
  name: string;
  description: string;
  is_available: boolean;
  price: number;
  department?: string;
  side_dish_options: SideDishOption[];
};

export type SideDishOption = {
  uuid: string;
  side_dishes: SideDish[];
  default_side_dish: SideDish | null;
};

export type SideDish = {
  uuid: string;
  name: string;
};
