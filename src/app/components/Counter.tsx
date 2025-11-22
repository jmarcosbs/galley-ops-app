'use client'

import { useState } from 'react';
import { Dish, useOrderContext } from '../../context/OrderContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface CounterProps {
    containerWidth: string;
    dishIndex: number; // Altere para dishIndex se esse for o nome que você quer usar
    dishDepartiment: string | null;
}

export default function Counter({ containerWidth, dishIndex, dishDepartiment }: CounterProps) {

    const { dishes, setDishes } = useOrderContext();

    // Obtenha o valor de amount do prato específico no contexto
    const currentDish = dishes[dishIndex];
    const initialAmount = currentDish ? currentDish.amount : 0;

    // Use o valor de initialAmount como valor inicial para o estado count
    const [count, setCount] = useState(() => initialAmount);

    const incrementCount = () => {

        setCount((prev) => (prev ? prev : 0) + (dishDepartiment == "cozinha" ? 0.5 : 1));
        setDishes((prevDishes: Dish[]) =>
            prevDishes.map((dish, index) =>
                index === dishIndex ? { ...dish, amount: (dish.amount ?? 0) + (dishDepartiment == "cozinha" ? 0.5 : 1) } : dish
            )
        );
    };

    const decrementCount = () => {
        setCount((prev) => Math.max((prev ? prev : 0) - (dishDepartiment == "cozinha" ? 0.5 : 1), 0.5));
        setDishes((prevDishes: Dish[]) =>
            prevDishes.map((dish, index) =>
                index === dishIndex ? { ...dish, amount: Math.max((dish.amount ?? 0) - (dishDepartiment == "cozinha" ? 0.5 : 1), 0) } : dish
            )
        );
    };

    const isKitchen = dishDepartiment === "cozinha";
    const minValue = isKitchen ? 0.5 : 1;
    const disableDecrement = (count ?? 0) <= minValue;

    return (
        <div className="flex flex-row items-center" style={{ width: containerWidth }}>
            <div className="flex w-full flex-col overflow-hidden rounded-md border border-[#5c4227]/30 bg-[#5c4227]/10">
                <Button
                    type="button"
                    onClick={incrementCount}
                    className="h-9 w-full rounded-none border-b border-[#5c4227]/20 bg-[#5c4227]/20 text-[#5c4227] hover:bg-[#5c4227]/30"
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    onClick={decrementCount}
                    disabled={disableDecrement}
                    className="h-9 w-full rounded-none bg-[#5c4227]/20 text-[#5c4227] hover:bg-[#5c4227]/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Minus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
