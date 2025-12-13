export interface IInvoice {
  // MongoDB document fields
  _id: string
  __v?: number
  createdAt: Date
  updatedAt: Date

  // Core invoice fields
  id: string
  invoiceNumber: string
  date: string
  supplierName: string
  supplierVAT?: string
  customerName: string
  customerVAT?: string
  amountBeforeVAT: number
  totalVAT: number
  totalAmount: number
  qrCodePresent: boolean
  qrCodeValid: boolean
  status: string
  scannedInvoiceId?: string

  // Additional form fields
  setAdvancesAndAllocate: boolean
  writeOffAmount: number
  supplierAddress?: string
  supplierContactPerson?: string
  dispatchAddress?: string
  shippingAddress?: string
  billingAddress?: string
  paymentTermsTemplate?: string
  terms?: string
  termsAndConditions?: string
  creditTo?: string
  isOpeningEntry: string
  fromDate?: string
  toDate?: string
  subscription?: string
  letterHead?: string
  printHeading?: string
  groupSameItems: boolean
  holdInvoice: boolean
  isSupplier: boolean
  supplierGroup?: string
  remarks?: string

  // User tracking
  createdBy: string
  editedBy: string
}

export interface AdvancePayment {
  id: string
  referenceName: string
  remarks: string
  advanceAmount: number
  allocatedAmount: number
  difference: number
  postingDate: string
}

export interface PaymentTerm {
  id: string
  paymentTerm: string
  description: string
  dueDate: string
  invoicePortion: number
  paymentAmount: number
}