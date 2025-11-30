'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SideDishOption } from '@/app/types/menu';

export type SelectedSideDish = {
  optionUuid: string;
  sideDishUuid: string;
  name: string;
};

export type Dish = {
  id: string;
  unique_id: string;
  name: string | null;
  departiment: string | null;
  amount: number | null;
  note: string | null;
  category: string | null;
  sideDishOptions?: SideDishOption[];
  selectedSideDishes?: SelectedSideDish[];
  optionGroups?: string[][];
};

interface OrderContextProps {
  tableNumber: number;
  setTableNumber: (tableNumber: number) => void;
  isOutside: boolean;
  setIsOutside: (isOutside: boolean) => void;
  dishes: Dish[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>; // Tipo correto para setDishes
  note: string;
  setNote: (note: string) => void;
  getOrderAsJson: () => string;
}

interface GroupedDishesAcc {
  [key: string]: {
      dish: {
          id: string;
          department: string | null;
          dish_name: string | null;
      };
      amount: number | null;
      dish_note: string | null;
      category: string | null;
      side_dishes?: { side_dish_uuid: string }[];
  };
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tableNumber, setTableNumber] = useState<number>(() => {
    // Recupera os dishes do localStorage ao inicializar, se estiver no cliente
    if (typeof window !== 'undefined') {
      const storedTableNumber = localStorage.getItem('tableNumber');
      return storedTableNumber ? parseInt(storedTableNumber, 10) : 0
    } 
    return 0
  });

  const [dishes, setDishes] = useState<Dish[]>(() => {
    if (typeof window !== 'undefined') {
      const storedDishes = localStorage.getItem('dishes');
      return storedDishes ? JSON.parse(storedDishes) : [];
    }
    return [];
  });
  
  const [isOutside, setIsOutside] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedOutside = localStorage.getItem('isOutside');
      return storedOutside === 'true';
    }
    return false;
  });
  
  const [note, setNote] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('note') || '';
    }
    return '';
  });

  useEffect(() => {
    // Armazena os dishes no localStorage sempre que eles mudam, se estiver no cliente
    if (typeof window !== 'undefined') {
      localStorage.setItem('dishes', JSON.stringify(dishes));
    }
  }, [dishes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tableNumber', String(tableNumber));
    }
  }, [tableNumber]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isOutside', String(isOutside));
    }
  }, [isOutside]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('note', note);
    }
  }, [note]);

  const getOrderAsJson = () => {

    const order_dishes = dishes.map((dish) => ({
      dish_uuid: dish.id,
      amount: dish.amount ?? 0,
      dish_note: dish.note,
      category: dish.category,
      side_dishes: (dish.selectedSideDishes ?? []).map((selected) => ({
        side_dish_uuid: selected.sideDishUuid,
      })),
    }));

    const groupedDishes = order_dishes.reduce<GroupedDishesAcc>((acc, current) => {
      const sideDishesKey = JSON.stringify(current.side_dishes ?? []);
      const key = `${current.dish_uuid}-${current.dish_note || ''}-${sideDishesKey}`;
      if (!acc[key]) {
        acc[key] = {
          dish: {
            id: current.dish_uuid,
            department: null,
            dish_name: null,
          },
          amount: current.amount,
          dish_note: current.dish_note,
          category: current.category,
          side_dishes: current.side_dishes,
        };
      } else {
        acc[key].amount = (acc[key].amount ?? 0) + (current.amount ?? 0);
      }
      return acc;
    }, {});

    const groupedOrderDishes = Object.values(groupedDishes);
    const sortedGroupedOrderDishes = groupedOrderDishes.sort((a, b) => {
      if (a.category === '🍲 Entradas' && b.category !== '🍲 Entradas') return -1;
      if (a.category !== '🍲 Entradas' && b.category === '🍲 Entradas') return 1;
      return 0;
    });

    const normalizedDishes = sortedGroupedOrderDishes.map((dish) => ({
      dish_uuid: dish.dish.id,
      amount: dish.amount,
      dish_note: dish.dish_note,
      side_dishes: dish.side_dishes ?? [],
    }));

    const order = {
      ticket: tableNumber,
      dishes: normalizedDishes,
      general_note: note || null,
    };

    return JSON.stringify(order);
  };

  return (
    <OrderContext.Provider value={{ tableNumber, setTableNumber, isOutside, setIsOutside, dishes, setDishes, getOrderAsJson, note, setNote }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = (): OrderContextProps => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrderContext deve ser usado dentro de um OrderProvider");
  }
  return context;
};
