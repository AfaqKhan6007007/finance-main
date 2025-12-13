"use client"
import { useState, useEffect } from "react"
import { useRouter} from "next/navigation"
import axios from "axios"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, ChevronsLeft, MoreHorizontal, Trash2  } from "lucide-react"
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast, showWarningToast } from "@/lib/toast" // adjust path if needed
import { IAccount } from "@/types/account"
import {useSearchParams} from "next/navigation"
import AttachmentSidebar from "../../layout/AttachmentSidebar"
import CommentAndActivity from "../../layout/CommentAndActivity"
import { useMongoUser } from "@/context/UserContext"
import { IUser } from "@/types/user"
import { ICompany } from "@/types/company"

type AccountFormProps = {
  mode?: string
  account?: IAccount
  accounts?: IAccount[]
  onAccountSaved?: () => void
  onDeleteClick?: (accountId: IAccount) => void
}

export default function AccountForm({ mode = "new", account, accounts, onAccountSaved, onDeleteClick}: AccountFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAddFormSidebar, setShowAddFormSidebar] = useState(false)
  const [errors, setErrors] = useState<{ accountName?: string; parentAccount?: string; company?: string }>({})
  const [loading, setIsLoading] = useState(false); //this is for disabling the save button while saving

  const [parentAccounts, setParentAccounts] = useState<IAccount[]>([])

  // to track of unsaved changes in the edit mode
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<IAccount | null>(null)

  const [users, setUsers] = useState<IUser[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([])

  // get the params values if present like from kanban view
  const balanceMustBeParam = searchParams.get('balanceMustBe')
  const accountTypeParam = searchParams.get('accountType')
  const frozenTypeParam = searchParams.get('frozen')
  const reportTypeParam = searchParams.get('reportType')
  const rootTypeParam = searchParams.get('rootType')

  const {mongoUser} = useMongoUser();


  const [formData, setFormData] = useState({
    id: account?.id || "",
    disable: account?.disable || false,
    accountName: account?.accountName || "",
    accountNumber: account?.accountNumber || "",
    isGroup: account?.isGroup || false,
    company: account?.company || "",
    taxRate: account?.taxRate || "",
    currency: account?.currency || "none",
    parentAccount: account?.parentAccount || "",
    accountType: account?.accountType || accountTypeParam || "none",
    balanceMustBe: account?.balanceMustBe || balanceMustBeParam || "none",
    rootType: account?.rootType || rootTypeParam || "",
    reportType: account?.reportType || reportTypeParam || "",
    frozen: account?.frozen || frozenTypeParam || "no",
    editedBy: account?.editedBy || '',
  })

  // called from useEffect below, write this outside to make it reuseable
  const filterParentAccounts = () => {
    if (!accounts) return;

    // If no company is selected or company is "none", show empty
    if (!formData.company || formData.company === "none") {
      setParentAccounts([]);
      return;
    }
    
    const filtered = accounts.filter(acc => acc.isGroup === true && acc.company === formData.company);
    setParentAccounts(filtered);
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/user/company') 
      if (response.data.success) {
        setCompanies(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
      showErrorToast("Failed to load companies")
    }
  }

  // as on render account might be undefined so when we get account data we will update the form
  useEffect(() => {
    if (account) {
      setOriginalData(account)
      setFormData({
        id: account.id || "",
        disable: account.disable || false,
        accountName: account.accountName || "",
        accountNumber: account.accountNumber || "",
        isGroup: account.isGroup || false,
        company: account.company || "",
        taxRate: account.taxRate || "",
        currency: account.currency || "none",
        parentAccount: account.parentAccount || "",
        accountType: account.accountType || "none",
        balanceMustBe: account.balanceMustBe || "none",
        rootType: account.rootType || "",
        reportType: account.reportType || "",
        frozen: account.frozen || "no",
        editedBy: account.editedBy || '',
      })
    }

    
    const fetchAllUsers = async () =>{
      try{
        const usersResponse = await axios.get('/api/user/fetchDbUsers/getAllUsers');
          if (usersResponse.data.success) {
            setUsers(usersResponse.data.data);
          }
      }catch(error){
        console.error("Error fetching data:", error);
        showErrorToast("Failed to load activities");
      }
    }

    fetchAllUsers()
    fetchCompanies()
  }, [account, accounts, formData.company])

  useEffect(() => {
    filterParentAccounts()
  },[accounts, formData.company, account])

   // Check for changes whenever formData changes in edit mode
  useEffect(() => {
    if (mode === "edit" && originalData) {
      const changesDetected = 
        formData.disable !== originalData.disable ||
        formData.accountName !== originalData.accountName ||
        formData.accountNumber !== originalData.accountNumber ||
        formData.isGroup !== originalData.isGroup ||
        formData.company !== originalData.company ||
        formData.taxRate !== originalData.taxRate ||
        formData.currency !== originalData.currency ||
        formData.parentAccount !== originalData.parentAccount ||
        formData.accountType !== originalData.accountType ||
        formData.balanceMustBe !== originalData.balanceMustBe ||
        formData.rootType !== originalData.rootType ||
        formData.reportType !== originalData.reportType ||
        formData.frozen !== originalData.frozen

      setHasChanges(changesDetected)
    }
  }, [formData, originalData, mode])



  const accountTypes = [
    "Accumulated Depreciation",
    "Asset Received But Not Billed",
    "Bank",
    "Cash",
    "Chargeable",
    "Capital Work in Progress",
    "Cost of Goods Sold",
    "Current Asset",
    "Current Liability",
    "Depreciation",
    "Direct Expense",
    "Direct Income",
    "Equity",
    "Expense Account",
    "Expenses Included In Asset Valuation",
    "Expenses Included In Valuation",
    "Fixed Asset",
    "Income Account",
    "Indirect Expense",
    "Indirect Income",
    "Liability",
    "Payable",
    "Receivable",
    "Round Off",
    "Round Off for Opening",
    "Stock",
    "Stock Adjustment",
    "Stock Received But Not Billed",
    "Service Received But Not Billed",
    "Tax",
    "Temporary",
  ]


  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    const newErrors: typeof errors = {}

    if (!formData.accountName.trim()) newErrors.accountName = "Account name is required"
    if (!formData.parentAccount.trim()) newErrors.parentAccount = "Parent account is required"
    if (!formData.company.trim()) newErrors.company = "Company is required"

    // Check if we have errors FIRST
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showErrorToast("Please fill all required fields")
      return  // Return early if there are errors
    }

    const selectedCompany = companies.find(comp => comp._id === formData.company)
    const companyInitials = selectedCompany?.companyName?.split(" ").map(word => word[0].toUpperCase()).join('') || '';
    formData.id = `${formData.accountNumber ? formData.accountNumber + " - " : ""}${formData.accountName} - ${companyInitials}`

    if(mode === "edit" && !hasChanges){
      showWarningToast("No changes to save")
      return
    }

    if (Object.keys(newErrors).length === 0) {
      const loadingToast = showLoadingToast("Saving account...");
      setIsLoading(true);
      try {
       if (mode === "edit" && account?._id) {
          // Edit mode - send PATCH request to update account
          await axios.patch(`/api/user/account/${account._id}`,{
            ...formData,
            editedBy: mongoUser?._id,
            userId: mongoUser?._id, //this is for the activity creation while edit 
          },{
            headers: { "Content-Type": "application/json" },
          })
          
          showSuccessToast("Account updated successfully")
        } else {
          // New account mode
          const res = await axios.post("/api/user/account", {
            ...formData,
            editedBy: mongoUser?._id,
            createdBy: mongoUser?._id
          })
          const accountId = res.data.data._id

          // make the activity for this
          await axios.post("/api/user/activity",{
            accountId,
            userId: mongoUser?._id,
            activityType: 'create'
          })
          showSuccessToast("Account saved successfully")
        }
        
        // Reset changes flag after successful save
        setHasChanges(false)

        onAccountSaved?.()
        goToList()
      } catch (error) {

          if (axios.isAxiosError(error)) {
            showErrorToast(error.response?.data.error || "Failed to save account");
          } else if (error instanceof Error) {
            showErrorToast(error.message);
          } else {
            showErrorToast("Failed to save account");
          }
      }finally{
        dismissToast(loadingToast);
        setIsLoading(false);
      }
    }
  }

  const goToList = () => {
      const params = new URLSearchParams()
      params.set("mode", "list")
      
      // If you want to keep specific parameters (example: 'view')
      // const currentView = searchParams.get("view")
      // if (currentView) {
      //   params.set("view", currentView)
      // }
      
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
          <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ml-2 ${
            formData.disable 
              ? "bg-gray-200 text-gray-600" 
              : "bg-primary-dull/70 text-white"
          }`}>
            {formData.disable ? "Disabled" : "Enabled"}
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
                Account
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-muted-foreground">
              {mode === "edit" ? "Edit Account" : "New Account"}
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
              {mode === "edit" ? (account?.id || "Edit Account") : "New Account"}
            </h2>
            {renderStatusTag()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {account && mode === "edit" &&
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="bg-gray-200 hover:bg-gray-300 hover:cursor-pointer h-8">
                <MoreHorizontal className="h-4 w-4 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {/* Add reload logic here */}}>
                Reload
              </DropdownMenuItem>
              { account?.createdBy !== "Administrator" &&
                <DropdownMenuItem 
                onClick={() => {/* Add delete logic here */}}
                className=""
              >
                <div className="flex w-full justify-between items-center cursor-pointer" onClick={() => onDeleteClick?.(account)}>
                  Delete <span><Trash2 size={16} className="text-red-600 focus:text-red-600" /></span>
                </div>
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>}

          {/* don't show save button if account is made by administrator */}
          {account?.createdBy !== "Administrator" &&
            <Button
              onClick={handleSave}
              className={`bg-primary-medium h-8 hover:bg-[--color-primary-bright] text-white ${loading ? 'disabled disabled:opacity-50 disabled:cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Save
            </Button>
          }
        </div>
        
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
              id = {account?._id}
              account = {account}
              users = {users}
            />}
        </div>
        
        {/* Form and activity */}
        <div 
          className={`transition-all duration-300 ease-in-out flex flex-col gap-6 ${
            showAddFormSidebar ? "md:w-4/5" : "w-full"
          } `}
        >
        
        { account?.createdBy === 'Administrator' &&
          <div className="bg-[#379281] text-white w-full rounded px-2 py-2 text-sm">This is a root account and cannot be edited.</div>
        }

        {/* Form */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 border p-4 rounded-xl shadow`}
        >
          {/* Left */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disable"
                checked={formData.disable}
                onCheckedChange={checked => handleInputChange("disable", !!checked)}
                className="
                  data-[state=checked]:bg-primary-dull 
                  data-[state=checked]:border-primary-dull 
                  data-[state=checked]:text-white
                "
              />
              <Label htmlFor="disable">Disable</Label>
            </div>

            {
              // only show while new account creation, in edit it will be shown in title
              !account
              &&
              <div className="flex flex-col gap-2">
              <Label htmlFor="account-name">
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account-name"
                placeholder="Enter account name"
                value={formData.accountName}
                onChange={e => handleInputChange("accountName", e.target.value)}
              />
              {errors.accountName && <p className="text-red-500 text-sm">{errors.accountName}</p>}
            </div>
            }

            {account?.createdBy !== "Administrator" &&
              <div className="flex flex-col gap-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                className={`${account ? 'bg-gray-200': ''}`}
                placeholder="Enter account number"
                value={formData.accountNumber}
                disabled= {!!account}
                onChange={e => handleInputChange("accountNumber", e.target.value)}
              />
            </div>}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-group"
                checked={formData.isGroup}
                onCheckedChange={checked => {
                  handleInputChange("isGroup", !!checked)
                }}
                 className={`
                  data-[state=checked]:bg-primary-dull 
                  data-[state=checked]:border-primary-dull 
                  data-[state=checked]:text-white

                  ${account ? 'data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500 data-[state=checked]:text-white bg-gray-200':''}
                `}
                disabled={!!account}
              />
              <Label htmlFor="is-group">Is Group</Label>
            </div>

            <div className="w-full flex flex-col gap-2">
              <Label htmlFor="company">
                Company <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(val) => {
                  if (val === "new") {
                    // Redirect to company creation page
                    router.push("/user/companies?mode=add-new");
                  } else {
                    handleInputChange("company", val);
                  }
                }}
                value={formData.company}
                disabled={mode === "edit" || !!account}
                
              >
                <SelectTrigger id="company" className={`w-full ${account ? 'bg-gray-200': ''}`}>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none"></SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company._id} value={company._id}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Create new company</SelectItem>
                </SelectContent>
              </Select>
              {errors.company && <p className="text-red-500 text-sm">{errors.company}</p>}
            </div>
            
            {/* show these in administrator account as it will not have any parent */}
            {(formData.parentAccount || (mode === "edit" && account?.createdBy === "Administrator")) && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="root-type">Root Type</Label>
                  <Input 
                    id="root-type" 
                    value={formData.reportType} 
                    className="border border-gray-300" 
                    disabled 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Input
                    id="report-type"
                    value={formData.rootType}
                    className="border border-gray-300"
                    disabled
                  />
                </div>
              </>
            )}

            {!formData.isGroup && (
              <div className="w-full flex flex-col gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  onValueChange={val => handleInputChange("currency", val)}
                  value={formData.currency}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"></SelectItem>
                    <SelectItem value="pkr">PKR</SelectItem>
                    <SelectItem value="sar">SAR</SelectItem>
                    <SelectItem value="usd">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div className="w-full flex flex-col gap-2">
              <Label htmlFor="parent-account">
                Parent Account <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(val) => {
                  handleInputChange("parentAccount", val);
                  
                  // Find the selected parent account from the accounts list
                  const selectedParentAccount = accounts?.find(acc => acc._id === val);
                  
                  if (selectedParentAccount) {
                    // Set reportType and rootType from the parent account
                    handleInputChange("rootType", selectedParentAccount.rootType || "");
                    handleInputChange("reportType", selectedParentAccount.reportType || "");
                  } else {
                    // Fallback to empty values if no parent found
                    handleInputChange("rootType", "");
                    handleInputChange("reportType", "");
                  }
                }}
                value={formData.parentAccount}
              >
                <SelectTrigger id="parent-account" className="w-full">
                  <SelectValue placeholder={
                    !formData.company || formData.company === "none" 
                      ? "Select company first" 
                      : "Select parent account"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {!formData.company || formData.company === "none" ? (
                    <SelectItem value="none" disabled>
                      Please select a company first
                    </SelectItem>
                  ) : parentAccounts.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No group accounts found for selected company
                    </SelectItem>
                  ) : (
                    parentAccounts?.map(acc => (
                      <SelectItem key={acc._id} value={acc._id}>{acc.id}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.parentAccount && <p className="text-red-500 text-sm">{errors.parentAccount}</p>}
            </div>

            <div className="w-full flex flex-col gap-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                onValueChange={(val) => handleInputChange("accountType", val)}
                value={formData.accountType}
              >
                <SelectTrigger id="account-type" className="w-full">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 -mt-1">
                Setting account type helps in selecting this account in transactions.
              </p>
            </div>


            {
              !account
                &&
              <div className="flex flex-col gap-2">
              <Label htmlFor="tax-rate">Tax Rate</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.01"               // allows decimal values like 1.25
                min="0"                   // optional: prevent negative values
                placeholder="Tax Value"
                value={formData.taxRate}
                onChange={e => {
                  const value = e.target.value
                  // Only allow empty or valid number
                  if (value === "" || !isNaN(Number(value))) {
                    handleInputChange("taxRate", value)
                  }
                }}
              />
            </div>
            }

            {
              account &&
              <div className="w-full flex flex-col gap-2">
                <Label htmlFor="frozen">Frozen</Label>
                <Select
                  onValueChange={val => handleInputChange("frozen", val)}
                  value={formData.frozen}
                >
                  <SelectTrigger id="frozen" className="w-full">
                    <SelectValue placeholder="Select frozen status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 -mt-1">
                  If the account is frozen, entries are allowed to restricted users.
                </p>
              </div>
            }

            <div className="w-full flex flex-col gap-2">
              <Label htmlFor="balance-must">Balance Must Be</Label>
              <Select
                onValueChange={val => handleInputChange("balanceMustBe", val)}
                value={formData.balanceMustBe}
              >
                <SelectTrigger id="balance-must" className="w-full">
                  <SelectValue placeholder="Select balance requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="" value="none"></SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Comments and activity */}
        {mode === 'edit' && <CommentAndActivity id = {account?._id} users={users} activityId="accountId"/>}
       </div>
      </div>
      
    </div>
  )
}
