// components/pages/invoices/ReportView.tsx
"use client"
import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { IInvoice } from "@/types/inovice"
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react"

interface ReportViewProps {
  onRowClick?: (id: string) => void
  invoices: IInvoice[]
  loading: boolean
}

export default function ReportView({ onRowClick, invoices = [], loading }: ReportViewProps) {
  
  const [localInvoices, setLocalInvoices] = useState<IInvoice[]>([])

  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  useEffect(() => {
    setLocalInvoices(invoices)
  }, [invoices])

  useEffect(() => {
    if (!loading) {
      setCurrentPage(1)
    }
  }, [loading])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'Overdue':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'Draft':
        return <FileText className="w-4 h-4 text-gray-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) return <p className="text-center py-8">Loading invoices...</p>
  if (!localInvoices.length) return <p className="text-center py-8 text-gray-600">No invoices found</p>

  const totalInvoices = localInvoices.length
  const totalPages = Math.max(1, Math.ceil(totalInvoices / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const currentInvoices = localInvoices.slice(startIndex, startIndex + rowsPerPage)

  const truncateText = (text: string | undefined | null, maxLength: number = 20) => {
    if (!text) return "---"
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  return (
    <div className="w-full border border-gray-300 rounded-2xl overflow-x-auto space-y-6 no-scrollbar">
      <Table className="border-collapse rounded overflow-hidden w-full">
        <TableHeader>
          <TableRow className="w-full h-10 bg-gray-200 border-b border-gray-300">
            <TableHead className="text-primary-dull text-start border-r border-gray-300">#</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">ID</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Invoice Number</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Invoice Date</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Supplier Name</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Supplier VAT</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Customer Name</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Customer VAT</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Amount Before VAT</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Total VAT</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Total Amount</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">QR Code</TableHead>
            <TableHead className="text-primary-dull text-start pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="">
          {currentInvoices.map((invoice, index) => (
            <TableRow 
              key={invoice.id} 
              className="h-12 cursor-pointer hover:bg-gray-100 border-b border-gray-200" 
              onClick={() => onRowClick?.(invoice.id)}
            >
              {/* No - Sequential number */}
              <TableCell className="text-center text-sm border-r border-gray-200 p-1">
                {startIndex + index + 1}
              </TableCell>

              {/* ID */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(invoice.id, 8)}
              </TableCell>

              {/* Invoice Number */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(invoice.invoiceNumber, 15)}
              </TableCell>

              {/* Invoice Date */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {formatDate(invoice.date)}
              </TableCell>

              {/* Supplier Name */}
              <TableCell className="text-start text-sm truncate max-w-[120px] border-r border-gray-200" title={invoice.supplierName}>
                {truncateText(invoice.supplierName, 20)}
              </TableCell>

              {/* Supplier VAT */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(invoice.supplierVAT, 12)}
              </TableCell>

              {/* Customer Name */}
              <TableCell className="text-start text-sm truncate max-w-[120px] border-r border-gray-200" title={invoice.customerName}>
                {truncateText(invoice.customerName, 20)}
              </TableCell>

              {/* Customer VAT */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(invoice.customerVAT, 12)}
              </TableCell>

              {/* Amount Before VAT */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {formatCurrency(invoice.amountBeforeVAT)}
              </TableCell>

              {/* Total VAT */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {formatCurrency(invoice.totalVAT)}
              </TableCell>

              {/* Total Amount */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {formatCurrency(invoice.totalAmount)}
              </TableCell>

              {/* QR Code Status */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                <div className="flex items-center gap-1">
                  {invoice.qrCodePresent ? (
                    invoice.qrCodeValid ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </TableCell>

              {/* Status */}
              <TableCell className="text-start text-sm">
                <div className="flex items-center gap-1">
                  {getStatusIcon(invoice.status)}
                  <span>{invoice.status}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Rows per page:</span>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(val) => {
              setRowsPerPage(Number(val))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 25, 50].map(n => (
                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}