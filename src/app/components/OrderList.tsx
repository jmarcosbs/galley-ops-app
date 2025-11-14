'use client'
import React, { useState, useEffect } from 'react';
import Counter from './Counter';
import HandleOrderItem from './HandleOrderItem'; // Updated import to match the casing
import { useOrderContext } from '../context/OrderContext';

function OrderList() {

    const { dishes } = useOrderContext();
    const [ isMounted, setIsMounted ] = useState<boolean>(false);

    useEffect(() => {setIsMounted(true)},[]) // Apenas será true no cliente, evitando discrepância entre SSR e CSR

    if (!isMounted) {
        // Evita a renderização antes que o componente esteja montado no cliente
        return null;
      }

    return (
        <div className="space-y-3">
            {dishes.map((dish, index) => {
                const dishKey = dish.unique_id ? `${dish.unique_id}-${index}` : `${index}`;
                return (
                    <div
                        key={dishKey}
                        className="w-full rounded-xl border border-[#5c4227]/20 bg-white/90 p-4 shadow-sm"
                    >
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <HandleOrderItem dishIndex={index} />
                            </div>

                            <div className="flex items-center gap-3 text-[#5c4227]">
                                <span className="text-3xl font-bold">{dish.amount}</span>
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold">{dish.name}</span>
                                    {dish.note && (
                                        <span className="text-sm text-[#5c422799]">
                                            {dish.note}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="ml-auto flex items-center">
                                <Counter
                                    containerWidth={'30px'}
                                    dishIndex={index}
                                    dishDepartiment={dish.departiment}
                                />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

export default OrderList;
