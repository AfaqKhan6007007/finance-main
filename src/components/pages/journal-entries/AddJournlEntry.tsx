"use client"
import { useState, useEffect } from "react"
import { useRouter} from "next/navigation"
import axios from "axios"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Menu, ChevronsLeft } from "lucide-react"
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast, showWarningToast } from "@/lib/toast"
import { IAccount } from "@/types/account"
// import { useSearchParams } from "next/navigation"
import AttachmentSidebar from "../../layout/AttachmentSidebar"
import CommentAndActivity from "../../layout/CommentAndActivity"
import { useMongoUser } from "@/context/UserContext"
import { IUser } from "@/types/user"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { IJournalEntry } from "@/types/journalEntry"



type JournalEntryFormProps = {
  mode?: string
  journalEntry?: IJournalEntry,
  accounts?: IAccount[]
  onJournalEntrySaved?: () => void
}

export default function JournalEntryForm({ 
  mode = "new", 
  journalEntry, 
  accounts, 
  onJournalEntrySaved 
}: JournalEntryFormProps) {
    
  const router = useRouter()
//   const searchParams = useSearchParams()
  const [showAddFormSidebar, setShowAddFormSidebar] = useState(false)
  const [errors, setErrors] = useState<{ 
    account?: string;
    debit?: string; 
    credit?: string; 
    date?: string;
  }>({})
  const [loading, setIsLoading] = useState(false)

  // Track unsaved changes in edit mode
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<IJournalEntry | null>(null)

  const [users, setUsers] = useState<IUser[]>([])
  const { mongoUser } = useMongoUser()

  // Filter out group accounts and disabled accounts
  const [filteredAccounts, setFilteredAccounts] = useState<IAccount[]>([])

  const [formData, setFormData] = useState({
    id: journalEntry?.id || "",
    date: journalEntry?.date ? new Date(journalEntry.date) : new Date(),
    account: journalEntry?.account || "", // Using account for selection
    debit: journalEntry?.debit || 0,
    credit: journalEntry?.credit || 0,
    description: journalEntry?.description || "",
    editedBy: journalEntry?.editedBy || '',
  })

  // Filter accounts on component mount and when accounts prop changes
  useEffect(() => {
    if (accounts) {
      const filtered = accounts.filter(acc => 
        acc.isGroup === false && 
        acc.disable === false &&
        acc.createdBy !== "Administrator"
      )
      setFilteredAccounts(filtered)
    }
  }, [accounts])

  // Set original data when journalEntry changes
  useEffect(() => {
    if (journalEntry) {
      setOriginalData(journalEntry)
      setFormData({
        id: journalEntry.id || "",
        date: journalEntry.date ? new Date(journalEntry.date) : new Date(),
        account: journalEntry.account || "", // Default to debit account
        debit: journalEntry.debit || 0,
        credit: journalEntry.credit || 0,
        description: journalEntry.description || "",
        editedBy: journalEntry.editedBy || '',
      })
    }

    const fetchAllUsers = async () => {
      try {
        const usersResponse = await axios.get('/api/user/fetchDbUsers/getAllUsers')
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        showErrorToast("Failed to load activities")
      }
    }

    fetchAllUsers()
  }, [journalEntry])

  // Check for changes whenever formData changes in edit mode
  useEffect(() => {
    if (mode === "edit" && originalData) {
      const formDate = new Date(formData.date);
      const originalDate = new Date(originalData.date);
      console.log("the date shown on frontend: ", formData.date)
      const changesDetected = 
        formDate.getTime() !== originalDate.getTime() ||
        formData.account !== originalData.account ||
        formData.debit !== originalData.debit ||
        formData.credit !== originalData.credit ||
        formData.description !== originalData.description

      setHasChanges(changesDetected)
    }
  }, [formData, originalData, mode])

  const handleInputChange = (field: keyof typeof formData, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle numeric input with proper formatting
  const handleNumericInput = (field: 'debit' | 'credit', value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : numericValue;
    
    // Convert to number, but keep as string for input to avoid formatting issues
    const numValue = formattedValue === '' ? 0 : parseFloat(formattedValue);
    
    setFormData(prev => ({
      ...prev,
      [field]: numValue,
    }))
  }

  const handleSave = async () => {
    const newErrors: typeof errors = {}

    if (!formData.account.trim()) newErrors.account = "Account is required"
    if (formData.debit < 0) newErrors.debit = "Debit amount cannot be negative"
    if (formData.credit < 0) newErrors.credit = "Credit amount cannot be negative"
    if (!formData.date) newErrors.date = "Date is required"

    // Check that at least one amount is entered
    if (formData.debit <= 0 && formData.credit <= 0) {
      newErrors.debit = "Either debit or credit amount must be greater than 0"
      newErrors.credit = "Either debit or credit amount must be greater than 0"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showErrorToast("Please fill all required fields correctly")
      return
    }

    if (mode === "edit" && !hasChanges) {
      showWarningToast("No changes to save")
      return
    }

    const loadingToast = showLoadingToast("Saving journal entry...")
    setIsLoading(true)

    try {
      
      // Prepare data for API - convert back to debit/credit account structure
      const apiData = {
        ...formData,
        debitAccount: formData.account,
        creditAccount: formData.account, // Using same account for both in this simplified version
        amount: Math.max(formData.debit, formData.credit), // Use the larger amount
        editedBy: mongoUser?._id,
        userId: mongoUser?._id,
      }

      if (mode === "edit" && journalEntry?._id) {
        // Edit mode
        console.log("the edit mode in working: ", journalEntry._id)
        await axios.patch(`/api/user/journal-entry/${journalEntry._id}`, apiData, {
          headers: { "Content-Type": "application/json" },
        })
        
        showSuccessToast("Journal entry updated successfully");
        onJournalEntrySaved?.()
      } else {
        console.log('the new mode in working a new journal entry');
        let journalId = null
        // New journal entry mode
        try{
          const res = await axios.post("/api/user/journal-entry", {
            ...apiData,
            createdBy: mongoUser?._id
          })
          journalId = res.data.data._id
        } catch{
          showErrorToast("Error in creating journal")
        }

        try{
          // Create activity for this
          await axios.post("/api/user/activity", {
            journalId,
            userId: mongoUser?._id,
            activityType: 'create'
          })
          showSuccessToast("Journal entry saved successfully")
        }catch{
          showErrorToast("Error in creating activity.")
        }

        // Reset changes flag after successful save
        setHasChanges(false)
        onJournalEntrySaved?.()
        goToList()
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data.error || "Failed to save journal entry")
      } else if (error instanceof Error) {
        showErrorToast(error.message)
      } else {
        showErrorToast("Failed to save journal entry")
      }
    } finally {
      dismissToast(loadingToast)
      setIsLoading(false)
    }
  }

  const goToList = () => {
    const params = new URLSearchParams()
    params.set("mode", "list")
    router.push(`?${params.toString()}`)
  }

  // Function to render status tag
  const renderStatusTag = () => {
    if (mode === "edit") {
      if (hasChanges) {
        return (
          <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium ml-2">
            Not Saved
          </span>
        )
      } else {
        return (
          <span className="inline-block bg-primary-dull/70 text-white text-xs px-2 py-1 rounded-full font-medium ml-2">
            Saved
          </span>
        )
      }
    }
    return null
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-8 pb-16">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                onClick={goToList}
                className="text-sm font-medium hover:underline hover:text-primary-dull cursor-pointer"
              >
                Journal Entry
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-muted-foreground">
              {mode === "edit" ? "Edit Journal Entry" : "New Journal Entry"}
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="relative cursor-pointer group"
            onClick={() => setShowAddFormSidebar(prev => !prev)}
          >
            <Menu
              size={20}
              className="text-primary-dull transition-opacity duration-200 ease-in-out group-hover:opacity-0"
            />
            <ChevronsLeft
              size={20}
              className="text-primary-dull absolute top-0 left-0 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100"
            />
          </div>
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold text-primary-dull">
              {mode === "edit" ? (journalEntry?.id || "Edit Journal Entry") : "New Journal Entry"}
            </h2>
            {renderStatusTag()}
          </div>
        </div>
        <Button
          onClick={handleSave}
          className={`bg-primary-medium hover:bg-[--color-primary-bright] text-white ${
            loading ? 'disabled disabled:opacity-50 disabled:cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          Save
        </Button>
      </div>

      <div className="w-full flex flex-col md:flex-row ">
        {/* Sidebar */}
        <div
          className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
            showAddFormSidebar ? "flex w-full md:w-1/5 opacity-100" : "w-0 after:absolute after:inset-0 after:bg-gray-50"
          } `}
        >
          {mode === 'edit' && 
            <AttachmentSidebar 
              id={journalEntry?._id}
              journal={journalEntry}
              users={users}
            />
          }
        </div>
        
        {/* Form and activity */}
        <div 
          className={`transition-all duration-300 ease-in-out flex flex-col gap-6 ${
            showAddFormSidebar ? "md:w-4/5" : "w-full"
          } `}
        >
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 border p-4 rounded-xl shadow">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Auto-generated Number */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="entry-number">Entry Number</Label>
                <Input
                  id="entry-number"
                  placeholder="Auto-generated"
                  value={formData.id}
                  className="bg-gray-50"
                  readOnly={true}
                />
                <p className="text-sm text-gray-500">
                  This number will be automatically generated
                </p>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && handleInputChange("date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
              </div>

              {/* Account Selection */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="account">
                  Account <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={val => handleInputChange("account", val)}
                  value={formData.account}
                >
                  <SelectTrigger id="account" className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAccounts.map(acc => (
                      <SelectItem key={acc._id} value={acc._id}>
                        {acc.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.account && <p className="text-red-500 text-sm">{errors.account}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Debit Amount */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="debit">
                  Debit Amount
                </Label>
                <Input
                  id="debit"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.debit === 0 ? '' : formData.debit.toString()}
                  onChange={e => handleNumericInput('debit', e.target.value)}
                  onBlur={(e) => {
                    // Format on blur
                    if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                      const value = parseFloat(e.target.value);
                      setFormData(prev => ({ ...prev, debit: value }));
                    }
                  }}
                />
                {errors.debit && <p className="text-red-500 text-sm">{errors.debit}</p>}
              </div>

              {/* Credit Amount */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="credit">
                  Credit Amount
                </Label>
                <Input
                  id="credit"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.credit === 0 ? '' : formData.credit.toString()}
                  onChange={e => handleNumericInput('credit', e.target.value)}
                  onBlur={(e) => {
                    // Format on blur
                    if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                      const value = parseFloat(e.target.value);
                      setFormData(prev => ({ ...prev, credit: value }));
                    }
                  }}
                />
                {errors.credit && <p className="text-red-500 text-sm">{errors.credit}</p>}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description for this journal entry"
                  value={formData.description}
                  onChange={e => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Comments and activity */}
          {mode === 'edit' && <CommentAndActivity id={journalEntry?._id} users={users} activityId="journalId" />}
        </div>
      </div>
    </div>
  )
}