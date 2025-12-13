"use client"
import { useState, useEffect, useCallback } from "react"
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
import type { IAccount } from "@/types/account"
import { useMongoUser } from "@/context/UserContext"
import axios from "axios"

interface ListViewProps{
  onRowClick?: (id: string) => void
  accounts: IAccount[]
  loading: boolean
}

interface AccountStats {
  likeCount: number
  hasLiked: boolean
  commentCount: number
}

export default function ListView({ onRowClick, accounts=[], loading }: ListViewProps) {
  const [localAccounts, setLocalAccounts] = useState<IAccount[]>([])
  const [accountStats, setAccountStats] = useState<Record<string, AccountStats>>({})
  const [loadingStats, setLoadingStats] = useState(false)
  const { mongoUser } = useMongoUser()

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  // checkbox
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

  useEffect(() => {
    setLocalAccounts(accounts)
  }, [accounts])

  // Fetch stats for all accounts in bulk
  const fetchAccountStats = useCallback(async (accountIds: string[]) => {
    if (!accountIds.length || !mongoUser?._id) return

    setLoadingStats(true)
    try {
      // Fetch likes and comments in parallel
      const [likesResponse, commentsResponse] = await Promise.all([
        axios.get("/api/user/likes/bulk", {
          params: {
            accountIds: accountIds.join(','),
            userId: mongoUser._id
          }
        }),
        axios.get("/api/user/activity/count/bulk", {
          params: {
            accountIds: accountIds.join(','),
            activityType: "comment"
          }
        })
      ])

      console.log("the comment response: ", commentsResponse.data)
      console.log("the likes response: ", likesResponse.data)

      if (likesResponse.data.success && commentsResponse.data.success) {
        const stats: Record<string, AccountStats> = {}
        
        accountIds.forEach(accountId => {
          console.log("comments for each of account: ", commentsResponse.data.data[accountId])
          stats[accountId] = {
            likeCount: likesResponse.data.data[accountId]?.likeCount || 0,
            hasLiked: likesResponse.data.data[accountId]?.hasLiked || false,
            commentCount: commentsResponse.data.data[accountId] || 0
          }
        })

        setAccountStats(prev => ({ ...prev, ...stats }))
      }
    } catch (error) {
      console.error("Error fetching account stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }, [mongoUser?._id])

  // Fetch stats when accounts change
  useEffect(() => {
    if (localAccounts.length > 0 && mongoUser?._id) {
      const accountIds = localAccounts.map(acc => acc._id)
      fetchAccountStats(accountIds)
    }
  }, [localAccounts, mongoUser?._id, fetchAccountStats])

  // Handle like toggle
  const handleLikeToggle = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    
    if (!mongoUser?._id) return

    const currentStats = accountStats[accountId]
    if (!currentStats) return

    // Optimistic update
    setAccountStats(prev => ({
      ...prev,
      [accountId]: {
        ...currentStats,
        hasLiked: !currentStats.hasLiked,
        likeCount: currentStats.hasLiked 
          ? currentStats.likeCount - 1 
          : currentStats.likeCount + 1
      }
    }))

    try {
      const response = await axios.post("/api/user/likes", { 
        accountId, 
        userId: mongoUser._id 
      })

      if (!response.data.success) {
        // Revert on error
        setAccountStats(prev => ({
          ...prev,
          [accountId]: currentStats
        }))
        console.error("Failed to toggle like:", response.data.error)
      }
    } catch (error) {
      // Revert on error
      setAccountStats(prev => ({
        ...prev,
        [accountId]: currentStats
      }))
      console.error("Error toggling like:", error)
    }
  }

  // Toggle individual checkbox - updated for shadcn Checkbox
  const handleCheckboxToggle = (accountId: string, checked: boolean) => {
    setSelectedAccounts(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(accountId)
      } else {
        newSelected.delete(accountId)
      }
      setIsAllSelected(newSelected.size === localAccounts.length)
      return newSelected
    })
  }

  // Toggle all checkboxes - updated for shadcn Checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allAccountIds = new Set(localAccounts.map(acc => acc.id))
      setSelectedAccounts(allAccountIds)
      setIsAllSelected(true)
    } else {
      setSelectedAccounts(new Set())
      setIsAllSelected(false)
    }
  }

  // Reset pagination when loading
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

  return (
    <div className="w-full  border rounded-2xl overflow-x-auto space-y-6 no-scrollbar">
      <Table className="overflow-hidden w-full">
        <TableHeader>
          <TableRow className="w-full h-10 bg-gray-200">
            <TableHead className="w-8 pl-4 ">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="w-4 h-4 cursor-pointer
                  bg-gray-50
                  data-[state=checked]:bg-primary-dull 
                  data-[state=checked]:border-primary-dull 
                  data-[state=checked]:text-white"
                />
            </TableHead>
            <TableHead className="w-1/5 text-primary-dull pl-4 align-middle">ID</TableHead>
            <TableHead className="w-1/5 text-primary-dull">Account Name</TableHead>
            <TableHead className="w-1/5 text-primary-dull">Account Number</TableHead>

            <TableHead className="w-1/5 text-primary-dull">Type</TableHead>
            <TableHead className="w-1/5 text-primary-dull text-end pr-4">
              {currentAccounts.length} of {totalAccounts}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentAccounts.map(acc => {
            const stats = accountStats[acc._id] || { likeCount: 0, hasLiked: false, commentCount: 0 }
            
            return (
              <TableRow 
                key={acc.id} 
                className="h-12 cursor-pointer hover:bg-gray-100" 
              >

                <TableCell className="w-8 px-4">
                    <Checkbox
                      checked={selectedAccounts.has(acc.id)}
                      onCheckedChange={(checked) => handleCheckboxToggle(acc.id, checked as boolean)}
                      className="w-4 h-4 cursor-pointer
                    data-[state=checked]:bg-primary-dull 
                    data-[state=checked]:border-primary-dull 
                    data-[state=checked]:text-white"
                    />
                </TableCell>

                <TableCell 
                  className="font-medium"
                   onClick={() => onRowClick?.(acc.id)}
                >
                  {acc.id}
                </TableCell>

                <TableCell
                 className="truncate max-w-[200px]"
                  onClick={() => onRowClick?.(acc.id)}
                >
                  {acc.accountName}
                </TableCell>

                <TableCell
                   onClick={() => onRowClick?.(acc.id)}
                >{acc.accountNumber ?? "—"}</TableCell>

                <TableCell
                   onClick={() => onRowClick?.(acc.id)}
                >
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      acc.rootType === 'Asset' ? "bg-green-100 text-green-700" :
                      acc.rootType === 'Liability' ? "bg-red-100 text-red-700" :
                      acc.rootType === 'Equity' ? "bg-purple-200 text-purple-700" :
                      acc.rootType === 'Income' ? "bg-blue-100 text-blue-700" :
                      acc.rootType === 'Expense' ? "bg-orange-100 text-orange-700" :
                      "bg-black text-white"
                    }`}
                  >
                    {acc.rootType}
                  </span>
                </TableCell>

                <TableCell 
                  className="flex justify-end"
                  onClick={() => onRowClick?.(acc.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-gray-400">
                      {getTimeAgo(acc.createdAt)}
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
                        onClick={(e) => handleLikeToggle(acc.id, e)}
                      />
                      {/* if want to show the no of likes uncomment this */}
                      {/* <span className="text-sm">{stats.likeCount}</span> */}
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