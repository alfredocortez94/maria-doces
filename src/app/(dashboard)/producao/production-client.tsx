"use client"

import { useState } from "react"
import { PackageCheck, Factory, ArrowRight, ArrowDown, Edit, Trash2, Play } from "lucide-react"
import { toast } from "sonner"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { processProductionBatch, deleteProductionBatch, editProductionBatch } from "@/server/actions/production"
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

  // Edit/Delete State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)

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

  async function handleEditBatch() {
    if (!selectedBatch) return
    setIsSubmitting(true)
    const res = await editProductionBatch(selectedBatch.id, editQuantity)
    setIsSubmitting(false)
    if (res.success) {
      toast.success("Lote atualizado com sucesso! O estoque foi recalculado automagicamente.")
      setIsEditOpen(false)
      setSelectedBatch(null)
    } else {
      toast.error(res.error, { duration: 6000 })
    }
  }

  async function handleDeleteBatch() {
    if (!selectedBatch) return
    setIsSubmitting(true)
    const res = await deleteProductionBatch(selectedBatch.id)
    setIsSubmitting(false)
    if (res.success) {
      toast.success("Lote excluído! Os ingredientes retornaram ao estoque de forma intacta.")
      setIsDeleteOpen(false)
      setSelectedBatch(null)
    } else {
      toast.error(res.error, { duration: 6000 })
    }
  }

  function openEdit(batch: ProductionBatch) {
    setSelectedBatch(batch)
    setEditQuantity(batch.quantityProduced)
    setIsEditOpen(true)
  }

  function openDelete(batch: ProductionBatch) {
    setSelectedBatch(batch)
    setIsDeleteOpen(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Esquerda: Novo Lote */}
      <div className="md:col-span-1">
         <div className="bg-white rounded-xl p-6 text-slate-800 shadow-sm border border-rose-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-rose-500">
               <Factory size={100} />
            </div>
            
            <h3 className="text-xl font-bold mb-1 font-mono text-rose-600">01. NOVA FORNADA</h3>
            <p className="text-sm text-slate-500 mb-6">Aponte a produção feita na cozinha hoje.</p>
            
            <div className="space-y-4 mb-6 relative z-10">
               <div className="space-y-2">
                 <Label className="text-slate-600 font-semibold">🍬 Qual sabor foi feito hoje?</Label>
                 <select
                   value={selectedFlavorId}
                   onChange={(e) => setSelectedFlavorId(e.target.value)}
                   className="w-full h-12 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium hover:border-rose-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors cursor-pointer"
                 >
                   <option value="">-- Selecione o sabor --</option>
                   {flavorsReadyToProduce.map(f => (
                     <option key={f.id} value={f.id}>{f.name}</option>
                   ))}
                 </select>
                 {flavorsReadyToProduce.length === 0 && (
                   <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                     ⚠️ Cadastre uma Ficha Técnica no menu "Sabores & Receitas"
                   </p>
                 )}
               </div>

               {renderPreview && (
                 <div className="space-y-2">
                   <Label className="text-slate-600 font-semibold">Rendimento Resultante (Unidades Reais)</Label>
                   <Input 
                     type="number" 
                     className="bg-slate-50 border-slate-200 h-14 text-2xl font-bold text-rose-600 hover:border-rose-300 focus-visible:ring-rose-500"
                     min={1} 
                     value={batchQuantity || ''} 
                     onChange={(e) => setBatchQuantity(parseInt(e.target.value) || 0)}
                   />
                 </div>
               )}
            </div>

            {renderPreview && (
              <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100 text-sm mb-6 relative z-10 shadow-inner">
                 <h4 className="font-semibold text-rose-800 mb-2">Simulação do Fluxo Automático:</h4>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 text-rose-700">
                       <ArrowDown size={16} className="shrink-0 mt-0.5" />
                       <span className="text-xs">
                         Vamos abater <b> {activeRecipe.items.length} ingredientes </b> na proporção pra {batchQuantity} geladinhos das suas Despensas.
                       </span>
                    </div>
                    <div className="flex items-start gap-2 text-pink-700">
                       <ArrowRight size={16} className="shrink-0 mt-0.5" />
                       <span className="text-xs">
                         Estoque virtual de venda final sobe para <br/> 
                         <b>{(previewFlavor.stock?.quantity || 0) + batchQuantity} un.</b> disponíveis.
                       </span>
                    </div>
                 </div>
              </div>
            )}

            <Button 
               onClick={handleProduce}
               disabled={!renderPreview || isSubmitting || batchQuantity <= 0}
               className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 text-lg relative z-10 shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5"
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
                    <TableHead className="text-right">CMV Cons.</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">
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
                        <TableCell className="text-right font-bold text-rose-600">
                          +{batch.quantityProduced} <span className="text-xs font-normal text-slate-400">un</span>
                        </TableCell>
                        <TableCell className="text-right text-rose-600 font-medium">
                          - {money(batch.totalProductionCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => openEdit(batch)}>
                              <Edit size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => openDelete(batch)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
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
      
      {/* Modais de CRUD */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Quantidade Produzida</DialogTitle>
            <DialogDescription>
              Ao alterar a quantidade de {selectedBatch?.quantityProduced} para outro valor, o estoque de ingredientes e de peças prontas será reajustado (estornado/consumido) automaticamente na diferença.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nova Quantidade Final (exata real do lote)</Label>
            <Input 
              type="number" 
              min={1} 
              className="mt-2 text-lg h-12" 
              value={editQuantity || ''} 
              onChange={e => setEditQuantity(parseInt(e.target.value) || 0)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditBatch} disabled={isSubmitting || editQuantity <= 0}>
              {isSubmitting ? "Recalculando..." : "Salvar Edição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Excluir Lote Inteiro?</DialogTitle>
            <DialogDescription>
              Esta ação devolverá todos os ingredientes recíprocos a <b>{selectedBatch?.quantityProduced} unidades de {selectedBatch?.flavor.name}</b> de volta para a sua Despensa, e removerá as peças do estoque virtual pronto. Processo irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Melhor não</Button>
            <Button variant="destructive" onClick={handleDeleteBatch} disabled={isSubmitting}>
              {isSubmitting ? "Estornando..." : "Sim, Excluir Lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
