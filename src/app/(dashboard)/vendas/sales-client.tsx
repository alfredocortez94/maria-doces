"use client"

import { useState } from "react"
import { ShoppingCart, Tag, CheckCircle2, XCircle, Search, AlertTriangle, ClipboardList, ArrowUpRight, Banknote, CreditCard, Smartphone, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { processSaleCheckout, SaleCartItem } from "@/server/actions/sales"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Flavor, Sale } from "@/types/domain"

const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  PIX: { label: "PIX", icon: <Smartphone size={14} /> },
  CREDIT: { label: "Cartão de Crédito", icon: <CreditCard size={14} /> },
  DEBIT: { label: "Cartão de Débito", icon: <CreditCard size={14} /> },
  CASH: { label: "Dinheiro", icon: <Banknote size={14} /> },
}

const PAGE_SIZE = 10

export function SalesClient({
  availableFlavors,
  recentSales
}: {
  availableFlavors: Flavor[]
  recentSales: Sale[]
}) {
  const [activeTab, setActiveTab] = useState<"pdv" | "history">("pdv")
  const [cart, setCart] = useState<(SaleCartItem & { name: string; maxQty: number })[]>([])
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [discount, setDiscount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filteredFlavors = availableFlavors.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const visibleSales = recentSales.slice(0, visibleCount)

  function addToCart(flavor: Flavor) {
    const existing = cart.find(c => c.flavorId === flavor.id)
    const maxQty = flavor.stock?.quantity || 0
    if (existing) {
      if (existing.quantity >= maxQty) return toast.warning("Estoque máximo atingido no carrinho.")
      setCart(cart.map(c => c.flavorId === flavor.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { flavorId: flavor.id, name: flavor.name, quantity: 1, unitSellPrice: flavor.suggestedSellPrice, maxQty }])
    }
  }

  function updateQty(id: string, newQty: number) {
    const item = cart.find(c => c.flavorId === id)
    if (!item) return
    if (newQty > item.maxQty) return toast.warning(`Apenas ${item.maxQty} un de "${item.name}" disponíveis.`)
    if (newQty <= 0) { setCart(cart.filter(c => c.flavorId !== id)); return }
    setCart(cart.map(c => c.flavorId === id ? { ...c, quantity: newQty } : c))
  }

  const brutoTotal = cart.reduce((acc, c) => acc + c.quantity * c.unitSellPrice, 0)
  const finalTotal = Math.max(0, brutoTotal - (discount || 0))
  const totalItens = cart.reduce((acc, c) => acc + c.quantity, 0)

  async function handleConfirmedCheckout() {
    setShowConfirm(false)
    setIsSubmitting(true)
    const payload = cart.map(({ flavorId, quantity, unitSellPrice }) => ({ flavorId, quantity, unitSellPrice }))
    const res = await processSaleCheckout(payload, paymentMethod, discount || 0, "Venda PDV")
    setIsSubmitting(false)
    if (res.success) {
      toast.success(`Venda de ${money(finalTotal)} registrada!`)
      setCart([])
      setDiscount(0)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <>
      {/* Modal de Confirmação */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} style={{ color: "oklch(0.72 0.14 65)" }} />
              Confirmar Venda
            </DialogTitle>
            <DialogDescription>Revise o pedido. O estoque será deduzido imediatamente.</DialogDescription>
          </DialogHeader>
          <div
            className="rounded-xl p-4 space-y-2 text-sm my-2"
            style={{ background: "oklch(0.96 0.008 75)", border: "1px solid oklch(0.91 0.015 70)" }}
          >
            {cart.map(item => (
              <div key={item.flavorId} className="flex justify-between">
                <span style={{ color: "oklch(0.32 0.04 30)" }}>
                  {item.name}{" "}
                  <span style={{ color: "oklch(0.55 0.02 30)" }}>× {item.quantity}</span>
                </span>
                <span className="font-medium" style={{ color: "oklch(0.28 0.04 30)" }}>
                  {money(item.unitSellPrice * item.quantity)}
                </span>
              </div>
            ))}
            <div
              className="pt-2 mt-2 space-y-1"
              style={{ borderTop: "1px solid oklch(0.88 0.015 70)" }}
            >
              {discount > 0 && (
                <div className="flex justify-between text-sm" style={{ color: "oklch(0.52 0.22 350)" }}>
                  <span>Desconto</span><span>- {money(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span style={{ color: "oklch(0.28 0.04 30)" }}>Total</span>
                <span style={{ color: "oklch(0.52 0.22 350)" }}>{money(finalTotal)}</span>
              </div>
              <div className="flex justify-between text-xs items-center gap-1" style={{ color: "oklch(0.55 0.02 30)" }}>
                <span>Pagamento</span>
                <span className="flex items-center gap-1">
                  {PAYMENT_LABELS[paymentMethod]?.icon}{" "}
                  {PAYMENT_LABELS[paymentMethod]?.label}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Corrigir</Button>
            <Button
              onClick={handleConfirmedCheckout}
              style={{ background: "oklch(0.52 0.22 350)" }}
              className="text-white hover:opacity-90"
            >
              <CheckCircle2 size={16} className="mr-2" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs PDV / Histórico */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit mb-4"
        style={{ background: "oklch(0.93 0.012 70)" }}
      >
        {[
          { key: "pdv", label: "Frente de Caixa (PDV)", icon: <ShoppingCart size={14} /> },
          { key: "history", label: "Histórico de Vendas", icon: <ClipboardList size={14} />, badge: recentSales.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "pdv" | "history")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={activeTab === tab.key
              ? { background: "oklch(0.998 0.004 80)", color: "oklch(0.22 0.04 30)", boxShadow: "0 1px 4px oklch(0.18 0.02 30 / 10%)" }
              : { color: "oklch(0.52 0.02 30)" }
            }
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "oklch(0.88 0.015 70)", color: "oklch(0.42 0.03 30)" }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* === ABA: PDV === */}
      {activeTab === "pdv" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[550px] h-[calc(100vh-14rem)] max-h-[900px]">
          {/* Catálogo */}
          <div
            className="lg:col-span-2 rounded-xl flex flex-col h-full overflow-hidden shadow-sm"
            style={{ background: "oklch(0.998 0.004 80)", border: "1px solid oklch(0.91 0.015 70)" }}
          >
            <div
              className="p-4"
              style={{ borderBottom: "1px solid oklch(0.91 0.015 70)", background: "oklch(0.96 0.008 75)" }}
            >
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: "oklch(0.55 0.03 30)" }}
                />
                <Input
                  placeholder="Buscar sabor..."
                  className="pl-9 h-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ background: "oklch(0.998 0.004 80)" }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredFlavors.length === 0 ? (
                <div
                  className="text-center py-16"
                  style={{ color: "oklch(0.55 0.02 30)" }}
                >
                  <Tag size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum geladinho com estoque disponível.</p>
                  <p className="text-sm mt-1" style={{ color: "oklch(0.62 0.02 30)" }}>
                    Registre uma produção para repor.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredFlavors.map(flavor => (
                    <div
                      key={flavor.id}
                      onClick={() => addToCart(flavor)}
                      className="rounded-xl p-4 cursor-pointer transition-all group active:scale-95 select-none relative overflow-hidden"
                      style={{
                        background: "oklch(0.998 0.004 80)",
                        border: "1px solid oklch(0.91 0.015 70)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.border = "1px solid oklch(0.72 0.18 350 / 60%)"
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px oklch(0.52 0.22 350 / 12%)"
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.border = "1px solid oklch(0.91 0.015 70)"
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow = ""
                      }}
                    >
                      <div
                        className="absolute top-0 right-0 text-xs px-2 py-1 font-bold rounded-bl-lg"
                        style={{
                          background: "oklch(0.93 0.012 70)",
                          color: "oklch(0.45 0.05 65)",
                        }}
                      >
                        {flavor.stock?.quantity ?? 0} un
                      </div>
                      <h4
                        className="font-semibold mt-2 leading-tight pr-8 text-sm transition-colors"
                        style={{ color: "oklch(0.28 0.04 30)", fontFamily: "var(--font-display)" }}
                      >
                        {flavor.name}
                      </h4>
                      <p
                        className="font-bold mt-2 text-sm"
                        style={{ color: "oklch(0.52 0.22 350)" }}
                      >
                        {money(flavor.suggestedSellPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carrinho */}
          <div
            className="rounded-xl flex flex-col h-full shadow-xl overflow-hidden"
            style={{
              background: "linear-gradient(175deg, oklch(0.27 0.10 348) 0%, oklch(0.19 0.07 338) 100%)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          >
            <div
              className="p-4 flex justify-between items-center"
              style={{ borderBottom: "1px solid oklch(1 0 0 / 10%)", background: "oklch(1 0 0 / 4%)" }}
            >
              <h3
                className="font-bold flex items-center gap-2 text-sm"
                style={{ color: "oklch(0.90 0.10 65)", fontFamily: "var(--font-display)" }}
              >
                <ShoppingCart size={16} /> Carrinho
              </h3>
              <span
                className="text-xs px-2 py-1 rounded-full font-bold"
                style={{ background: "oklch(0.76 0.12 65 / 20%)", color: "oklch(0.88 0.10 65)" }}
              >
                {totalItens} un
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 && (
                <div className="text-center pt-10 text-sm" style={{ color: "oklch(1 0 0 / 30%)" }}>
                  Toque num sabor para começar.
                </div>
              )}
              {cart.map(item => (
                <div
                  key={item.flavorId}
                  className="rounded-xl p-3 flex flex-col gap-2 relative"
                  style={{ background: "oklch(1 0 0 / 8%)", border: "1px solid oklch(1 0 0 / 10%)" }}
                >
                  <div className="flex justify-between items-start pr-6">
                    <span className="text-sm font-medium leading-tight" style={{ color: "oklch(0.95 0.01 0)" }}>
                      {item.name}
                    </span>
                    <span className="font-bold text-sm shrink-0" style={{ color: "oklch(0.88 0.10 65)" }}>
                      {money(item.unitSellPrice * item.quantity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.flavorId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg font-bold text-sm transition-colors cursor-pointer"
                      style={{ background: "oklch(1 0 0 / 10%)", color: "oklch(0.90 0.01 0)" }}
                    >−</button>
                    <span className="w-8 text-center font-medium text-sm" style={{ color: "oklch(1 0 0)" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.flavorId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg font-bold text-sm transition-colors cursor-pointer"
                      style={{ background: "oklch(1 0 0 / 10%)", color: "oklch(0.90 0.01 0)" }}
                    >+</button>
                    <span className="text-xs ml-1" style={{ color: "oklch(1 0 0 / 35%)" }}>
                      × {money(item.unitSellPrice)}
                    </span>
                  </div>
                  <button
                    onClick={() => updateQty(item.flavorId, 0)}
                    className="absolute top-2 right-2 transition-colors cursor-pointer"
                    style={{ color: "oklch(1 0 0 / 25%)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.65 0.22 27)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "oklch(1 0 0 / 25%)")}
                  >
                    <XCircle size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div
              className="p-4 space-y-3 shrink-0"
              style={{ borderTop: "1px solid oklch(1 0 0 / 10%)", background: "oklch(1 0 0 / 4%)" }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "oklch(1 0 0 / 45%)" }}>Pagamento</Label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg text-sm cursor-pointer focus:outline-none"
                    style={{
                      background: "oklch(1 0 0 / 10%)",
                      border: "1px solid oklch(1 0 0 / 12%)",
                      color: "oklch(0.95 0.01 0)",
                    }}
                  >
                    <option value="PIX" style={{ background: "#2a1220" }}>PIX</option>
                    <option value="CREDIT" style={{ background: "#2a1220" }}>Cartão de Crédito</option>
                    <option value="DEBIT" style={{ background: "#2a1220" }}>Cartão de Débito</option>
                    <option value="CASH" style={{ background: "#2a1220" }}>Dinheiro</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "oklch(1 0 0 / 45%)" }}>Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={discount || ''}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-9 text-right text-sm"
                    placeholder="0,00"
                    style={{
                      background: "oklch(1 0 0 / 10%)",
                      border: "1px solid oklch(1 0 0 / 12%)",
                      color: "oklch(0.95 0.01 0)",
                    }}
                  />
                </div>
              </div>

              <div
                className="flex justify-between items-center p-3 rounded-xl"
                style={{ background: "oklch(0.76 0.12 65 / 15%)", border: "1px solid oklch(0.76 0.12 65 / 25%)" }}
              >
                <span className="font-medium text-sm" style={{ color: "oklch(0.90 0.10 65)" }}>Total</span>
                <span
                  className="text-xl font-black"
                  style={{ color: "oklch(0.90 0.10 65)", fontFamily: "var(--font-display)" }}
                >
                  {money(finalTotal)}
                </span>
              </div>

              <button
                className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                disabled={cart.length === 0 || isSubmitting}
                onClick={() => setShowConfirm(true)}
                style={{
                  background: "linear-gradient(135deg, oklch(0.52 0.22 350), oklch(0.57 0.22 345))",
                  color: "white",
                  boxShadow: "0 4px 20px oklch(0.52 0.22 350 / 35%)",
                }}
              >
                {isSubmitting ? "Processando..." : "Finalizar Compra"}
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === ABA: HISTÓRICO === */}
      {activeTab === "history" && (
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ background: "oklch(0.998 0.004 80)", border: "1px solid oklch(0.91 0.015 70)" }}
        >
          <div
            className="p-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid oklch(0.91 0.015 70)", background: "oklch(0.96 0.008 75)" }}
          >
            <ClipboardList size={18} style={{ color: "oklch(0.52 0.22 350)" }} />
            <h3
              className="font-semibold"
              style={{ color: "oklch(0.22 0.04 30)", fontFamily: "var(--font-display)" }}
            >
              Histórico de Vendas
            </h3>
            <span className="ml-auto text-xs" style={{ color: "oklch(0.55 0.02 30)" }}>
              Últimas {recentSales.length} vendas
            </span>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-16" style={{ color: "oklch(0.55 0.02 30)" }}>
              <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma venda registrada.</p>
              <p className="text-sm mt-1">Registre a primeira venda no PDV ao lado.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: "oklch(0.96 0.008 75)" }}>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Itens Vendidos</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total Recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSales.map(sale => (
                    <TableRow
                      key={sale.id}
                      style={{ borderBottom: "1px solid oklch(0.93 0.012 70)" }}
                    >
                      <TableCell className="text-sm whitespace-nowrap" style={{ color: "oklch(0.52 0.02 30)" }}>
                        {format(new Date(sale.saleDate), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sale.items.map(item => (
                            <span
                              key={item.id}
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "oklch(0.94 0.06 350 / 50%)", color: "oklch(0.45 0.18 350)" }}
                            >
                              {item.quantity}× {item.flavor.name}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm" style={{ color: "oklch(0.42 0.03 30)" }}>
                          {PAYMENT_LABELS[sale.paymentMethod ?? ""]?.icon}
                          {PAYMENT_LABELS[sale.paymentMethod ?? ""]?.label ?? sale.paymentMethod}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm" style={{ color: "oklch(0.55 0.02 30)" }}>
                        {sale.discountAmount > 0 ? `- ${money(sale.discountAmount)}` : "–"}
                      </TableCell>
                      <TableCell className="text-right font-bold" style={{ color: "oklch(0.42 0.15 160)" }}>
                        <span className="flex items-center justify-end gap-1">
                          <ArrowUpRight size={14} />{money(sale.totalAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {visibleCount < recentSales.length && (
                <div
                  className="p-4 text-center"
                  style={{ borderTop: "1px solid oklch(0.91 0.015 70)" }}
                >
                  <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
                    Ver mais ({recentSales.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
