/**
 * Tipos de domínio do sistema Maria Doce Gelado
 * Derivados do schema Prisma para garantir consistência em todo o frontend
 */

// --- Ingredientes ---
export interface Ingredient {
  id: string
  name: string
  category: string | null
  unitMeasure: string
  unitCost: number
  currentStock: number
  minStock: number  // não nulo — Prisma define como Float @default(0)
  supplier: string | null
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

// --- Receitas ---
export interface RecipeItem {
  id: string
  ingredientId: string
  quantity: number
  unitCost: number
  ingredient: Ingredient
}

export interface Recipe {
  id: string
  flavorId: string
  active: boolean
  yieldUnits: number
  estimatedTotalCost: number
  estimatedUnitCost: number
  items: RecipeItem[]
  createdAt: string | Date
}

// --- Sabores ---
export interface FlavorStock {
  flavorId: string
  quantity: number
}

export interface Flavor {
  id: string
  name: string
  description: string | null
  suggestedSellPrice: number
  active: boolean
  recipes: Recipe[]
  stock: FlavorStock | null
  createdAt: string | Date
}

// --- Produção ---
export interface ProductionBatch {
  id: string
  flavorId: string
  recipeId: string
  quantityProduced: number
  totalProductionCost: number
  date: string | Date
  notes: string | null
  flavor: { id: string; name: string }
  recipe: {
    id: string
    yieldUnits: number
    items: { ingredientId: string; quantity: number; unitCost: number }[]
  }
}

// --- Vendas ---
export interface SaleItem {
  id: string
  saleId: string
  flavorId: string
  quantity: number
  unitSellPrice: number
  unitCostAtSaleTime: number
  totalMarginLiquid: number
  flavor: { name: string }
}

export interface Sale {
  id: string
  saleDate: string | Date
  totalAmount: number
  discountAmount: number
  paymentMethod: string | null
  notes: string | null
  items: SaleItem[]
}

// --- Despesas ---
export interface ExpenseCategory {
  id: string
  name: string
}

export interface Expense {
  id: string
  expenseCategoryId: string
  description: string
  amount: number
  expenseDate: string | Date
  isRecurring: boolean
  invoiceRef: string | null
  notes: string | null
  category: ExpenseCategory
  createdAt: string | Date
}

// --- Dashboard ---
export interface DashboardMetrics {
  currentGrossRevenue: number
  currentNetProfit: number
  totalUnitsSold: number
  totalUnitsProduced: number
  currentCostOfGoodsSold: number
  totalExpenses: number
}
