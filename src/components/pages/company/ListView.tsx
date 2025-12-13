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
import type { ICompany } from "@/types/company"
import { useMongoUser } from "@/context/UserContext"
import axios from "axios"

interface ListViewProps{
  onRowClick?: (id: string) => void
  companies: ICompany[]
  loading: boolean
}

interface CompanyStats {
  likeCount: number
  hasLiked: boolean
  commentCount: number
}

export default function ListView({ onRowClick, companies=[], loading }: ListViewProps) {
  const [localCompanies, setLocalCompanies] = useState<ICompany[]>([])
  const [companyStats, setCompanyStats] = useState<Record<string, CompanyStats>>({})
  const [loadingStats, setLoadingStats] = useState(false)
  const { mongoUser } = useMongoUser()

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  // Checkbox
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

  useEffect(() => {
    setLocalCompanies(companies)
  }, [companies])

  // Fetch stats for all companies in bulk
  const fetchCompanyStats = useCallback(async (companyIds: string[]) => {
    if (!companyIds.length || !mongoUser?._id) return

    setLoadingStats(true)
    try {
      // Fetch likes and comments in parallel
      const [likesResponse, commentsResponse] = await Promise.all([
        axios.get("/api/user/likes/bulk", {
          params: {
            companyIds: companyIds.join(','),
            userId: mongoUser._id
          }
        }),
        axios.get("/api/user/activity/count/bulk", {
          params: {
            companyIds: companyIds.join(','),
            activityType: "comment"
          }
        })
      ])

      console.log("the comment response: ", commentsResponse.data)
      console.log("the likes response: ", likesResponse.data)

      if (likesResponse.data.success && commentsResponse.data.success) {
        const stats: Record<string, CompanyStats> = {}
        
        companyIds.forEach(companyId => {
          console.log("comments for each of company: ", commentsResponse.data.data[companyId])
          stats[companyId] = {
            likeCount: likesResponse.data.data[companyId]?.likeCount || 0,
            hasLiked: likesResponse.data.data[companyId]?.hasLiked || false,
            commentCount: commentsResponse.data.data[companyId] || 0
          }
        })

        setCompanyStats(prev => ({ ...prev, ...stats }))
      }
    } catch (error) {
      console.error("Error fetching company stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }, [mongoUser?._id])

  // Fetch stats when companies change
  useEffect(() => {
    if (localCompanies.length > 0 && mongoUser?._id) {
      const companyIds = localCompanies.map(comp => comp._id)
      fetchCompanyStats(companyIds)
    }
  }, [localCompanies, mongoUser?._id, fetchCompanyStats])

  // Handle like toggle
  const handleLikeToggle = async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    
    if (!mongoUser?._id) return

    const currentStats = companyStats[companyId]
    if (!currentStats) return

    // Optimistic update
    setCompanyStats(prev => ({
      ...prev,
      [companyId]: {
        ...currentStats,
        hasLiked: !currentStats.hasLiked,
        likeCount: currentStats.hasLiked 
          ? currentStats.likeCount - 1 
          : currentStats.likeCount + 1
      }
    }))

    try {
      const response = await axios.post("/api/user/likes", { 
        companyId, 
        userId: mongoUser._id 
      })

      if (!response.data.success) {
        // Revert on error
        setCompanyStats(prev => ({
          ...prev,
          [companyId]: currentStats
        }))
        console.error("Failed to toggle like:", response.data.error)
      }
    } catch (error) {
      // Revert on error
      setCompanyStats(prev => ({
        ...prev,
        [companyId]: currentStats
      }))
      console.error("Error toggling like:", error)
    }
  }

  // Toggle individual checkbox
  const handleCheckboxToggle = (companyId: string, checked: boolean) => {
    setSelectedCompanies(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(companyId)
      } else {
        newSelected.delete(companyId)
      }
      setIsAllSelected(newSelected.size === localCompanies.length)
      return newSelected
    })
  }

  // Toggle all checkboxes
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allCompanyIds = new Set(localCompanies.map(comp => comp._id))
      setSelectedCompanies(allCompanyIds)
      setIsAllSelected(true)
    } else {
      setSelectedCompanies(new Set())
      setIsAllSelected(false)
    }
  }

  // Reset pagination when loading
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1)
    }
  }, [loading])

  // Helper function to get parent company name
  const getParentCompanyName = (company: ICompany, allCompanies: ICompany[]): string => {
    if (!company.parentCompany) return "—"
    const parent = allCompanies.find(comp => comp._id === company.parentCompany)
    return parent?.companyName || "—"
  }

  if (loading) return <p className="text-center py-8">Loading companies...</p>
  if (!localCompanies.length) return <p className="text-center py-8 text-gray-600">No companies found</p>

  const totalCompanies = localCompanies.length
  const totalPages = Math.max(1, Math.ceil(totalCompanies / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const currentCompanies = localCompanies.slice(startIndex, startIndex + rowsPerPage)

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
    <div className="w-full border rounded-2xl overflow-x-auto space-y-6 no-scrollbar">
      <Table className="overflow-hidden w-full">
        <TableHeader>
          <TableRow className="w-full h-10 bg-gray-200">
            <TableHead className="w-8 pl-4">
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
            <TableHead className="w-1/4 text-primary-dull pl-4 align-middle">Company</TableHead>
            <TableHead className="w-1/5 text-primary-dull">Country</TableHead>
            <TableHead className="w-1/5 text-primary-dull">Parent Company</TableHead>
            <TableHead className="w-1/5 text-primary-dull">Type</TableHead>
            <TableHead className="w-1/5 text-primary-dull text-end pr-4">
              {currentCompanies.length} of {totalCompanies}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentCompanies.map(company => {
            const stats = companyStats[company._id] || { likeCount: 0, hasLiked: false, commentCount: 0 }
            
            return (
              <TableRow 
                key={company._id} 
                className="h-12 cursor-pointer hover:bg-gray-100" 
              >
                <TableCell className="w-8 px-4">
                    <Checkbox
                      checked={selectedCompanies.has(company._id)}
                      onCheckedChange={(checked) => handleCheckboxToggle(company._id, checked as boolean)}
                      className="w-4 h-4 cursor-pointer
                    data-[state=checked]:bg-primary-dull 
                    data-[state=checked]:border-primary-dull 
                    data-[state=checked]:text-white"
                    />
                </TableCell>

                <TableCell 
                  className="font-medium pl-4"
                  onClick={() => onRowClick?.(company._id)}
                >
                  
                   {company.companyName}
                 
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(company._id)}
                >
                  {company.country || "—"}
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(company._id)}
                >
                  {getParentCompanyName(company, localCompanies)}
                </TableCell>

                <TableCell
                  onClick={() => onRowClick?.(company._id)}
                >
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      company.isGroup 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {company.isGroup ? "Parent" : "Regular"}
                  </span>
                </TableCell>

                <TableCell 
                  className="flex justify-end"
                  onClick={() => onRowClick?.(company._id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-gray-400">
                      {getTimeAgo(company.updatedAt)}
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
                        onClick={(e) => handleLikeToggle(company._id, e)}
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