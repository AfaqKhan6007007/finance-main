// components/pages/journal-entries/ListView.tsx
"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
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
import { MessageSquare, Heart } from "lucide-react"
import type { IJournalEntry } from "@/types/journalEntry"
import { useMongoUser } from "@/context/UserContext"
import axios from "axios"
import { IAccount } from "@/types/account"

interface ListViewProps{
  onRowClick?: (id: string) => void
  journalEntries: IJournalEntry[]
  loading: boolean
  accounts: IAccount[]
}

interface EntryStats {
  likeCount: number
  hasLiked: boolean
  commentCount: number

}

export default function ListView({ onRowClick, journalEntries=[], loading, accounts }: ListViewProps) {
  const [localEntries, setLocalEntries] = useState<IJournalEntry[]>([])
  const [entryStats, setEntryStats] = useState<Record<string, EntryStats>>({})
  const [loadingStats, setLoadingStats] = useState(false)
  const { mongoUser } = useMongoUser()

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

  const accountLookup = useMemo(() => {
    const lookup: Record<string, string> = {}
    accounts?.forEach(account => {
      if (account._id) {
        lookup[account._id] = account.accountName
      }
    })
    return lookup
  }, [accounts])

  useEffect(() => {
    setLocalEntries(journalEntries)
  }, [journalEntries])

  useEffect(() => {
    console.log("the data of accounts in useEffect: ", accounts);
  },[accounts])

  const fetchEntryStats = useCallback(async (entryIds: string[]) => {
    if (!entryIds.length || !mongoUser?._id) return

    setLoadingStats(true)
    try {
      const [likesResponse, commentsResponse] = await Promise.all([
        axios.get("/api/user/likes/bulk", {
          params: {
            entryIds: entryIds.join(','),
            userId: mongoUser._id
          }
        }),
        axios.get("/api/user/activity/count/bulk", {
          params: {
            entryIds: entryIds.join(','),
            activityType: "comment"
          }
        })
      ])

      if (likesResponse.data.success && commentsResponse.data.success) {
        const stats: Record<string, EntryStats> = {}
        
        entryIds.forEach(entryId => {
          stats[entryId] = {
            likeCount: likesResponse.data.data[entryId]?.likeCount || 0,
            hasLiked: likesResponse.data.data[entryId]?.hasLiked || false,
            commentCount: commentsResponse.data.data[entryId] || 0
          }
        })

        setEntryStats(prev => ({ ...prev, ...stats }))
      }
    } catch (error) {
      console.error("Error fetching entry stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }, [mongoUser?._id])

  useEffect(() => {
    if (localEntries.length > 0 && mongoUser?._id) {
      const entryIds = localEntries.map(entry => entry._id || entry.id)
      fetchEntryStats(entryIds)
    }
  }, [localEntries, mongoUser?._id, fetchEntryStats])

  const handleLikeToggle = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!mongoUser?._id) return

    const currentStats = entryStats[entryId]
    if (!currentStats) return

    setEntryStats(prev => ({
      ...prev,
      [entryId]: {
        ...currentStats,
        hasLiked: !currentStats.hasLiked,
        likeCount: currentStats.hasLiked 
          ? currentStats.likeCount - 1 
          : currentStats.likeCount + 1
      }
    }))

    try {
      const response = await axios.post("/api/user/likes", { 
        entryId, 
        userId: mongoUser._id 
      })

      if (!response.data.success) {
        setEntryStats(prev => ({
          ...prev,
          [entryId]: currentStats
        }))
        console.error("Failed to toggle like:", response.data.error)
      }
    } catch (error) {
      setEntryStats(prev => ({
        ...prev,
        [entryId]: currentStats
      }))
      console.error("Error toggling like:", error)
    }
  }

  const handleCheckboxToggle = (entryId: string, checked: boolean) => {
    setSelectedEntries(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(entryId)
      } else {
        newSelected.delete(entryId)
      }
      setIsAllSelected(newSelected.size === localEntries.length)
      return newSelected
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allEntryIds = new Set(localEntries.map(entry => entry.id))
      setSelectedEntries(allEntryIds)
      setIsAllSelected(true)
    } else {
      setSelectedEntries(new Set())
      setIsAllSelected(false)
    }
  }

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

  const getTimeAgo = (date?: string | Date) => {
    if (!date) return "0m"
    const createdTs = new Date(date).getTime()
    if (Number.isNaN(createdTs)) return "0m"

    const diffSeconds = Math.floor((Date.now() - createdTs) / 1000)

    if (diffSeconds < 60) return `${diffSeconds}s`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d`
    if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)}mo`
    return `${Math.floor(diffSeconds / 31536000)}y`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const truncateText = (text: string | undefined | null, maxLength: number = 20) => {
    if (!text || text === "none") return "---"
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

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
            <TableHead className="w-1/7 text-primary-dull pl-4">ID</TableHead>
            <TableHead className="w-1/7 text-primary-dull">Posting Date</TableHead>
            <TableHead className="w-1/7 text-primary-dull">Account</TableHead>
            <TableHead className="w-1/7 text-primary-dull">Debit</TableHead>
            <TableHead className="w-1/7 text-primary-dull">Credit</TableHead>
            <TableHead className="w-1/7 text-primary-dull">Description</TableHead>
            <TableHead className="w-1/7 text-primary-dull text-end pr-4">
              {currentEntries.length} of {totalEntries}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentEntries.map(entry => {
            const stats = entryStats[entry._id || entry.id] || { likeCount: 0, hasLiked: false, commentCount: 0 }
            console.log("the entry.account value: ", entry.account)
            console.log("the look up for the account: ", accountLookup)
            const accountName = entry.account ? accountLookup[entry.account] : "No Account"
            console.log("the account name from the lookup: ", accountName);
            console.log("the props of the account: ", accounts)
            
            return (
              <TableRow 
                key={entry.id} 
                className="h-12 cursor-pointer hover:bg-gray-100" 
              >
                <TableCell className="w-8 px-4">
                    <Checkbox
                      checked={selectedEntries.has(entry.id)}
                      onCheckedChange={(checked) => handleCheckboxToggle(entry.id, checked as boolean)}
                      className="w-4 h-4 cursor-pointer data-[state=checked]:bg-primary-dull data-[state=checked]:border-primary-dull data-[state=checked]:text-white"
                    />
                </TableCell>

                <TableCell 
                  className="font-medium"
                  onClick={() => onRowClick?.(entry.id)}
                >
                  {entry.id}
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(entry.id)}
                >
                  {new Date(entry.date).toLocaleDateString()}
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(entry.id)}
                >
                  {accountName}
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(entry.id)}
                   className="font-medium text-blue-500"
                >
                  {formatCurrency(entry.credit)}
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(entry.id)}
                   className="font-medium text-primary-medium"
                >
                  {formatCurrency(entry.debit)}
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(entry.id)}
                   
                >
                  {truncateText(entry.description,40)}
                </TableCell>

                <TableCell 
                  className="flex justify-end"
                  onClick={() => onRowClick?.(entry.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-gray-400">
                      {getTimeAgo(entry.createdAt)}
                    </span>

                    <div className="flex items-center gap-1 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">{stats.commentCount}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Heart 
                        className={`w-4 h-4 cursor-pointer ${
                          stats.hasLiked 
                            ? "text-red-600 fill-red-600" 
                            : "text-gray-600"
                        } ${loadingStats ? "opacity-50" : ""}`}
                        onClick={(e) => handleLikeToggle(entry._id || entry.id, e)}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
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
              {[2,10, 15, 25, 50].map(n => (
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