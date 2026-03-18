"use client"

import { useState } from "react"
import { Plus, PackagePlus, Trash2 } from "lucide-react"
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
import { createIngredient, deleteIngredient, registerStockEntry, editIngredient } from "@/server/actions/ingredients"
import { Edit } from "lucide-react"

export function IngredientsClient({ initialData }: { initialData: any[] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isStockOpen, setIsStockOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null)
  const [editingIngredient, setEditingIngredient] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true)
    const res = await createIngredient(formData)
    setIsSubmitting(false)
    if (res.success) {
      toast.success("Ingrediente cadastrado com sucesso!")
      setIsCreateOpen(false)
    } else {
      toast.error(res.error)
    }
  }

  async function handleEdit(formData: FormData) {
    if (!editingIngredient) return
    setIsSubmitting(true)
    const res = await editIngredient(editingIngredient.id, formData)
    setIsSubmitting(false)
    if (res.success) {
      toast.success("Ingrediente alterado com sucesso!")
      setIsEditOpen(false)
      setEditingIngredient(null)
    } else {
      toast.error(res.error)
    }
  }

  async function handleDelete(id: string) {
    if(!confirm("Atenção: remover este ingrediente pode impactar receitas. Deseja continuar?")) return

    const res = await deleteIngredient(id)
    if(res.success) toast.success("Removido com sucesso.")
    else toast.error(res.error)
  }

  async function handleAddStock(formData: FormData) {
    setIsSubmitting(true)
    const quantity = parseFloat(formData.get("quantity") as string)
    const totalCost = parseFloat(formData.get("totalCost") as string)
    
    if(!quantity || !totalCost) {
      toast.error("Preencha quantidade e custo total da nota.")
      setIsSubmitting(false)
      return
    }

    const res = await registerStockEntry(selectedIngredient.id, quantity, totalCost)
    setIsSubmitting(false)
    if(res.success) {
      toast.success("Estoque e custo unitário atualizados!")
      setIsStockOpen(false)
    } else {
      toast.error("Erro: " + res.error)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800">Catálogo de Insumos</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-2 shadow-sm" type="button">
              <Plus size={16} /> Novo Ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Insumo</DialogTitle>
              <DialogDescription>Adicione um novo ingrediente para usar nas fichas técnicas.</DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto <span className="text-rose-500">*</span></Label>
                <Input id="name" name="name" placeholder="Ex: Leite Condensado Moça" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input id="category" name="category" placeholder="Ex: Laticínios, Secos..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitMeasure">Und. de Medida <span className="text-rose-500">*</span></Label>
                  <Select name="unitMeasure" defaultValue="g">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Gramas (g)</SelectItem>
                      <SelectItem value="kg">Quilos (kg)</SelectItem>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                      <SelectItem value="l">Litros (l)</SelectItem>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Custo Unitário Inicial (R$)</Label>
                  <Input id="unitCost" name="unitCost" type="number" step="0.0001" placeholder="Ex: 0.0150" />
                  <p className="text-[10px] text-slate-400">Custo por 1 unidade da medida acima</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Estoque Mínimo (Alerta)</Label>
                  <Input id="minStock" name="minStock" type="number" step="0.01" placeholder="Ex: 500" />
                  <p className="text-[10px] text-slate-400">Alerta visual quando o estoque cair abaixo</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor / Onde Compra</Label>
                <Input id="supplier" name="supplier" placeholder="Ex: Laticínios São João, Atacadão..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input id="notes" name="notes" placeholder="Ex: Prefira lata 395g, usar dentro de 3 dias após aberto..." />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Ingrediente"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead>Ingrediente</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Estoque Atual</TableHead>
            <TableHead className="text-right">Custo Unit. (Ref)</TableHead>
            <TableHead className="text-right w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-slate-500">Nenhum ingrediente cadastrado.</TableCell>
            </TableRow>
          ) : (
            initialData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-slate-500">{item.category || "-"}</TableCell>
                <TableCell className="text-right font-medium">
                  <span className={item.currentStock <= item.minStock ? "text-red-500" : "text-rose-600"}>
                    {item.currentStock} {item.unitMeasure}
                  </span>
                </TableCell>
                <TableCell className="text-right text-slate-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 4 }).format(item.unitCost)} / {item.unitMeasure}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-slate-500 border-slate-200 hover:bg-slate-100"
                      onClick={() => {
                        setEditingIngredient(item)
                        setIsEditOpen(true)
                      }}
                      title="Editar Cadastro do Ingrediente"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        setSelectedIngredient(item)
                        setIsStockOpen(true)
                      }}
                      title="Lançar Compra / Entrada de Estoque"
                    >
                      <PackagePlus size={14} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* MODAL ENTRADA ESTOQUE */}
      <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrada de Estoque</DialogTitle>
            <DialogDescription>
              Lance a compra de <b>{selectedIngredient?.name}</b>. O sistema calculará o novo custo unitário médio.
            </DialogDescription>
          </DialogHeader>
          <form action={handleAddStock} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Qtd Total Comprada ({selectedIngredient?.unitMeasure})</Label>
                <Input id="quantity" name="quantity" type="number" step="0.01" placeholder="Ex: 395" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCost">Valor Total Pago (Nota)</Label>
                <Input id="totalCost" name="totalCost" type="number" step="0.01" placeholder="Ex: 5.50" required />
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
              <p className="text-xs text-blue-700">
                <b>Regra MVP:</b> O Custo Unitário do ingrediente passará a ser regido pelo repasse direto desta nota fiscal para assegurar as margens em tempo real.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStockOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Lançando..." : "Registrar Entrada"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR INGREDIENTE */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cadastro do Insumo</DialogTitle>
            <DialogDescription>Edite as informações base do ingrediente.</DialogDescription>
          </DialogHeader>
          {editingIngredient && (
            <form action={handleEdit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Produto <span className="text-rose-500">*</span></Label>
                <Input id="edit-name" name="name" defaultValue={editingIngredient.name} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Input id="edit-category" name="category" defaultValue={editingIngredient.category || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unitMeasure">Und. de Medida <span className="text-rose-500">*</span></Label>
                  <Select name="unitMeasure" defaultValue={editingIngredient.unitMeasure}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Gramas (g)</SelectItem>
                      <SelectItem value="kg">Quilos (kg)</SelectItem>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                      <SelectItem value="l">Litros (l)</SelectItem>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-unitCost">Custo Unitário (R$)</Label>
                  <Input id="edit-unitCost" name="unitCost" type="number" step="0.0001" defaultValue={editingIngredient.unitCost} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minStock">Estoque Mínimo (Alerta)</Label>
                  <Input id="edit-minStock" name="minStock" type="number" step="0.01" defaultValue={editingIngredient.minStock} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Fornecedor / Onde Compra</Label>
                <Input id="edit-supplier" name="supplier" defaultValue={editingIngredient.supplier || ""} />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Edição"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
