"use client"

import { useState } from "react"
import { Plus, Trash2, Edit, Save, Calculator, AlertTriangle, ArrowRight, XCircle, FileText, CheckCircle2, IceCream2, AlertCircle, Settings2 } from "lucide-react"
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
import { createFlavor, toggleFlavorActive, saveActiveRecipeSnapshot } from "@/server/actions/flavors"

// Helper money formatter
const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

export function FlavorsClient({ 
  initialFlavors, 
  ingredientsList 
}: { 
  initialFlavors: any[], 
  ingredientsList: any[] 
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRecipeOpen, setIsRecipeOpen] = useState(false)
  const [selectedFlavor, setSelectedFlavor] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Builder State para a Ficha Técnica
  const [recipeItems, setRecipeItems] = useState<{ingredientId: string, quantity: number, name: string, unitCost: number, unitMeasure: string}[]>([])
  const [yieldUnits, setYieldUnits] = useState<number>(1)

  // --------------------------------------------------------
  // Ações Sabor Novo
  // --------------------------------------------------------
  async function handleCreate(formData: FormData) {
    setIsSubmitting(true)
    const res = await createFlavor(formData)
    setIsSubmitting(false)
    if (res.success) {
      toast.success("Sabor Criado! Agora vá em Configurar Ficha para dar vida aos custos.")
      setIsCreateOpen(false)
    } else {
      toast.error(res.error)
    }
  }

  // --------------------------------------------------------
  // Ações Ficha Técnica Iterativa
  // --------------------------------------------------------
  function openRecipeBuilder(flavor: any) {
    setSelectedFlavor(flavor)
    
    // Se ele já tiver uma "active" recipe, carrega no state.
    const activeRecipe = flavor.recipes?.[0]
    if (activeRecipe) {
      setYieldUnits(activeRecipe.yieldUnits)
      setRecipeItems(activeRecipe.items.map((i: any) => ({
         ingredientId: i.ingredientId,
         quantity: i.quantity,
         name: i.ingredient.name,
         unitCost: i.ingredient.unitCost,
         unitMeasure: i.ingredient.unitMeasure
      })))
    } else {
      setYieldUnits(1)
      setRecipeItems([])
    }

    setIsRecipeOpen(true)
  }

  function addIngredientLine(ingId: string) {
    if(!ingId) return
    const ing = ingredientsList.find(i => i.id === ingId)
    if(!ing) return
    if(recipeItems.find(r => r.ingredientId === ingId)) {
      toast.warning("Ingrediente já existe na receita.")
      return
    }

    setRecipeItems([...recipeItems, {
      ingredientId: ing.id,
      quantity: 0,
      name: ing.name,
      unitCost: ing.unitCost,
      unitMeasure: ing.unitMeasure
    }])
  }

  function updateIngredientItemQuantity(ingId: string, newQ: number) {
    setRecipeItems(recipeItems.map(i => i.ingredientId === ingId ? { ...i, quantity: newQ } : i))
  }

  function removeIngredientLine(ingId: string) {
    setRecipeItems(recipeItems.filter(i => i.ingredientId !== ingId))
  }

  async function handleSaveRecipe() {
    if(recipeItems.length === 0) return toast.error("Adicione insumos à ficha.")
    if(yieldUnits <= 0) return toast.error("Rendimento mínimo é 1.")

    const cleanItems = recipeItems.map(i => ({ ingredientId: i.ingredientId, quantity: i.quantity }))
    setIsSubmitting(true)

    const res = await saveActiveRecipeSnapshot(selectedFlavor.id, yieldUnits, cleanItems)
    
    setIsSubmitting(false)
    if(res.success) {
      toast.success("Ficha Técnica Atualizada! Custos recalibrados.")
      setIsRecipeOpen(false)
    } else {
      toast.error(res.error)
    }
  }

  // Calc em real-time local
  const liveTotalCost = recipeItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0)
  const liveUnitCost = (yieldUnits > 0) ? liveTotalCost / yieldUnits : 0
  const liveSellPrice = selectedFlavor?.suggestedSellPrice || 0
  const liveProfitUnit = liveSellPrice - liveUnitCost
  const liveMarginInfo = liveSellPrice > 0 ? (liveProfitUnit / liveSellPrice) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2"><IceCream2 size={18} /> Menu de Sabores</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-2 shadow-sm" type="button">
              <Plus size={16} /> Novo Sabor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Novo Sabor</DialogTitle>
              <DialogDescription>Nome do picolé/gelado e preço alvo que será vendido na rua.</DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nome / Título Comercial</Label>
                  <Input id="name" name="name" placeholder="Ex: Maracujá com Nutella" required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Descrição Menu (Opcional)</Label>
                  <Input id="description" name="description" placeholder="" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="suggestedSellPrice">Preço de Venda Praticado (R$)</Label>
                  <Input id="suggestedSellPrice" name="suggestedSellPrice" type="number" step="0.01" required placeholder="5.00"/>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Inicial"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead>Sabor</TableHead>
            <TableHead className="text-right">Preço de Venda</TableHead>
            <TableHead className="text-center">Ficha Técnica Info</TableHead>
            <TableHead className="text-right">Custo Proj. (MVP)</TableHead>
            <TableHead className="text-right">Margem Líq. Un.</TableHead>
            <TableHead className="text-right w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialFlavors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-slate-500">Nenhum sabor cadastrado. Crie um e construa a ficha técnica dele.</TableCell>
            </TableRow>
          ) : (
            initialFlavors.map((flavor) => {
              const activeRecipe = flavor.recipes?.[0]
              const hasRecipe = !!activeRecipe
              const cost = activeRecipe?.estimatedUnitCost || 0
              const profit = flavor.suggestedSellPrice - cost
              const margin = flavor.suggestedSellPrice > 0 ? (profit / flavor.suggestedSellPrice) * 100 : 0
              const isDanger = margin > 0 && margin < 30

              return (
                <TableRow key={flavor.id}>
                  <TableCell>
                    <div className="font-medium text-slate-800">{flavor.name}</div>
                    <div className="text-xs text-slate-400">Estoque fisíco Base: {flavor.stock?.quantity || 0} un</div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-pink-700">
                    {money(flavor.suggestedSellPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    {hasRecipe ? (
                       <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded-full border border-blue-200">
                         {activeRecipe.items.length} Ingredientes
                       </span>
                    ) : (
                       <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-1 rounded-full border border-slate-200 flex items-center justify-center gap-1 w-max mx-auto">
                         <AlertCircle size={12}/> Pendente
                       </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-rose-600 font-medium tracking-tight">
                    {hasRecipe ? money(cost) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasRecipe ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold">{profit > 0 ? "+" : ""}{money(profit)}</span>
                        <span className={`text-[10px] font-bold ${isDanger ? 'text-red-500' : 'text-slate-500'}`}>
                          {margin.toFixed(1)}% ML
                        </span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 gap-1"
                      onClick={() => openRecipeBuilder(flavor)}
                    >
                      <Settings2 size={13} /> Ficha Técnica
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* SUPER MODAL RECEITA (O MOTOR DE PRECIFICAÇÃO) */}
      <Dialog open={isRecipeOpen} onOpenChange={setIsRecipeOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b shrink-0 bg-slate-50">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calculator className="text-blue-500"/> Ficha Técnica: {selectedFlavor?.name}
            </DialogTitle>
            <DialogDescription>
              Custo Dinâmico de Engenharia. Defina exatamente o que vai nesta panela. Os preços atuais do sistema farão o resto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto w-full p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Esquerda: Construtor */}
            <div className="md:col-span-3 space-y-4">
               {ingredientsList.length === 0 && (
                 <div className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm border border-orange-200 mb-4 flex items-center">
                   <AlertCircle className="shrink-0 mr-2" size={16} /> 
                   <span>Você ainda não tem ingredientes cadastrados. Vá em <b>Ingredientes & Estoque</b> para adicionar.</span>
                 </div>
               )}
               <div>
                  <h4 className="text-sm font-medium text-slate-800 mb-2">Adicionar Ingrediente da Despensa</h4>
                  <div className="flex gap-2">
                     <Select onValueChange={(val: any) => addIngredientLine(val)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um insumo para a ficha..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientsList.map(ing => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} ({money(ing.unitCost)} / {ing.unitMeasure})
                            </SelectItem>
                          ))}
                          {ingredientsList.length === 0 && (
                            <SelectItem value="none" disabled>Nenhum ingrediente base disponível</SelectItem>
                          )}
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="border rounded-lg mt-4 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead className="w-[120px]">Qtd Utilizada</TableHead>
                        <TableHead className="text-right">Custo Parcial</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipeItems.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-slate-500 p-4">A receita está vazia.</TableCell></TableRow>
                      )}
                      {recipeItems.map(item => (
                        <TableRow key={item.ingredientId}>
                          <TableCell className="font-medium text-slate-700 text-sm">
                            {item.name}
                            <div className="text-[10px] text-slate-400 font-normal">Base: {money(item.unitCost)} / {item.unitMeasure}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input 
                                type="number" 
                                className="h-7 px-2 text-right" 
                                step="0.01"
                                value={item.quantity || ''}
                                onChange={(e) => updateIngredientItemQuantity(item.ingredientId, parseFloat(e.target.value) || 0)}
                              />
                              <span className="text-xs text-slate-500">{item.unitMeasure}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {money(item.quantity * item.unitCost)}
                          </TableCell>
                          <TableCell>
                            <button onClick={() => removeIngredientLine(item.ingredientId)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 size={14}/>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </div>
            </div>

            {/* Direita: Placar Analitico */}
            <div className="md:col-span-2">
              <div className="bg-slate-900 rounded-xl p-5 text-slate-100 shadow-inner flex flex-col h-full ring-1 ring-slate-800">
                 <h4 className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Painel Econômico</h4>
                 
                 <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-400">Custo Total da Panela:</span>
                       <span className="font-medium text-rose-300">{money(liveTotalCost)}</span>
                    </div>
                    
                    <div>
                       <Label className="text-slate-300 text-xs mb-1 block">Rendimento Alvo (A Panela Rende Quanto?)</Label>
                       <Input 
                         type="number" 
                         value={yieldUnits} 
                         onChange={e => setYieldUnits(parseInt(e.target.value))} 
                         className="bg-slate-800 border-slate-700 text-white font-bold h-10" 
                         min={1}
                       />
                       <p className="text-[10px] text-slate-500 mt-1 mt-1">Gela dinâmico, embale quantos renderem e coloque o número.</p>
                    </div>

                    <div className="h-[1px] bg-slate-800 my-4" />

                    <div className="flex justify-between items-center">
                       <span className="text-slate-300 text-sm font-medium">Custo por Unidade:</span>
                       <span className="font-bold text-xl text-white bg-slate-800 px-3 py-1 rounded-md">{money(liveUnitCost)}</span>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                       <span className="text-slate-400 text-sm">Preço Alvo Venda:</span>
                       <span className="font-medium text-pink-400">{money(liveSellPrice)}</span>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 mt-4">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-300 text-xs uppercase">Margem (Lucro Líq.):</span>
                          <span className={`font-bold text-lg ${liveMarginInfo < 40 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {liveMarginInfo.toFixed(1)}%
                          </span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs">Lucro Líquido Real R$:</span>
                          <span className="font-medium text-sm text-white">{money(liveProfitUnit)} un</span>
                       </div>
                    </div>
                 </div>

                 <Button 
                   onClick={handleSaveRecipe}
                   disabled={isSubmitting} 
                   className="w-full mt-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold h-12"
                 >
                   {isSubmitting ? "Gravando Fotografia Sistêmica..." : "Confirmar e Aplicar Ficha"}
                 </Button>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
