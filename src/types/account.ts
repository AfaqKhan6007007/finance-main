export interface IAccount {
  _id: string //mongodb id
  id: string //account id to be shown on frontend
  disable: boolean
  accountName: string
  accountNumber?: string
  isGroup: boolean
  company: string
  taxRate?: string
  currency: string
  parentAccount: string
  accountType: string
  balanceMustBe: string
  rootType?: string
  reportType?: string
  frozen:string
  createdBy: string;
  editedBy: string;
  createdAt: Date
  updatedAt: Date
  __v?: number
}
