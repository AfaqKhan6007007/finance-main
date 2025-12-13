"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Menu, ChevronsLeft, CalendarIcon, ChevronDown, ChevronUp, Trash2, MoreHorizontal } from "lucide-react"
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast, showWarningToast } from "@/lib/toast"
import { ICompany } from "@/types/company"
import { useMongoUser } from "@/context/UserContext"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import AttachmentSidebar from "@/components/layout/AttachmentSidebar"
import CommentAndActivity from "@/components/layout/CommentAndActivity"
import { IUser } from "@/types/user"

interface CompanyFormProps {
  mode: string
  company?: ICompany
  companies: ICompany[]
  onCompanySaved: () => void
  onDeleteClick?: (company: ICompany) => void
}

interface CollapsibleSection {
  id: string
  title: string
  isOpen: boolean
}

// List of countries (you can import this from a separate file)
const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan", 
  "China", "India", "Brazil", "Saudi Arabia", "United Arab Emirates", "Pakistan", 
  "Singapore", "Malaysia", "South Africa", "Italy", "Spain", "Netherlands", "Switzerland"
]

const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "SAR", "PKR", "AED", "INR"
]

export default function CompanyForm({ mode, company, companies, onCompanySaved, onDeleteClick }: CompanyFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<ICompany | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [showAddFormSidebar, setShowAddFormSidebar] = useState(false)
  const [users, setUsers] = useState<IUser[]>([])
  
  const { mongoUser } = useMongoUser()

  // Collapsible sections state for Accounts tab
  const [collapsibleSections, setCollapsibleSections] = useState<Record<string, CollapsibleSection[]>>({
    accounts: [
      { id: "chart-of-accounts", title: "Chart of Accounts", isOpen: true },
      { id: "default-accounts", title: "Default Accounts", isOpen: false },
      { id: "exchange-gain-loss", title: "Exchange Gain / Loss", isOpen: false },
      { id: "round-off", title: "Round Off", isOpen: false },
      { id: "advance-payment", title: "Advance Payment", isOpen: false },
      { id: "exchange-rate-revaluation", title: "Exchange Rate Revaluation Settings", isOpen: false },
      { id: "budget-details", title: "Budget Details", isOpen: false },
      { id: "fixed-asset-defaults", title: "Fixed Asset Defaults", isOpen: false }
    ]
  })

  const [formData, setFormData] = useState({
    // Details Tab
    companyName: company?.companyName || "",
    abbreviation: company?.abbreviation || "",
    defaultCurrency: company?.defaultCurrency || "USD",
    defaultLetterHead: company?.defaultLetterHead || "",
    taxId: company?.taxId || "",
    domain: company?.domain || "",
    country: company?.country || "",
    dateOfEstablishment: company?.dateOfEstablishment ? new Date(company.dateOfEstablishment) : undefined,
    isGroup: company?.isGroup || false,
    parentCompany: company?.parentCompany || "",
    registrationDetails: company?.registrationDetails || "",

    // Accounts Tab
    chartOfAccountBasis: company?.chartOfAccountBasis || "none",
    writeOffAccount: company?.writeOffAccount || "",
    defaultPaymentDiscountAccount: company?.defaultPaymentDiscountAccount || "",
    unrealizedProfitLossAccount: company?.unrealizedProfitLossAccount || "",
    defaultPaymentTermsTemplate: company?.defaultPaymentTermsTemplate || "",
    defaultFinanceBook: company?.defaultFinanceBook || "",
    exchangeGainLossAccount: company?.exchangeGainLossAccount || "",
    unrealizedExchangeGainLossAccount: company?.unrealizedExchangeGainLossAccount || "",
    roundOffAccount: company?.roundOffAccount || "",
    roundOffForOpening: company?.roundOffForOpening || "",
    roundOffCostCenter: company?.roundOffCostCenter || "",
    bookAdvancePaymentInSeparatePartyAccount: company?.bookAdvancePaymentInSeparatePartyAccount || false,
    reconciliationEffectOn: company?.reconciliationEffectOn || "oldest",
    autoCreateExchangeRateRevaluation: company?.autoCreateExchangeRateRevaluation || false,
    frequency: company?.frequency || "daily",
    submitERRJournals: company?.submitERRJournals || false,
    exceptionBudgetApproverRole: company?.exceptionBudgetApproverRole || "",
    accumulatedDepreciationAccount: company?.accumulatedDepreciationAccount || "",
    gainLossAccountOnAssetDisposal: company?.gainLossAccountOnAssetDisposal || "",
    depreciationExpenseAccount: company?.depreciationExpenseAccount || "",
    assetDepreciationCostCenter: company?.assetDepreciationCostCenter || "",
    seriesForAssetDepreciationEntry: company?.seriesForAssetDepreciationEntry || "",
    capitalWorkInProgressAccount: company?.capitalWorkInProgressAccount || "",
    expensesIncludedInAssetValuation: company?.expensesIncludedInAssetValuation || "",
    assetReceivedButNotBilled: company?.assetReceivedButNotBilled || "",

    // Buying and Selling Tab
    defaultBuyingTerms: company?.defaultBuyingTerms || "",
    defaultSellingTerms: company?.defaultSellingTerms || "",
    monthlySalesTarget: company?.monthlySalesTarget || 0,
    defaultWarehouseForSalesReturn: company?.defaultWarehouseForSalesReturn || "",

    // Manufacturing Tab
    defaultOperationCostAccount: company?.defaultOperationCostAccount || "",

    // Default Holiday List
    defaultHolidayList: company?.defaultHolidayList || []
  })

  useEffect(() => {
    const updateCompany = () => {
      if (company) {
        setOriginalData(company)
        setFormData(prev => ({
          ...prev,
          companyName: company?.companyName || "",
          abbreviation: company?.abbreviation || "",
          defaultCurrency: company?.defaultCurrency || "USD",
          defaultLetterHead: company?.defaultLetterHead || "",
          taxId: company?.taxId || "",
          domain: company?.domain || "",
          country: company?.country || "",
          dateOfEstablishment: company?.dateOfEstablishment ? new Date(company.dateOfEstablishment) : undefined,
          isGroup: company?.isGroup || false,
          parentCompany: company?.parentCompany || "",
          registrationDetails: company?.registrationDetails || "",

          // Accounts Tab
          chartOfAccountBasis: company?.chartOfAccountBasis || "none",
          writeOffAccount: company?.writeOffAccount || "",
          defaultPaymentDiscountAccount: company?.defaultPaymentDiscountAccount || "",
          unrealizedProfitLossAccount: company?.unrealizedProfitLossAccount || "",
          defaultPaymentTermsTemplate: company?.defaultPaymentTermsTemplate || "",
          defaultFinanceBook: company?.defaultFinanceBook || "",
          exchangeGainLossAccount: company?.exchangeGainLossAccount || "",
          unrealizedExchangeGainLossAccount: company?.unrealizedExchangeGainLossAccount || "",
          roundOffAccount: company?.roundOffAccount || "",
          roundOffForOpening: company?.roundOffForOpening || "",
          roundOffCostCenter: company?.roundOffCostCenter || "",
          bookAdvancePaymentInSeparatePartyAccount: company?.bookAdvancePaymentInSeparatePartyAccount || false,
          reconciliationEffectOn: company?.reconciliationEffectOn || "oldest",
          autoCreateExchangeRateRevaluation: company?.autoCreateExchangeRateRevaluation || false,
          frequency: company?.frequency || "daily",
          submitERRJournals: company?.submitERRJournals || false,
          exceptionBudgetApproverRole: company?.exceptionBudgetApproverRole || "",
          accumulatedDepreciationAccount: company?.accumulatedDepreciationAccount || "",
          gainLossAccountOnAssetDisposal: company?.gainLossAccountOnAssetDisposal || "",
          depreciationExpenseAccount: company?.depreciationExpenseAccount || "",
          assetDepreciationCostCenter: company?.assetDepreciationCostCenter || "",
          seriesForAssetDepreciationEntry: company?.seriesForAssetDepreciationEntry || "",
          capitalWorkInProgressAccount: company?.capitalWorkInProgressAccount || "",
          expensesIncludedInAssetValuation: company?.expensesIncludedInAssetValuation || "",
          assetReceivedButNotBilled: company?.assetReceivedButNotBilled || "",

          // Buying and Selling Tab
          defaultBuyingTerms: company?.defaultBuyingTerms || "",
          defaultSellingTerms: company?.defaultSellingTerms || "",
          monthlySalesTarget: company?.monthlySalesTarget || 0,
          defaultWarehouseForSalesReturn: company?.defaultWarehouseForSalesReturn || "",

          // Manufacturing Tab
          defaultOperationCostAccount: company?.defaultOperationCostAccount || "",

          // Default Holiday List
          defaultHolidayList: company?.defaultHolidayList || []
        }))
      }
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

    updateCompany();
    fetchAllUsers();
  }, [company])

  useEffect(() => {
    if (mode === "edit" && originalData) {
      const changesDetected = Object.keys(formData).some(field => {
        const newVal = formData[field as keyof typeof formData]
        const oldVal = originalData[field as keyof ICompany]
        
        // Special handling for date comparison
        if (field === 'dateOfEstablishment') {
          const newDate = newVal instanceof Date ? newVal.toISOString() : null
          const oldDate = oldVal ? new Date(oldVal as string).toISOString() : null
          return newDate !== oldDate
        }
        
        return newVal !== oldVal
      })
      
      setHasChanges(changesDetected)
    }
  }, [formData, originalData, mode])

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean | Date | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleSection = (tab: string, sectionId: string) => {
    setCollapsibleSections(prev => ({
      ...prev,
      [tab]: prev[tab].map(section => 
        section.id === sectionId 
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    }))
  }

  const handleSave = async () => {
    if (mode === "edit" && !hasChanges) {
      showWarningToast("No changes to save")
      return
    }

    const loadingToast = showLoadingToast(mode === "add-company" ? "Creating company..." : "Updating company...")
    setIsLoading(true)

    try {
      if (mode === "add-company") {
         await axios.post("/api/user/company", {
          ...formData,
          editedBy: mongoUser?._id,
          createdBy: mongoUser?._id
        })
        
       

        showSuccessToast("Company created successfully!")
      } else if (mode === "edit") {
        await axios.patch(`/api/user/company/${company?._id}`, {
          ...formData,
          editedBy: mongoUser?._id
        })
        showSuccessToast("Company updated successfully!")
      }
      
      setHasChanges(false)
      onCompanySaved()
      goToList()
    } catch (error) {
      console.error("Error saving company:", error)
      if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data.error || "Failed to save company")
      } else if (error instanceof Error) {
        showErrorToast(error.message)
      } else {
        showErrorToast("Failed to save company")
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

  const tabs = [
    { id: "details", label: "Details" },
    { id: "accounts", label: "Accounts" },
    { id: "buying-selling", label: "Buying and Selling" },
    { id: "manufacturing", label: "Stock and Manufacturing" }
  ]



  // Get parent companies (only those with isGroup true)
  const parentCompanies = useMemo(() => {
    const getDescendantCompanyIds = (companyId: string, allCompanies: ICompany[]): string[] => {
      const descendants: string[] = [];
      
      const findDescendants = (currentId: string) => {
        const children = allCompanies.filter(comp => comp.parentCompany === currentId);
        
        children.forEach(child => {
          descendants.push(child._id!);
          findDescendants(child._id!);
        });
      };
      
      findDescendants(companyId);
      return descendants;
    };

    if (!company) {
      // For new company, all group companies are valid
      return companies.filter(comp => comp.isGroup);
    }
    
    // For existing company, exclude itself and its descendants
    const descendantIds = getDescendantCompanyIds(company._id!, companies);
    const excludedIds = [company._id!, ...descendantIds];
    
    return companies.filter(comp => 
      comp.isGroup && 
      !excludedIds.includes(comp._id!)
    );
  }, [company, companies]);

  // Helper function to generate company initials
    const generateInitials = (companyName: string): string => {
    if (!companyName.trim()) return ""
    
    const words = companyName.split(' ').filter(word => word.length > 0)
    if (words.length === 0) return ""
    
    
    return words.map(word => word[0].toUpperCase()).join('')
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
                Company
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-muted-foreground">
              {mode === "edit" ? "Edit Company" : "New Company"}
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
              {mode === "edit" ? (company?.companyName || "Edit Company") : "New Company"}
            </h2>
            {renderStatusTag()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company && mode === "edit" &&
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
                
                <DropdownMenuItem 
                onClick={() => {/* Add delete logic here */}}
                className=""
              >
                <div className="flex w-full justify-between items-center cursor-pointer" onClick={() => onDeleteClick?.(company)}>
                  Delete <span><Trash2 size={16} className="text-red-600 focus:text-red-600" /></span>
                </div>
              </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>}

            <Button
              onClick={handleSave}
              className={`bg-primary-medium h-8 hover:bg-[--color-primary-bright] text-white ${loading ? 'disabled disabled:opacity-50 disabled:cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Save
            </Button>
        </div>
        
      </div>
      {/* the div with sidebar and form */}
      <div className="w-full flex flex-col md:flex-row">
        <div
          className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
            showAddFormSidebar ? "flex w-full md:w-1/5 opacity-100" : "w-0 after:absolute after:inset-0 after:bg-gray-50"
          }`}
        >
          {mode === 'edit' && 
            <AttachmentSidebar 
              id={company?._id}
              company={company}
              users={users}
            />
          }
        </div>
        {/* Activity & content */}
        <div 
          className={`transition-all duration-300 ease-in-out flex flex-col gap-6 ${
            showAddFormSidebar ? "md:w-4/5" : "w-full"
          }`}
        >
          {/* main content of page  */}
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "border-primary-medium text-primary-medium"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="border p-6 rounded-xl shadow bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                   { 
                      !company &&
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="companyName">
                          Company Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => {
                          const newCompanyName = e.target.value
                          handleInputChange("companyName", newCompanyName)
                          
                          if (mode === "add-company" || !formData.abbreviation || formData.abbreviation === generateInitials(formData.companyName)) {
                              const newAbbreviation = generateInitials(newCompanyName)
                              handleInputChange("abbreviation", newAbbreviation)
                          }
                          }}
                          required
                        />
                      </div>
                    }

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="abbreviation">
                        Abbreviation <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="abbreviation"
                        value={formData.abbreviation}
                        onChange={(e) => handleInputChange("abbreviation", e.target.value)}
                        required
                        disabled={!!company}
                        className={`${company ? 'bg-gray-200': ''}`}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="defaultCurrency">
                        Default Currency <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.defaultCurrency}
                        onValueChange={(value) => handleInputChange("defaultCurrency", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(currency => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => handleInputChange("taxId", e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        value={formData.domain}
                        onChange={(e) => handleInputChange("domain", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => handleInputChange("country", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="dateOfEstablishment">Date of Establishment</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.dateOfEstablishment && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dateOfEstablishment ? format(formData.dateOfEstablishment, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.dateOfEstablishment}
                            onSelect={(date) => date && handleInputChange("dateOfEstablishment", date)}
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="defaultLetterHead">Default Letter Head</Label>
                      <Input
                        id="defaultLetterHead"
                        value={formData.defaultLetterHead}
                        onChange={(e) => handleInputChange("defaultLetterHead", e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="parentCompany">Parent Company</Label>
                      <Select
                        value={formData.parentCompany}
                        onValueChange={(value) => handleInputChange("parentCompany", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select parent company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none"></SelectItem>
                          {parentCompanies.map(company => (
                            <SelectItem key={company._id} value={company._id}>
                              {company.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isGroup"
                        checked={formData.isGroup}
                        onCheckedChange={(checked) => handleInputChange("isGroup", !!checked)}
                        className={`
                        data-[state=checked]:bg-primary-dull 
                        data-[state=checked]:border-primary-dull 
                        data-[state=checked]:text-white

                        ${company ? 'data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500 data-[state=checked]:text-white bg-gray-200':''}
                        `}
                      />
                      <Label htmlFor="isGroup">Is Parent Company (Group)</Label>
                    </div>
                  </div>
                </div>

                {/* Registration Details - Full width */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="registrationDetails">Registration Details</Label>
                    <Textarea
                      id="registrationDetails"
                      rows={4}
                      value={formData.registrationDetails}
                      onChange={(e) => handleInputChange("registrationDetails", e.target.value)}
                      className="resize-none"
                    />
                    <p className="text-sm text-gray-500">
                      Company registration numbers for your reference. Tax numbers etc.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div className="border rounded-xl shadow bg-gray-50/50">
                {collapsibleSections.accounts.map((section) => (
                  <div key={section.id} className="border-b last:border-b-0">
                    <button
                      onClick={() => toggleSection("accounts", section.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                    >
                      <h3 className="text-lg text-primary-dull font-semibold">{section.title}</h3>
                      {section.isOpen ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {section.isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4">
                            {section.id === "chart-of-accounts" && (
                              <div className="flex flex-col gap-2 max-w-md">
                                <Label htmlFor="chartOfAccountBasis">Create chart of account based on</Label>
                                <Select
                                  value={formData.chartOfAccountBasis}
                                  onValueChange={(value) => handleInputChange("chartOfAccountBasis", value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none"></SelectItem>
                                    <SelectItem value="Standard Template">Standard Template</SelectItem>
                                    <SelectItem value="Existing Company">Existing Company</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {section.id === "default-accounts" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="writeOffAccount">Write Off Account</Label>
                                  <Input
                                    id="writeOffAccount"
                                    value={formData.writeOffAccount}
                                    onChange={(e) => handleInputChange("writeOffAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="defaultPaymentDiscountAccount">Default Payment Discount Account</Label>
                                  <Input
                                    id="defaultPaymentDiscountAccount"
                                    value={formData.defaultPaymentDiscountAccount}
                                    onChange={(e) => handleInputChange("defaultPaymentDiscountAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="unrealizedProfitLossAccount">Unrealized Profit Loss Account</Label>
                                  <Input
                                    id="unrealizedProfitLossAccount"
                                    value={formData.unrealizedProfitLossAccount}
                                    onChange={(e) => handleInputChange("unrealizedProfitLossAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="defaultPaymentTermsTemplate">Default Payment Terms Template</Label>
                                  <Input
                                    id="defaultPaymentTermsTemplate"
                                    value={formData.defaultPaymentTermsTemplate}
                                    onChange={(e) => handleInputChange("defaultPaymentTermsTemplate", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="defaultFinanceBook">Default Finance Book</Label>
                                  <Input
                                    id="defaultFinanceBook"
                                    value={formData.defaultFinanceBook}
                                    onChange={(e) => handleInputChange("defaultFinanceBook", e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {section.id === "exchange-gain-loss" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="exchangeGainLossAccount">Exchange Gain/Loss Account</Label>
                                  <Input
                                    id="exchangeGainLossAccount"
                                    value={formData.exchangeGainLossAccount}
                                    onChange={(e) => handleInputChange("exchangeGainLossAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="unrealizedExchangeGainLossAccount">Unrealized Exchange Gain/Loss Account</Label>
                                  <Input
                                    id="unrealizedExchangeGainLossAccount"
                                    value={formData.unrealizedExchangeGainLossAccount}
                                    onChange={(e) => handleInputChange("unrealizedExchangeGainLossAccount", e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {section.id === "round-off" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="roundOffAccount">Round Off Account</Label>
                                  <Input
                                    id="roundOffAccount"
                                    value={formData.roundOffAccount}
                                    onChange={(e) => handleInputChange("roundOffAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="roundOffForOpening">Round Off For Opening</Label>
                                  <Input
                                    id="roundOffForOpening"
                                    value={formData.roundOffForOpening}
                                    onChange={(e) => handleInputChange("roundOffForOpening", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="roundOffCostCenter">Round Off Cost Center</Label>
                                  <Input
                                    id="roundOffCostCenter"
                                    value={formData.roundOffCostCenter}
                                    onChange={(e) => handleInputChange("roundOffCostCenter", e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {section.id === "advance-payment" && (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="bookAdvancePaymentInSeparatePartyAccount"
                                    checked={formData.bookAdvancePaymentInSeparatePartyAccount}
                                    onCheckedChange={(checked) => handleInputChange("bookAdvancePaymentInSeparatePartyAccount", !!checked)}
                                  />
                                  <Label htmlFor="bookAdvancePaymentInSeparatePartyAccount">
                                    Book Advance Payment in Separate Party Account
                                  </Label>
                                </div>
                                <div className="bg-blue-50 p-4 pt-2 rounded-lg text-sm text-blue-700">
                                  <p className="font-semibold mb-2">Enabling this option will allow you to record -</p>
                                  <ol style={{ listStyleType: 'decimal', listStylePosition: 'inside' }} className="list-decimal list-inside space-y-1">
                                    <li>Advances Received in a Liability Account instead of the Asset Account</li>
                                    <li>Advances Paid in an Asset Account instead of the Liability Account</li>
                                  </ol>
                                </div>
                                <div className="mt-3 flex flex-col gap-2">
                                    <Label htmlFor="reconciliationEffect">Reconciliation Takes Effect On</Label>
                                    <Select 
                                      value={formData.reconciliationEffectOn}
                                      onValueChange={(value) => handleInputChange("reconciliationEffectOn", value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="advance-payment">Advance payment</SelectItem>
                                        <SelectItem value="oldest">Oldest of invoice or advance</SelectItem>
                                        <SelectItem value="reconciliation-date">Reconciliation Date</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                              </div>
                            )}

                            {section.id === "exchange-rate-revaluation" && (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="autoCreateExchangeRateRevaluation"
                                    checked={formData.autoCreateExchangeRateRevaluation}
                                    onCheckedChange={(checked) => handleInputChange("autoCreateExchangeRateRevaluation", !!checked)}
                                  />
                                  <Label htmlFor="autoCreateExchangeRateRevaluation">Auto Create Exchange Rate Revaluation</Label>
                                </div>
                                <div className="flex flex-col gap-2 max-w-md">
                                  <Label htmlFor="frequency">Frequency</Label>
                                  <Select
                                    value={formData.frequency}
                                    onValueChange={(value) => handleInputChange("frequency", value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="daily">Daily</SelectItem>
                                      <SelectItem value="weekly">Weekly</SelectItem>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="submitERRJournals"
                                    checked={formData.submitERRJournals}
                                    onCheckedChange={(checked) => handleInputChange("submitERRJournals", !!checked)}
                                  />
                                  <Label htmlFor="submitERRJournals">Submit ERR Journals</Label>
                                </div>
                              </div>
                            )}

                            {section.id === "budget-details" && (
                              <div className="flex flex-col gap-2 max-w-md">
                                <Label htmlFor="exceptionBudgetApproverRole">Exception Budget Approver Role</Label>
                                <Input
                                  id="exceptionBudgetApproverRole"
                                  value={formData.exceptionBudgetApproverRole}
                                  onChange={(e) => handleInputChange("exceptionBudgetApproverRole", e.target.value)}
                                />
                              </div>
                            )}

                            {section.id === "fixed-asset-defaults" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="accumulatedDepreciationAccount">Accumulated Depreciation Account</Label>
                                  <Input
                                    id="accumulatedDepreciationAccount"
                                    value={formData.accumulatedDepreciationAccount}
                                    onChange={(e) => handleInputChange("accumulatedDepreciationAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="gainLossAccountOnAssetDisposal">Gain/Loss Account on Asset Disposal</Label>
                                  <Input
                                    id="gainLossAccountOnAssetDisposal"
                                    value={formData.gainLossAccountOnAssetDisposal}
                                    onChange={(e) => handleInputChange("gainLossAccountOnAssetDisposal", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="depreciationExpenseAccount">Depreciation Expense Account</Label>
                                  <Input
                                    id="depreciationExpenseAccount"
                                    value={formData.depreciationExpenseAccount}
                                    onChange={(e) => handleInputChange("depreciationExpenseAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="assetDepreciationCostCenter">Asset Depreciation Cost Center</Label>
                                  <Input
                                    id="assetDepreciationCostCenter"
                                    value={formData.assetDepreciationCostCenter}
                                    onChange={(e) => handleInputChange("assetDepreciationCostCenter", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="seriesForAssetDepreciationEntry">Series for Asset Depreciation Entry</Label>
                                  <Input
                                    id="seriesForAssetDepreciationEntry"
                                    value={formData.seriesForAssetDepreciationEntry}
                                    onChange={(e) => handleInputChange("seriesForAssetDepreciationEntry", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="capitalWorkInProgressAccount">Capital Work in Progress Account</Label>
                                  <Input
                                    id="capitalWorkInProgressAccount"
                                    value={formData.capitalWorkInProgressAccount}
                                    onChange={(e) => handleInputChange("capitalWorkInProgressAccount", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="expensesIncludedInAssetValuation">Expenses Included in Asset Valuation</Label>
                                  <Input
                                    id="expensesIncludedInAssetValuation"
                                    value={formData.expensesIncludedInAssetValuation}
                                    onChange={(e) => handleInputChange("expensesIncludedInAssetValuation", e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="assetReceivedButNotBilled">Asset Received But Not Billed</Label>
                                  <Input
                                    id="assetReceivedButNotBilled"
                                    value={formData.assetReceivedButNotBilled}
                                    onChange={(e) => handleInputChange("assetReceivedButNotBilled", e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* Buying and Selling Tab */}
            {activeTab === "buying-selling" && (
              <div className="border p-6 rounded-xl shadow bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="defaultBuyingTerms">Default Buying Terms</Label>
                      <Input
                        id="defaultBuyingTerms"
                        value={formData.defaultBuyingTerms}
                        onChange={(e) => handleInputChange("defaultBuyingTerms", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="monthlySalesTarget">Monthly Sales Target</Label>
                      <Input
                        id="monthlySalesTarget"
                        type="number"
                        step="0.01"
                        value={formData.monthlySalesTarget === 0 ? "" : formData.monthlySalesTarget}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                          handleInputChange("monthlySalesTarget", value)
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="defaultSellingTerms">Default Selling Terms</Label>
                      <Input
                        id="defaultSellingTerms"
                        value={formData.defaultSellingTerms}
                        onChange={(e) => handleInputChange("defaultSellingTerms", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="defaultWarehouseForSalesReturn">Default Warehouse for Sales Return</Label>
                      <Input
                        id="defaultWarehouseForSalesReturn"
                        value={formData.defaultWarehouseForSalesReturn}
                        onChange={(e) => handleInputChange("defaultWarehouseForSalesReturn", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manufacturing Tab */}
            {activeTab === "manufacturing" && (
              <div className="border p-6 rounded-xl shadow bg-gray-50/50">
                <div className="flex flex-col gap-2 max-w-md">
                  <Label htmlFor="defaultOperationCostAccount">Default Operation Cost Account</Label>
                  <Input
                    id="defaultOperationCostAccount"
                    value={formData.defaultOperationCostAccount}
                    onChange={(e) => handleInputChange("defaultOperationCostAccount", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          {mode === 'edit' && <CommentAndActivity id={company?._id} users={users} activityId="companyId" />}
        </div>
      </div>
    </div>
  )
}