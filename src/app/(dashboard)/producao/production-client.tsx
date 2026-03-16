"use client"

import { useState } from "react"
import { PackageCheck, Factory, Play, ArrowRight, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { processProductionBatch } from "@/server/actions/production"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Flavor, ProductionBatch } from "@/types/domain"

const PAGE_SIZE = 15
const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

export function ProductionClient({ 
  initialHistory, 
  flavorsReadyToProduce 
}: { 
  initialHistory: ProductionBatch[]
  flavorsReadyToProduce: Flavor[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>("")
  const [batchQuantity, setBatchQuantity] = useState<number>(1)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // O "Mock" da predição pra mostrar na UI pro usuário não ter medo.
  const previewFlavor = flavorsReadyToProduce.find(f => f.id === selectedFlavorId)
  const activeRecipe = previewFlavor?.recipes?.[0]
  const renderPreview = !!(previewFlavor && activeRecipe)

  async function handleProduce() {
    if(!selectedFlavorId) return toast.error("Selecione um sabor")
    if(batchQuantity <= 0) return toast.error("A quantidade final não pode ser zero.")
    setIsSubmitting(true)
    const res = await processProductionBatch(selectedFlavorId, batchQuantity, "Apontamento via App")
    setIsSubmitting(false)
    if(res.success) {
      toast.success("Produção finalizada! Estoque de ingredientes reduzido. ✅")
      setSelectedFlavorId("")
      setBatchQuantity(1)
    } else {
      toast.error(res.error, { duration: 6000 })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Esquerda: Novo Lote */}
      <div className="md:col-span-1">
         <div className="bg-slate-900 rounded-xl p-6 text-slate-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Factory size={100} />
            </div>
            
            <h3 className="text-xl font-bold mb-1 font-mono text-pink-400">01. NOVA FORNADA</h3>
            <p className="text-sm text-slate-400 mb-6">Aponte a produção feita na cozinha hoje.</p>
            
            <div className="space-y-4 mb-6 relative z-10">
               <div className="space-y-2">
                 <Label className="text-slate-300">Sabor (Requer Ficha Técnica ativa) </Label>
                 <Select value={selectedFlavorId} onValueChange={(val) => { if(val) setSelectedFlavorId(val) }}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 h-12 relative text-left p-3">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {flavorsReadyToProduce.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                      {flavorsReadyToProduce.length === 0 && (
                        <SelectItem value="none" disabled>Nenhum sabor com ficha ativa</SelectItem>
                      )}
                    </SelectContent>
                 </Select>
               </div>

               {renderPreview && (
                 <div className="space-y-2">
                   <Label className="text-slate-300">Rendimento Resultante (Unidades Reais)</Label>
                   <Input 
                     type="number" 
                     className="bg-slate-800 border-slate-700 h-14 text-2xl font-bold text-pink-400"
                     min={1} 
                     value={batchQuantity} 
                     onChange={(e) => setBatchQuantity(parseInt(e.target.value) || 1)}
                   />
                 </div>
               )}
            </div>

            {renderPreview && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-sm mb-6 relative z-10">
                 <h4 className="font-semibold text-slate-300 mb-2">Simulação do Fluxo Automático:</h4>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 text-rose-300">
                       <ArrowDown size={16} className="shrink-0 mt-0.5" />
                       <span className="text-xs">
                         Vamos abater <b> {activeRecipe.items.length} ingredientes </b> na proporção pra {batchQuantity} geladinhos das suas Despensas (almoxarifado).
                       </span>
                    </div>
                    <div className="flex items-start gap-2 text-pink-300">
                       <ArrowRight size={16} className="shrink-0 mt-0.5" />
                       <span className="text-xs">
                         O Estoque virtual pronto do Produto vai para <br/> 
                         <b>{(previewFlavor.stock?.quantity || 0) + batchQuantity} un.</b> disponíveis para vender na rua.
                       </span>
                    </div>
                 </div>
              </div>
            )}

            <Button 
               onClick={handleProduce}
               disabled={!renderPreview || isSubmitting}
               className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-bold gap-2 text-lg relative z-10 shadow-lg shadow-pink-900/50"
            >
              {isSubmitting ? "Registrando..." : "Processar Baixa Estoque"} <Play size={18} fill="currentColor" />
            </Button>
         </div>
      </div>

      {/* Direita: Historico */}
      <div className="md:col-span-2">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <PackageCheck className="text-slate-500" />
              <h3 className="font-semibold text-slate-800">Histórico de Ordens Produzidas</h3>
           </div>
           
           <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white sticky top-0 shadow-sm z-10">
                    <TableHead>Data Produção</TableHead>
                    <TableHead>Sabor</TableHead>
                    <TableHead className="text-right">Un. Feitas</TableHead>
                    <TableHead className="text-right">CMV Consumido (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                        <PackageCheck size={28} className="mx-auto mb-2 opacity-30" />
                        Nenhum lote produzido. Faça a primeira fornada ao lado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialHistory.slice(0, visibleCount).map((batch) => (
                      <TableRow key={batch.id} className="hover:bg-rose-50/30">
                        <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                          {format(new Date(batch.date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{batch.flavor.name}</TableCell>
                        <TableCell className="text-right font-bold text-pink-600">
                          +{batch.quantityProduced} <span className="text-xs font-normal text-slate-400">un</span>
                        </TableCell>
                        <TableCell className="text-right text-rose-600 font-medium">
                          - {money(batch.totalProductionCost)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {/* Load More */}
              {visibleCount < initialHistory.length && (
                <div className="p-3 border-t border-slate-100 text-center">
                  <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
                    Ver mais ({initialHistory.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
            </div>
         </div>
      </div>
      
    </div>
  )
}
