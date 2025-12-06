'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AddOrderDialog } from '@/app/components/AddOrderDialog';
import { useOrderContext } from '../../context/OrderContext';
import { QrCode } from 'lucide-react';

export default function TableNumber() {
  const { tableNumber, setTableNumber, isOutside, setIsOutside } = useOrderContext();

  const handleTableNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTableNumber = event.target.value;
    if (!newTableNumber) {
      setTableNumber(0);
      return;
    }
    const parsedNumber = parseInt(newTableNumber, 10);
    if (!Number.isNaN(parsedNumber)) {
      setTableNumber(parsedNumber);
    }
  };

  const handleQrConfirm = useCallback(
    (code: string) => {
      const parsedNumber = parseInt(code, 10);
      if (!Number.isNaN(parsedNumber)) {
        setTableNumber(parsedNumber);
      }
    },
    [setTableNumber],
  );

  const displayValue = tableNumber === 0 ? '' : String(tableNumber);

  const handleToggleOutside = () => {
    setIsOutside(!isOutside);
  };

  return (
    <section className="space-y-3">
      <Label
        htmlFor="table-number-input"
        className="text-sm font-semibold uppercase tracking-wide text-[#5c4227]"
      >
        Número da mesa
      </Label>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleToggleOutside}
          aria-pressed={isOutside}
          className={`h-14 px-6 font-semibold transition-colors ${
            isOutside
              ? 'border border-[#d34f1d] bg-[#d34f1d] text-white hover:bg-[#b84218]'
              : 'border border-[#5c4227]/50 text-[#5c4227] bg-[#5c4227]/10'
          }`}
        >
          Rua
        </Button>
        <Input
          id="table-number-input"
          type="number"
          inputMode="numeric"
          value={displayValue}
          onChange={handleTableNumberChange}
          placeholder="Ex.: 12"
          className="h-14 flex-1 text-lg font-semibold text-[#5c4227] focus-visible:ring-[#5c4227]"
        />
        <AddOrderDialog
          onConfirm={handleQrConfirm}
          trigger={
            <Button
              type="button"
              className="h-14 w-32 gap-2 bg-[#5c4227] text-white hover:bg-[#4a331d]"
              aria-label="Ler QR code da mesa"
            >
              <QrCode className="h-5 w-5" />
              Ler QR
            </Button>
          }
        />
      </div>
      <p className="text-xs text-[#5c4227]/70">
        Defina a mesa antes de enviar o pedido.
      </p>
    </section>
  );
}
