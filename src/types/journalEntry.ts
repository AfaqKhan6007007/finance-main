export interface IJournalEntry {
  _id?: string
  id: string
  date: Date
  account?: string
  debitAccount?: string
  creditAccount?: string
  amount?: number
  credit: number
  debit: number
  description: string
  createdBy?: string
  editedBy?: string
  createdAt?: Date
  updatedAt?: Date
}