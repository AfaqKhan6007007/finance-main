// components/pages/journal-entries/ReportView.tsx
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
import type { IJournalEntry } from "@/types/journalEntry"

interface ReportViewProps {
  onRowClick?: (id: string) => void
  journalEntries: IJournalEntry[]
  loading: boolean
}

export default function ReportView({ onRowClick, journalEntries = [], loading }: ReportViewProps) {
  
  const [localEntries, setLocalEntries] = useState<IJournalEntry[]>([])

  useEffect(() => {
    setLocalEntries(journalEntries)
  }, [journalEntries])

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  useEffect(() => {
    if (!loading) {
      setCurrentPage(1)
    }
  }, [loading])

  if (loading) return <p className="text-center py-8">Loading journal entries...</p>
  if (!localEntries.length) return <p className="text-center py-8 text-gray-600">No journal entries found</p>

  const totalEntries = localEntries.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const currentEntries = localEntries.slice(startIndex, startIndex + rowsPerPage)

  const truncateText = (text: string | undefined | null, maxLength: number = 20) => {
    if (!text || text === "none") return "---"
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="w-full border border-gray-300 rounded-2xl overflow-x-auto space-y-6 no-scrollbar">
      <Table className="border-collapse rounded overflow-hidden w-full">
        <TableHeader>
          <TableRow className="w-full h-10 bg-gray-200 border-b border-gray-300">
            <TableHead className="text-primary-dull text-center border-r border-gray-300">No.</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">ID</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Account</TableHead>
            {/* <TableHead className="text-primary-dull text-start border-r border-gray-300">Naming Series</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Company</TableHead> */}
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Posting Date</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Total Debit</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Total Credit</TableHead>
            {/* <TableHead className="text-primary-dull text-start border-r border-gray-300">Difference</TableHead> */}
            <TableHead className="text-primary-dull text-start pr-4">Description</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="">
          {currentEntries.map((entry, index) => (
            <TableRow 
              key={entry.id} 
              className="h-12 cursor-pointer hover:bg-gray-100 border-b border-gray-200" 
              onClick={() => onRowClick?.(entry.id)}
            >
              <TableCell className="text-center text-sm border-r border-gray-200 p-1">
                {startIndex + index + 1}
              </TableCell>

              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(entry.id, 8)}
              </TableCell>

              {/* <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(entry.voucher_type, 15)}
              </TableCell>

              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(entry.naming_series, 15)}
              </TableCell> */}

              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(entry.account, 20)}
              </TableCell>

              <TableCell className="text-start text-sm border-r border-gray-200">
                {new Date(entry.date).toLocaleDateString()}
              </TableCell>

              <TableCell className="text-start text-sm border-r border-gray-200">
                {formatCurrency(entry.debit)}
              </TableCell>

              <TableCell className="text-start text-sm border-r border-gray-200">
                {formatCurrency(entry.credit)}
              </TableCell>

              {/* <TableCell className="text-start text-sm border-r border-gray-200">
                {formatCurrency(entry.difference)}
              </TableCell> */}

              <TableCell className="text-start text-sm">
                {truncateText(entry.description, 40)}
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
              {[2, 10, 15, 25, 50].map(n => (
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