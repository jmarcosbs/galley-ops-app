import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Bell,
  ChefHat,
  QrCode,
  Receipt,
  Plus,
  CheckCircle2,
} from "lucide-react"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const openTables = [
  {
    id: "mesa-07",
    label: "Mesa 07",
    guests: 4,
    waiter: "Joana Oliveira",
    status: "Pratos principais em preparo",
    lastUpdate: "há 5 minutos",
    total: 268.5,
    highlights: ["2x Camarão grelhado", "1x Vinho branco", "1x Tábua mediterrânea"],
  },
  {
    id: "mesa-02",
    label: "Mesa 02",
    guests: 2,
    waiter: "Carlos Nunes",
    status: "Sobremesas liberadas",
    lastUpdate: "há 12 minutos",
    total: 142.9,
    highlights: ["1x Brownie com sorvete", "2x Café espresso"],
  },
  {
    id: "mesa-11",
    label: "Deck externo 11",
    guests: 6,
    waiter: "Bia Costa",
    status: "Drinks na fila",
    lastUpdate: "há 2 minutos",
    total: 512.0,
    highlights: ["Jarra Spritz", "Ronda de Gin tônica"],
  },
]

const finishedTables = [
  {
    id: "mesa-04",
    label: "Mesa 04",
    total: 389.4,
    payment: "Cartão crédito",
    closedAt: "há 25 minutos",
  },
  {
    id: "mesa-09",
    label: "Balcão 09",
    total: 96.0,
    payment: "Pix",
    closedAt: "há 40 minutos",
  },
  {
    id: "mesa-15",
    label: "Terraço 15",
    total: 612.7,
    payment: "Cartão corporativo",
    closedAt: "há 1 hora",
  },
]

export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="space-y-4">
        <NavigationMenu className="w-full">
          <NavigationMenuList className="w-full flex-wrap justify-between gap-2 p-2">
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle} href="#">
                Overview
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle} href="#">
                Mesas
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </header>

      <section className="space-y-3">
          <Button className="h-16 w-full p-0 text-left text-primary-foreground">
            <span className="flex h-full w-full overflow-hidden rounded-md bg-primary">
              <span className="flex basis-[70%] items-center gap-3 px-6">
                <Plus className="h-5 w-5" />
                <span className="text-lg font-semibold tracking-wide">
                  + Adicionar pedido
                </span>
              </span>
              <span className="flex basis-[30%] items-center justify-center gap-2 border-l border-white/20 bg-primary/90 text-sm font-medium uppercase">
                <QrCode className="h-5 w-5" />
                QR code
              </span>
            </span>
          </Button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Mesas abertas
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {openTables.map((table) => (
            <Card key={table.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Identificação
                  </p>
                  <p className="text-xl font-semibold text-foreground">{table.label}</p>
                </div>
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <Button className="flex-1 items-center gap-2 sm:flex-none sm:px-6">
                    <Plus className="h-4 w-4" />
                    Novo pedido
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none sm:px-4">
                    Fechar mesa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Accordion type="single" collapsible className="w-full rounded-lg border">
          <AccordionItem value="finished">
            <AccordionTrigger>
              Mesas finalizadas ({finishedTables.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {finishedTables.map((table) => (
                  <Card key={table.id} className="bg-muted/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {table.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Encerrada {table.closedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{table.payment}</p>
                        <p className="text-base font-semibold">
                          {currencyFormatter.format(table.total)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Reabrir mesa
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  )
}
