"use client"

import { useState } from "react"
import { Plus, Trash2, Receipt } from "lucide-react"
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
import { createExpense, deleteExpense } from "@/server/actions/expenses"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

export function ExpensesClient({ initialExpenses, categories }: { initialExpenses: any[], categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCat, setSelectedCat] = useState<string>("")
  const [isNewCat, setIsNewCat] = useState(false)

  async function handleCreate(formData: FormData) {
    if(!isNewCat && !selectedCat) { toast.error("Selecione uma categoria"); return; }
    if(!isNewCat) formData.append("categoryId", selectedCat)

    setIsSubmitting(true)
    const res = await createExpense(formData)
    setIsSubmitting(false)

    if (res && res.success) {
      toast.success("Despesa registrada com sucesso.")
      setIsOpen(false)
    } else if (res) {
      toast.error(res.error)
    }
  }

  async function handleDelete(id: string) {
    if(!confirm("Tem certeza que deseja apagar essa despesa? Isso mudará o DRE.")) return
    const res = await deleteExpense(id)
    if(res.success) toast.success("Despesa apagada.")
    else toast.error(res.error)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[75vh]">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Receipt size={18} /> Livro de Contas Pagas</h3>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" type="button">
              <Plus size={16} /> Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Conta/Despesa</DialogTitle>
              <DialogDescription>Custos isolados pra deduzir do Lucro Líquido final (ex: Energia, Água).</DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" placeholder="Ex: Conta de Luz (Maio)" required />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Categoria</Label>
                  <button type="button" onClick={() => setIsNewCat(!isNewCat)} className="text-xs text-blue-600 hover:underline">
                    {isNewCat ? "Selecionar Existente" : "Criar Nova Categoria"}
                  </button>
                </div>
                {isNewCat ? (
                  <Input name="newCategory" placeholder="Nome da nova categoria..." required />
                ) : (
                  <Select value={selectedCat} onValueChange={(val) => { if (val) setSelectedCat(val) }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      {categories.length === 0 && <SelectItem value="none" disabled>Nenhuma listada</SelectItem>}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor Total (R$)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required placeholder="Ex: 154.30" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isRecurring" name="isRecurring" className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4" />
                <Label htmlFor="isRecurring" className="font-normal text-slate-600">Considerar Despesa Recorrente Fixa (Aviso/Filtro)</Label>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Registrar Saída"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">Nenhuma despesa ou conta cadastrada.</TableCell>
              </TableRow>
            ) : (
              initialExpenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-slate-500 text-sm">{format(new Date(exp.expenseDate), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-800">{exp.description}</div>
                    {exp.isRecurring && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase mt-1">Conta Fixa</span>}
                  </TableCell>
                  <TableCell className="text-slate-600">{exp.category?.name}</TableCell>
                  <TableCell className="text-right font-medium text-rose-600">- {money(exp.amount)}</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => handleDelete(exp.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
