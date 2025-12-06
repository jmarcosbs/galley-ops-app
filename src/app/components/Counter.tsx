'use client'

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
    const normalizedDepartment = (dishDepartiment ?? '').toLowerCase();
    const isKitchen = normalizedDepartment === "cozinha" || normalizedDepartment === "kitchen";
    const step = isKitchen ? 0.5 : 1;
    const minValue = step;
    const currentAmount = dishes[dishIndex]?.amount ?? 0;

    const incrementCount = () => {
        setDishes((prevDishes: Dish[]) =>
            prevDishes.map((dish, index) =>
                index === dishIndex ? { ...dish, amount: (dish.amount ?? 0) + step } : dish
            )
        );
    };

    const decrementCount = () => {
        setDishes((prevDishes: Dish[]) =>
            prevDishes.map((dish, index) =>
                index === dishIndex ? { ...dish, amount: Math.max((dish.amount ?? 0) - step, minValue) } : dish
            )
        );
    };

    const disableDecrement = currentAmount <= minValue;

    return (
        <div className="flex items-center w-auto">
            <div className="flex flex-col overflow-hidden rounded-lg border border-[#5c4227]/30 bg-white shadow-sm">
                <Button
                    type="button"
                    onClick={incrementCount}
                    aria-label="Aumentar quantidade"
                    className="h-10 w-14 rounded-none border-b border-[#5c4227]/20 bg-[#5c4227]/15 text-[#5c4227] hover:bg-[#5c4227]/25"
                >
                    <Plus className="h-5 w-5" strokeWidth={3} />
                </Button>
                <Button
                    type="button"
                    onClick={decrementCount}
                    disabled={disableDecrement}
                    aria-label="Diminuir quantidade"
                    className="h-10 w-14 rounded-none bg-[#5c4227]/10 text-[#5c4227] hover:bg-[#5c4227]/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Minus className="h-5 w-5" strokeWidth={3} />
                </Button>
            </div>
        </div>
    );
}
