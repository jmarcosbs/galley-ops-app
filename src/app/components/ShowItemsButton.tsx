'use client'

import React from 'react'; // {{ edit_1 }}
import { useState } from 'react'
import Items from './Items'
import { Button } from '@/components/ui/button'

export default function ShowItemsButton() {

    const [showItems, setShowItems] = useState(true)

    return (
        <>
            <Button
                className="w-full bg-[#5c4227] py-3 text-base font-semibold hover:bg-[#5c4227]/90"
                onClick={() => setShowItems(!showItems)} // Corrigido para alternar o estado
            >
                {!showItems? 'Adicionar Item' : 'Esconder Items'}
            </Button>

            {showItems && ( // Condicional para mostrar os itens
                <Items />
            )}
        </>
    )

}
