'use client'
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { SideDishOption } from '@/app/types/menu';
import type { CustomDish, OrderDish, OrderPayload, SideDish } from '@/app/types/order';

export type SelectedSideDish = {
  optionUuid: string;
  sideDishUuid: string;
  name: string;
};

export type Dish = {
  id: string | null; // dish uuid vindo do menu ou custom
  unique_id: string; // identificador único para diferenciar itens iguais
  custom_dish: CustomDish | null;
  name: string;
  departiment: string | null;
  amount: number;
  note: string | null;
  category: string | null;
  optionGroups?: string[][];
  sideDishOptions?: SideDishOption[];
  selectedSideDishes?: SelectedSideDish[];
};

interface OrderContextProps {
  tableNumber: number;
  setTableNumber: (tableNumber: number) => void;
  isOutside: boolean;
  setIsOutside: (isOutside: boolean) => void;
  dishes: Dish[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
  note: string;
  setNote: (note: string) => void;
  getOrderAsJson: () => string;
}

interface GroupedDishesAcc {
  [key: string]: {
      dish: {
          id: string | null;
          department: string | null;
          dish_name: string | null;
          custom_dish: CustomDish | null;
      };
      amount: number | null;
      dish_note: string | null;
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

  const getOrderAsJson = useCallback(() => {

    // Converte os dishes para o formato do payload
    const order_dishes = dishes.map((dish) : OrderDish => ({
      dish_uuid: dish.id || null,
      custom_dish: dish.custom_dish || null,
      amount: dish.amount ?? 0,
      dish_note: dish.note,
      side_dishes: (dish.selectedSideDishes ?? []).map((item) => ({
        side_dish_uuid: item.sideDishUuid,
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
            custom_dish: current.custom_dish || null,
          },
          amount: current.amount,
          dish_note: current.dish_note,
        };
      } else {
        acc[key].amount = (acc[key].amount ?? 0) + (current.amount ?? 0);
      }
      return acc;
    }, {});

    const normalizedDishes : OrderDish[] = Object.values(groupedDishes).map((dish): OrderDish => ({
      dish_uuid: dish.dish.id || null,
      custom_dish: dish.dish.custom_dish || null,
      amount: dish.amount || 1,
      dish_note: dish.dish_note,
      side_dishes: dish.side_dishes ?? [],
    }));

    const order : OrderPayload = {
      ticket: tableNumber,
      dishes: normalizedDishes,
      general_note: note || null,
      is_outside: isOutside,
    };

    return JSON.stringify(order);
  }, [dishes, note, tableNumber, isOutside]);

  const prevDishCountRef = useRef(dishes.length);

  useEffect(() => {
    const previousCount = prevDishCountRef.current;

    const logPayload = () => {
      try {
        const parsed = JSON.parse(getOrderAsJson());
        return parsed;
      } catch (_err) {
        // fallback para manter o log mesmo se houver erro na conversão
        return getOrderAsJson();
      }
    };

    if (dishes.length > previousCount) {
      console.log('[Order] Item adicionado. JSON enviado ao backend:', logPayload());
    } else if (dishes.length < previousCount) {
      console.log('[Order] Item removido. JSON enviado ao backend:', logPayload());
    }

    prevDishCountRef.current = dishes.length;
  }, [dishes, getOrderAsJson]);

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
