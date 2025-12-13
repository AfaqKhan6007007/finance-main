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
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, CheckCircle, XCircle, Clock, Edit } from "lucide-react"
import { MdDeleteForever } from "react-icons/md";
import type { IInvoice } from "@/types/inovice"

interface ListViewProps{
  onRowClick?: (id: string) => void
  invoices: IInvoice[]
  loading: boolean
  onDeleteClick?: (invoice: IInvoice) => void; 
}

export default function ListView({ onRowClick, invoices = [], loading, onDeleteClick }: ListViewProps) {
  const [localInvoices, setLocalInvoices] = useState<IInvoice[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  // Checkbox
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

  useEffect(() => {
    setLocalInvoices(invoices)
  }, [invoices])

  // Toggle individual checkbox
  const handleCheckboxToggle = (invoiceId: string, checked: boolean) => {
    setSelectedInvoices(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(invoiceId)
      } else {
        newSelected.delete(invoiceId)
      }
      setIsAllSelected(newSelected.size === localInvoices.length)
      return newSelected
    })
  }

  // Toggle all checkboxes
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allInvoiceIds = new Set(localInvoices.map(inv => inv.id))
      setSelectedInvoices(allInvoiceIds)
      setIsAllSelected(true)
    } else {
      setSelectedInvoices(new Set())
      setIsAllSelected(false)
    }
  }

  // Handle download
  const handleDownload = (invoice: IInvoice, e: React.MouseEvent) => {
    e.stopPropagation()
    // Implement download logic here
    console.log("Downloading invoice:", invoice.invoiceNumber)
  }

  // Handle edit
  const handleEdit = (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onRowClick?.(invoiceId)
  }

  // Reset pagination when loading
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1)
    }
  }, [loading])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return "bg-green-100 text-green-700"
      case 'Pending':
        return "bg-yellow-100 text-yellow-700"
      case 'Overdue':
        return "bg-red-100 text-red-700"
      case 'Draft':
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) return <p className="text-center py-8">Loading invoices...</p>
  if (!localInvoices.length) return <p className="text-center py-8 text-gray-600">No invoices found</p>

  const totalInvoices = localInvoices.length
  const totalPages = Math.max(1, Math.ceil(totalInvoices / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const currentInvoices = localInvoices.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="w-full border rounded-2xl overflow-x-auto space-y-6 no-scrollbar">
      <Table className="overflow-hidden w-full">
        <TableHeader>
          <TableRow className="w-full h-10 bg-gray-200">
            <TableHead className="w-8 pl-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="w-4 h-4 cursor-pointer bg-gray-50 data-[state=checked]:bg-primary-dull data-[state=checked]:border-primary-dull data-[state=checked]:text-white"
              />
            </TableHead>
            <TableHead className="text-primary-dull pl-4">ID</TableHead>
            <TableHead className="text-primary-dull">Invoice Number</TableHead>
            <TableHead className="text-primary-dull">Invoice Date</TableHead>
            <TableHead className="text-primary-dull">Supplier Name</TableHead>
            <TableHead className="text-primary-dull">Customer Name</TableHead>
            <TableHead className="text-primary-dull">Amount</TableHead>
            <TableHead className="text-primary-dull">VAT</TableHead>
            <TableHead className="text-primary-dull">Total</TableHead>
            <TableHead className="text-primary-dull">QR Code</TableHead>
            <TableHead className="text-primary-dull">Status</TableHead>
            <TableHead className="text-primary-dull text-end pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentInvoices.map(invoice => (
            <TableRow 
              key={invoice.id} 
              className="h-12 cursor-pointer hover:bg-gray-100" 
            >
              {/* Checkbox */}
              <TableCell className="w-8 px-4">
                <Checkbox
                  checked={selectedInvoices.has(invoice.id)}
                  onCheckedChange={(checked) => handleCheckboxToggle(invoice.id, checked as boolean)}
                  className="w-4 h-4 cursor-pointer data-[state=checked]:bg-primary-dull data-[state=checked]:border-primary-dull data-[state=checked]:text-white"
                />
              </TableCell>

              {/* ID */}
              <TableCell 
                className="font-medium"
                onClick={() => onRowClick?.(invoice.id)}
              >
                {invoice.id}
              </TableCell>

              {/* Invoice Number */}
              <TableCell
                className="truncate max-w-[150px]"
                onClick={() => onRowClick?.(invoice.id)}
              >
                {invoice.invoiceNumber}
              </TableCell>

              {/* Invoice Date */}
              <TableCell
                onClick={() => onRowClick?.(invoice.id)}
              >
                {formatDate(invoice.date)}
              </TableCell>

              {/* Supplier Name */}
              <TableCell
                className="truncate max-w-[120px]"
                onClick={() => onRowClick?.(invoice.id)}
                title={invoice.supplierName}
              >
                {invoice.supplierName}
              </TableCell>

              {/* Customer Name */}
              <TableCell
                className="truncate max-w-[120px]"
                onClick={() => onRowClick?.(invoice.id)}
                title={invoice.customerName}
              >
                {invoice.customerName}
              </TableCell>

              {/* Amount Before VAT */}
              <TableCell
                onClick={() => onRowClick?.(invoice.id)}
              >
                {formatCurrency(invoice.amountBeforeVAT)}
              </TableCell>

              {/* Total VAT */}
              <TableCell
                onClick={() => onRowClick?.(invoice.id)}
              >
                {formatCurrency(invoice.totalVAT)}
              </TableCell>

              {/* Total Amount */}
              <TableCell
                onClick={() => onRowClick?.(invoice.id)}
              >
                {formatCurrency(invoice.totalAmount)}
              </TableCell>

              {/* QR Code Status */}
              <TableCell
                onClick={() => onRowClick?.(invoice.id)}
              >
                <div className="flex items-center gap-1">
                  {invoice.qrCodePresent ? (
                    invoice.qrCodeValid ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>
              </TableCell>

              {/* Status */}
              <TableCell
                onClick={() => onRowClick?.(invoice.id)}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(invoice.status)}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </TableCell>

              {/* Actions */}
              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDownload(invoice, e)}
                  className="text-gray-700 hover:text-primary-dull p-2 rounded-full hover:bg-white cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleEdit(invoice.id, e)}
                  className="text-gray-700 hover:text-primary-dull p-2 rounded-full hover:bg-white cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                variant="ghost"
                  size="sm"
                  onClick={() => onDeleteClick?.(invoice)}
                  className="text-gray-700 hover:text-red-500 p-2 rounded-full hover:bg-red-100 cursor-pointer"
                >
                  <MdDeleteForever className="h-5 w-5" />
                </Button>
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
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
            Prev
          </Button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}