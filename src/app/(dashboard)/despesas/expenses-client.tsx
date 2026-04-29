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
import type { Expense, ExpenseCategory } from "@/types/domain"

const PAGE_SIZE = 15
const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

export function ExpensesClient({ initialExpenses, categories }: { initialExpenses: Expense[], categories: ExpenseCategory[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCat, setSelectedCat] = useState<string>("")
  const [isNewCat, setIsNewCat] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

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
    <div className="rounded-xl shadow-sm overflow-hidden flex flex-col h-[75vh]" style={{ background: "oklch(0.998 0.004 80)", border: "1px solid oklch(0.91 0.015 70)" }}>
      <div className="p-4 flex justify-between items-center" style={{ borderBottom: "1px solid oklch(0.91 0.015 70)", background: "oklch(0.96 0.008 75)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ color: "oklch(0.22 0.04 30)", fontFamily: "var(--font-display)" }}><Receipt size={18} style={{ color: "oklch(0.52 0.22 350)" }} /> Livro de Contas Pagas</h3>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" type="button">
              <Plus size={16} /> Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Nova Conta/Despesa</DialogTitle>
              <DialogDescription>Custos isolados pra deduzir do Lucro Líquido final (ex: Energia, Água).</DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição <span className="text-rose-500">*</span></Label>
                <Input id="description" name="description" placeholder="Ex: Conta de Luz (Maio)" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Categoria <span className="text-rose-500">*</span></Label>
                    <button type="button" onClick={() => setIsNewCat(!isNewCat)} className="text-xs hover:underline cursor-pointer" style={{ color: "oklch(0.52 0.22 350)" }}>
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
                  <Label htmlFor="amount">Valor Total (R$) <span className="text-rose-500">*</span></Label>
                  <Input id="amount" name="amount" type="number" step="0.01" required placeholder="Ex: 154.30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseDate">Data do Pagamento</Label>
                  <Input 
                    id="expenseDate" 
                    name="expenseDate" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceRef">Nº Nota / Referência</Label>
                  <Input id="invoiceRef" name="invoiceRef" placeholder="Ex: NF-00123" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input id="notes" name="notes" placeholder="Ex: Pago no cartão corporativo, vence dia 10..." />
              </div>

              <div className="flex items-center gap-2 pt-1 bg-rose-50/50 border border-rose-100 rounded-lg p-3">
                <input type="checkbox" id="isRecurring" name="isRecurring" className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0" />
                <Label htmlFor="isRecurring" className="font-normal text-slate-600 cursor-pointer">
                  Despesa Recorrente Fixa <span className="text-xs text-slate-400">(Marcará como conta mensal fixa)</span>
                </Label>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700" disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Registrar Saída"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow style={{ background: "oklch(0.96 0.008 75)" }}>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>NF / Ref.</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12" style={{ color: "oklch(0.55 0.02 30)" }}>
                  <Receipt size={28} className="mx-auto mb-2 opacity-30" />
                  Nenhuma despesa cadastrada. Registre a primeira saída.
                </TableCell>
              </TableRow>
            ) : (
              initialExpenses.slice(0, visibleCount).map((exp) => (
                <TableRow key={exp.id} className="hover:bg-rose-50/30">
                  <TableCell className="text-sm whitespace-nowrap" style={{ color: "oklch(0.52 0.02 30)" }}>{format(new Date(exp.expenseDate), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <div className="font-medium" style={{ color: "oklch(0.28 0.04 30)" }}>{exp.description}</div>
                    {exp.notes && <div className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: "oklch(0.55 0.02 30)" }}>{exp.notes}</div>}
                    {exp.isRecurring && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Conta Fixa</span>}
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "oklch(0.42 0.03 30)" }}>{exp.category?.name}</TableCell>
                  <TableCell className="text-xs" style={{ color: "oklch(0.55 0.02 30)" }}>{exp.invoiceRef || "–"}</TableCell>
                  <TableCell className="text-right font-medium text-rose-600">- {money(exp.amount)}</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => handleDelete(exp.id)} className="p-2 transition-colors cursor-pointer" style={{ color: "oklch(0.65 0.02 30)" }}><Trash2 size={15} /></button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Load More */}
        {visibleCount < initialExpenses.length && (
          <div className="p-3 text-center" style={{ borderTop: "1px solid oklch(0.91 0.015 70)" }}>
            <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
              Ver mais ({initialExpenses.length - visibleCount} restantes)
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
