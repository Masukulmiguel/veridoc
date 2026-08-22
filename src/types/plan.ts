export interface PlanLimits {
  maxDocumentsMonthly: number | null
  maxUsers: number | null
  hasPdf: boolean
  hasQrCode: boolean
  hasApiAccess: boolean
  hasPrioritySupport: boolean
}

export interface Plan {
  id: string
  name: string
  description: string
  priceMonthlyKz: number
  priceAnnualKz: number
  limits: PlanLimits
}
