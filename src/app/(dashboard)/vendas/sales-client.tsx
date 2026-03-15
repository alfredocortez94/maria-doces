"use client"

import { useState } from "react"
import { ShoppingCart, Tag, CheckCircle2, XCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { processSaleCheckout, SaleCartItem } from "@/server/actions/sales"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

export function SalesClient({ 
  availableFlavors, 
  recentSales 
}: { 
  availableFlavors: any[], 
  recentSales: any[] 
}) {
  const [cart, setCart] = useState<(SaleCartItem & { name: string, maxQty: number })[]>([])
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [discount, setDiscount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFlavors = availableFlavors.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))

  function addToCart(flavor: any) {
    const existing = cart.find(c => c.flavorId === flavor.id)
    if (existing) {
       if (existing.quantity >= flavor.stock.quantity) return toast.warning("Estoque máximo atingido no carrinho.")
       setCart(cart.map(c => c.flavorId === flavor.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
       setCart([...cart, {
          flavorId: flavor.id,
          name: flavor.name,
          quantity: 1,
          unitSellPrice: flavor.suggestedSellPrice,
          maxQty: flavor.stock.quantity
       }])
    }
  }

  function updateQty(id: string, newQty: number) {
    const item = cart.find(c => c.flavorId === id)
    if(!item) return
    if(newQty > item.maxQty) return toast.warning(`Temos apenas ${item.maxQty} un de ${item.name} disponíveis.`)
    if(newQty <= 0) {
      setCart(cart.filter(c => c.flavorId !== id))
      return
    }
    setCart(cart.map(c => c.flavorId === id ? { ...c, quantity: newQty } : c))
  }

  const brutoTotal = cart.reduce((acc, curr) => acc + (curr.quantity * curr.unitSellPrice), 0)
  const finalTotal = brutoTotal - (discount || 0)

  async function handleCheckout() {
    if(cart.length === 0) return toast.error("Carrinho Vazio")
    setIsSubmitting(true)

    const payload = cart.map(({ flavorId, quantity, unitSellPrice }) => ({ flavorId, quantity, unitSellPrice }))
    const res = await processSaleCheckout(payload, paymentMethod, discount || 0, "Venda PDV")
    
    setIsSubmitting(false)
    if(res.success) {
      toast.success("Venda efetuada! Estoque e Lucros gravados.")
      setCart([])
      setDiscount(0)
    } else {
       toast.error(res.error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
      
      {/* Esquerda: PDV Catálogo Rápido */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
         <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <Input 
                placeholder="Buscar sabor pelo nome para adicionar a venda..." 
                className="pl-10 h-10 bg-white" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4">
            {filteredFlavors.length === 0 ? (
               <div className="text-center py-10 text-slate-400">Nenhum geladinho com estoque pronto encontrado.</div>
            ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {filteredFlavors.map(flavor => (
                   <div 
                     key={flavor.id} 
                     onClick={() => addToCart(flavor)}
                     className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group active:scale-95 bg-white select-none relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 bg-slate-100 text-xs px-2 py-1 font-bold text-slate-600 rounded-bl-lg">
                       Estoque: {flavor.stock.quantity}
                     </div>
                     <h4 className="font-semibold text-slate-800 group-hover:text-emerald-700 select-none mt-2 leading-tight pr-8">
                       {flavor.name}
                     </h4>
                     <p className="text-emerald-600 font-bold mt-2 select-none">{money(flavor.suggestedSellPrice)}</p>
                   </div>
                 ))}
               </div>
            )}
         </div>
      </div>

      {/* Direita: Carrinho e Checkout */}
      <div className="bg-slate-900 rounded-xl flex flex-col h-full ring-1 ring-slate-800 shadow-xl overflow-hidden relative">
         <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between z-10">
            <h3 className="text-emerald-400 font-bold flex items-center gap-2">
               <ShoppingCart size={18} /> Carrinho Atual
            </h3>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-full font-bold">
               {cart.length} Itens
            </span>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10">
            {cart.length === 0 && (
               <div className="text-slate-500 text-sm text-center pt-10">Toque num Sabor para iniciar a venda.</div>
            )}
            
            {cart.map(item => (
               <div key={item.flavorId} className="bg-slate-800 rounded-lg p-3 flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start pr-6">
                    <span className="text-sm font-medium text-slate-200 leading-tight">{item.name}</span>
                    <span className="text-pink-400 font-bold text-sm shrink-0">{money(item.unitSellPrice * item.quantity)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => updateQty(item.flavorId, item.quantity - 1)} className="w-8 h-8 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 font-bold">-</button>
                     <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                     <button onClick={() => updateQty(item.flavorId, item.quantity + 1)} className="w-8 h-8 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 font-bold">+</button>
                     <span className="text-xs text-slate-500 ml-2">x {money(item.unitSellPrice)}</span>
                  </div>

                  <button 
                    onClick={() => updateQty(item.flavorId, 0)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400"
                  >
                    <XCircle size={16} />
                  </button>
               </div>
            ))}
         </div>

         {/* Painel Fechamento */}
         <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4 shrink-0 z-10">
           
           <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                 <Label className="text-slate-400 text-xs mb-1 block">Pagamento</Label>
                 <Select value={paymentMethod} onValueChange={(val) => {if (val) setPaymentMethod(val)}}>
                   <SelectTrigger className="bg-slate-800 border-none text-white h-9">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="PIX">PIX (Rápido)</SelectItem>
                     <SelectItem value="CREDIT">Cartão Crédito</SelectItem>
                     <SelectItem value="DEBIT">Cartão Débito</SelectItem>
                     <SelectItem value="CASH">Dinheiro</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              <div>
                 <Label className="text-slate-400 text-xs mb-1 block">Desconto (R$)</Label>
                 <Input 
                   type="number" step="0.01" value={discount || ''} 
                   onChange={e => setDiscount(parseFloat(e.target.value) || 0)} 
                   className="bg-slate-800 border-none h-9 text-slate-200 text-right"
                 />
              </div>
           </div>
           
           <div className="flex justify-between items-center bg-pink-950 p-3 rounded-lg border border-pink-900">
             <span className="text-pink-200 font-medium">Total a Pagar</span>
             <span className="text-2xl font-bold text-pink-400">{money(finalTotal)}</span>
           </div>

           <Button 
             className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-bold text-lg shadow-lg shadow-pink-900/40"
             disabled={cart.length === 0 || isSubmitting}
             onClick={handleCheckout}
           >
             {isSubmitting ? "Baixando Estoque..." : "Finalizar Compra"} <CheckCircle2 className="ml-2" />
           </Button>
         </div>
      </div>
    </div>
  )
}
