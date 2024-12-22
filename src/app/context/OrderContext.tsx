'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Dish = {
  id: number;
  name: string | null;
  departiment: string | null;
  amount: number | null;
  note: string | null;
  category: string | null;
};

interface OrderContextProps {
  tableNumber: number;
  setTableNumber: (tableNumber: number) => void;
  waiter: string;
  setWaiter: (note: string) => void;
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
          id: number;
          department: string | null;
          dish_name: string | null;
      };
      amount: number | null;
      dish_note: string | null;
      category: string | null;
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

  const [waiter, setWaiter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedWaiter = localStorage.getItem('waiter');
      return storedWaiter || '';
    }
    return '';
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
  
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    // Armazena os dishes no localStorage sempre que eles mudam, se estiver no cliente
    if (typeof window !== 'undefined') {
      localStorage.setItem('dishes', JSON.stringify(dishes));
    }
  }, [dishes]);

  const getOrderAsJson = () => {

    const order_dishes = dishes.map(dish => ({
        dish: {
            id: dish.id,
            department: dish.departiment,
            dish_name: dish.name
        },
        amount: dish.amount,
        dish_note: dish.note,
        category: dish.category // temporary category for sorting
    }));

    //Agrupa os pratos iguais
    const groupedDishes = order_dishes.reduce<GroupedDishesAcc>((acc, current) => {
      const key = current.dish.id + (current.dish_note || '');
      if (!acc[key]) {
          acc[key] = { ...current };
      } else {
          acc[key].amount = (acc[key].amount ?? 0) + (current.amount ?? 0);
      }
      return acc;
  }, {});

    const groupedOrderDishes = Object.values(groupedDishes);
    const sortedGroupedOrderDishes = groupedOrderDishes.sort((a, b) => {
      // First priority: Entradas
      if (a.category === '🍲 Entradas' && b.category !== '🍲 Entradas') return -1;
      if (a.category !== '🍲 Entradas' && b.category === '🍲 Entradas') return 1;
      
      // Second priority: department order (cozinha -> copa)
      if (a.dish.department === 'cozinha' && b.dish.department === 'copa') return -1;
      if (a.dish.department === 'copa' && b.dish.department === 'cozinha') return 1;

      // Third priority: group by dish name within same category/department
      if (a.dish.dish_name && b.dish.dish_name) {
      return a.dish.dish_name.localeCompare(b.dish.dish_name);
      }
      
      return 0;
    });

  const groupedWithOutCategory = sortedGroupedOrderDishes.map(dish => {
    const { category, ...dishWithoutCategory } = dish;
    return dishWithoutCategory;
  });

    const order = {
        table_number: tableNumber,
        waiter: waiter,
        is_outside: isOutside,
        order_note: note,
        order_dishes: groupedWithOutCategory
    };

    console.log(order);
    return JSON.stringify(order);
};

  return (
    <OrderContext.Provider value={{ tableNumber, setTableNumber, waiter, setWaiter, isOutside, setIsOutside, dishes, setDishes, getOrderAsJson, note, setNote }}>
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
