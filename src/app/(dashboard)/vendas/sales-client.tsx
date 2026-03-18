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
  // Paginação do histórico
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
      toast.success(`Venda de ${money(finalTotal)} registrada! 🎉`)
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
              <AlertTriangle className="text-amber-500" size={20} /> Confirmar Venda
            </DialogTitle>
            <DialogDescription>Revise o pedido. O estoque será deduzido imediatamente.</DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm my-2">
            {cart.map(item => (
              <div key={item.flavorId} className="flex justify-between">
                <span className="text-slate-700">{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                <span className="font-medium">{money(item.unitSellPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 text-sm">
                  <span>Desconto</span><span>- {money(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span><span className="text-pink-600">{money(finalTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs items-center gap-1">
                <span>Pagamento</span>
                <span className="flex items-center gap-1">{PAYMENT_LABELS[paymentMethod]?.icon} {PAYMENT_LABELS[paymentMethod]?.label}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Corrigir</Button>
            <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleConfirmedCheckout}>
              <CheckCircle2 size={16} className="mr-2" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs PDV / Histórico */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-4">
        <button
          onClick={() => setActiveTab("pdv")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pdv" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          <ShoppingCart size={14} className="inline mr-2" />Frente de Caixa (PDV)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "history" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          <ClipboardList size={14} className="inline mr-2" />Histórico de Vendas
          <span className="ml-2 bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">{recentSales.length}</span>
        </button>
      </div>

      {/* === ABA: PDV === */}
      {activeTab === "pdv" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[550px] h-[calc(100vh-14rem)] max-h-[900px]">
          {/* Catálogo */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <Input placeholder="Buscar sabor..." className="pl-10 h-10 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredFlavors.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Tag size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum geladinho com estoque disponível.</p>
                  <p className="text-sm mt-1">Registre uma produção para repor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredFlavors.map(flavor => (
                    <div key={flavor.id} onClick={() => addToCart(flavor)}
                      className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-pink-400 hover:shadow-md transition-all group active:scale-95 bg-white select-none relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-slate-100 text-xs px-2 py-1 font-bold text-slate-500 rounded-bl-lg">
                        {flavor.stock?.quantity ?? 0} un
                      </div>
                      <h4 className="font-semibold text-slate-800 group-hover:text-pink-700 mt-2 leading-tight pr-8 text-sm">{flavor.name}</h4>
                      <p className="text-pink-600 font-bold mt-2 select-none text-sm">{money(flavor.suggestedSellPrice)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carrinho */}
          <div className="bg-slate-900 rounded-xl flex flex-col h-full ring-1 ring-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <h3 className="text-pink-400 font-bold flex items-center gap-2"><ShoppingCart size={18} /> Carrinho</h3>
              <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-1 rounded-full font-bold">{totalItens} un</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 && <div className="text-slate-500 text-sm text-center pt-10">Toque num sabor para começar.</div>}
              {cart.map(item => (
                <div key={item.flavorId} className="bg-slate-800 rounded-lg p-3 flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start pr-6">
                    <span className="text-sm font-medium text-slate-200 leading-tight">{item.name}</span>
                    <span className="text-pink-400 font-bold text-sm shrink-0">{money(item.unitSellPrice * item.quantity)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.flavorId, item.quantity - 1)} className="w-7 h-7 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 font-bold text-sm">-</button>
                    <span className="w-8 text-center text-white font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.flavorId, item.quantity + 1)} className="w-7 h-7 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 font-bold text-sm">+</button>
                    <span className="text-xs text-slate-500 ml-1">× {money(item.unitSellPrice)}</span>
                  </div>
                  <button onClick={() => updateQty(item.flavorId, 0)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><XCircle size={15} /></button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">Pagamento</Label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full h-9 px-2 rounded-md bg-slate-800 border-none text-white text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-500"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CREDIT">Cartão de Crédito</option>
                    <option value="DEBIT">Cartão de Débito</option>
                    <option value="CASH">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">Desconto (R$)</Label>
                  <Input type="number" step="0.01" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="bg-slate-800 border-none h-9 text-slate-200 text-right text-sm" placeholder="0,00" />
                </div>
              </div>
              <div className="flex justify-between items-center bg-pink-950 p-3 rounded-lg border border-pink-900">
                <span className="text-pink-200 font-medium text-sm">Total</span>
                <span className="text-xl font-bold text-pink-400">{money(finalTotal)}</span>
              </div>
              <Button className="w-full h-11 bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-lg shadow-pink-900/40"
                disabled={cart.length === 0 || isSubmitting}
                onClick={() => setShowConfirm(true)}>
                {isSubmitting ? "Processando..." : "Finalizar Compra"} <CheckCircle2 size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === ABA: HISTÓRICO === */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <ClipboardList className="text-slate-500" size={18} />
            <h3 className="font-semibold text-slate-800">Histórico de Vendas</h3>
            <span className="ml-auto text-xs text-slate-400">Últimas {recentSales.length} vendas</span>
          </div>
          {recentSales.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma venda registrada.</p>
              <p className="text-sm mt-1">Registre a primeira venda no PDV ao lado.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Itens Vendidos</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total Recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSales.map(sale => (
                    <TableRow key={sale.id} className="hover:bg-rose-50/30">
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {format(new Date(sale.saleDate), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sale.items.map(item => (
                            <span key={item.id} className="bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              {item.quantity}× {item.flavor.name}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          {PAYMENT_LABELS[sale.paymentMethod ?? ""]?.icon}
                          {PAYMENT_LABELS[sale.paymentMethod ?? ""]?.label ?? sale.paymentMethod}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-slate-500 text-sm">
                        {sale.discountAmount > 0 ? `- ${money(sale.discountAmount)}` : "–"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        <span className="flex items-center justify-end gap-1">
                          <ArrowUpRight size={14} />{money(sale.totalAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Load More */}
              {visibleCount < recentSales.length && (
                <div className="p-4 border-t border-slate-100 text-center">
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
