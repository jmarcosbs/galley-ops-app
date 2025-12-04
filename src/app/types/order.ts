export type SideDish = {
    side_dish_uuid: string;
}

export type CustomDish = {
    name: string;
    price: number;
    ncm: string;
    department: string;
}

export type OrderDish = {
    dish_uuid: string | null;
    custom_dish: CustomDish | null;
    amount: number;
    dish_note: string | null;
    side_dishes: SideDish[] | null;
}

export type OrderPayload = {
    ticket: number;
    dishes: OrderDish[];
    general_note: string | null;
}