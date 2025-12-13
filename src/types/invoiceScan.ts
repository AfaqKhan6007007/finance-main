
export interface IInvoiceScan {
  _id?: string
  id?: string
  invoiceNumber?: string
  invoiceDate?: string
  date?: string
  supplierName?: string
  supplierVAT?: string
  customerName?: string
  customerVAT?: string
  amountBeforeVAT?: number
  totalVAT?: number
  totalAmount?: number
  qrCodePresent?: boolean
  qrCodeValid?: boolean
  status?: string
  supplierAddress?: string
  billingAddress?: string
  fromDate?: string
  toDate?: string
  createdBy?: string
  editedBy?: string
  isInvoiceCreated?: boolean
  createdAt?: Date
  updatedAt?: Date
}