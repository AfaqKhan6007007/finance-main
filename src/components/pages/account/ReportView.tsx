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
import type { IAccount } from "@/types/account"

interface ReportViewProps {
  onRowClick?: (id: string) => void
  accounts: IAccount[]
  loading: boolean
}

export default function ReportView({ onRowClick, accounts = [], loading }: ReportViewProps) {
  
  const [localAccounts, setLocalAccounts] = useState<IAccount[]>([])

  useEffect(() => {
    setLocalAccounts(accounts)
  }, [accounts])

  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  useEffect(() => {
    if (!loading) {
      setCurrentPage(1)
    }
  }, [loading])

  if (loading) return <p className="text-center py-8">Loading accounts...</p>
  if (!localAccounts.length) return <p className="text-center py-8 text-gray-600">No accounts found</p>

  const totalAccounts = localAccounts.length
  const totalPages = Math.max(1, Math.ceil(totalAccounts / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const currentAccounts = localAccounts.slice(startIndex, startIndex + rowsPerPage)

  const truncateText = (text: string | undefined | null, maxLength: number = 20) => {
    if (!text || text === "none") return "---"
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }


  return (
    <div className="w-full border border-gray-300 rounded-2xl overflow-x-auto space-y-6 no-scrollbar">
      <Table className="border-collapse rounded overflow-hidden w-full">
        <TableHeader>
          <TableRow className="w-full h-10 bg-gray-200 border-b border-gray-300">
            <TableHead className="text-primary-dull text-start border-r border-gray-300"></TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">ID</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Status</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Account Name</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Account Number</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Company</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Root Type</TableHead>
            <TableHead className="text-primary-dull text-start border-r border-gray-300">Report Type</TableHead>
            <TableHead className="text-primary-dull text-start pr-4">Account Type</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="">
          {currentAccounts.map((acc, index) => (
            <TableRow 
              key={acc.id} 
              className="h-12 cursor-pointer hover:bg-gray-100 border-b border-gray-200" 
              onClick={() => onRowClick?.(acc.id)}
            >
              {/* No - Sequential number */}
              <TableCell className="text-center  text-sm border-r border-gray-200 p-1">
                {startIndex + index + 1}
              </TableCell>

              {/* ID */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(acc.id, 8)}
              </TableCell>

              {/* Status */}
              <TableCell className="text-start border-r border-gray-200">
                <span
                  className={`px-2 py-1 rounded-full text-xs`}
                >
                  {acc.disable ? "Disabled" : "Enabled"}
                </span>
              </TableCell>

              {/* Account Name */}
              <TableCell className="text-start text-sm truncate max-w-[120px] border-r border-gray-200" title={acc.accountName}>
                {truncateText(acc.accountName, 25)}
              </TableCell>

              {/* Account Number */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {acc.accountNumber ? truncateText(acc.accountNumber, 15) : "---"}
              </TableCell>

              {/* Company */}
              <TableCell className="text-start text-sm truncate max-w-[120px] border-r border-gray-200" title={acc.company}>
                {truncateText(acc.company, 25)}
              </TableCell>

              {/* Root Type */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(acc.rootType, 12)}
              </TableCell>

              {/* Report Type */}
              <TableCell className="text-start text-sm border-r border-gray-200">
                {truncateText(acc.reportType, 12)}
              </TableCell>

              {/* Account Type */}
              <TableCell className="text-start text-sm">
                {truncateText(acc.accountType, 12)}
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