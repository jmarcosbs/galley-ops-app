"use client"

import { ReactElement, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScanLine } from "lucide-react"

type AddOrderDialogProps = {
  trigger?: ReactElement
  onConfirm?: (code: string) => void
}

export function AddOrderDialog({ trigger, onConfirm }: AddOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scanStatus, setScanStatus] = useState("Aguardando câmera…")
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    if (!open) {
      scannerRef.current?.stop()
      scannerRef.current?.destroy()
      scannerRef.current = null
      setScanStatus("Scanner pausado")
      return
    }

    let isCancelled = false

    const initScanner = async () => {
      try {
        const { default: QrScanner } = await import("qr-scanner")
        QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js"

        if (!videoRef.current || isCancelled) return

        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            if (result?.data) {
              setManualCode(result.data)
              setScanStatus("Código detectado!")
              onConfirm?.(result.data)
              setOpen(false)
            }
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 4,
            videoConstraints: {
              facingMode: { ideal: "environment" },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            returnDetailedScanResult: true,
          } as any
        )

        scannerRef.current = scanner
        await scanner.start()
        setScanStatus("Câmera ativa — aponte o QR code")
      } catch (error) {
        console.error(error)
        setScanStatus("Não foi possível acessar a câmera")
      }
    }

    initScanner()

    return () => {
      isCancelled = true
      scannerRef.current?.stop()
      scannerRef.current?.destroy()
      scannerRef.current = null
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Vincular comanda</DialogTitle>
          <DialogDescription>
            Leia o QR code da comanda ou digite o número manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="manual-code">
              Número da comanda
            </label>
            <Input
              id="manual-code"
              inputMode="numeric"
              placeholder="Ex.: 102"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Leitura via QR code
            </p>
            <div className="relative overflow-hidden rounded-lg border bg-muted">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-52 w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white">
                {scanStatus}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => {
            if(!manualCode) {
              setScanStatus("Informe um número de comanda ou leia o QR code")
              return
            }
            console.log("Comanda selecionada:", manualCode)
            onConfirm?.(manualCode)
            setOpen(false)
          }} disabled={!manualCode}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
