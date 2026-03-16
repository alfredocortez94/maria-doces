"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/session"

// -------------------------------------------------------------
// GET EXPENSES
// -------------------------------------------------------------
export async function getExpenses() {
  try {
    const expenses = await prisma.expense.findMany({
      include: { category: true },
      orderBy: { expenseDate: 'desc' }
    })
    
    // Pegar categorias para o select form
    const categories = await prisma.expenseCategory.findMany()

    return { success: true, data: { expenses, categories } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// POST: CREATE EXPENSE
// -------------------------------------------------------------
export async function createExpense(formData: FormData) {
  try {
    await requireAuth()
    const description = formData.get("description") as string
    const amount = parseFloat(formData.get("amount") as string)
    let categoryId = formData.get("categoryId") as string
    const newCategory = formData.get("newCategory") as string
    
    // Se o usuário digitou uma categoria nova em vez de selecionar
    if (newCategory) {
      const cat = await prisma.expenseCategory.upsert({
         where: { name: newCategory },
         update: {},
         create: { name: newCategory }
      })
      categoryId = cat.id
    }

    if (!description || !amount || !categoryId) {
      return { success: false, error: "Preencha todos os campos obrigatórios." }
    }

    const expenseDateStr = formData.get("expenseDate") as string
    const invoiceRef = (formData.get("invoiceRef") as string) || undefined
    const notes = (formData.get("notes") as string) || undefined
    const expenseDate = expenseDateStr ? new Date(expenseDateStr) : new Date()

    await prisma.expense.create({
      data: {
        description,
        amount,
        expenseCategoryId: categoryId,
        expenseDate,
        isRecurring: formData.get("isRecurring") === "on",
        invoiceRef,
        notes
      }
    })

    revalidatePath("/despesas")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Falha ao registrar despesa: " + error.message }
  }
}

export async function deleteExpense(id: string) {
  try {
    await requireAuth()
    await prisma.expense.delete({ where: { id } })
    revalidatePath("/despesas")
    return { success: true }
  } catch(e: any) {
    return { success: false, error: e.message }
  }
}
