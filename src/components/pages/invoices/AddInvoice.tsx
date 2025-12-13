"use client"
import { useState, useEffect } from "react"
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
import { Menu, ChevronsLeft, CalendarIcon, ChevronDown, ChevronUp } from "lucide-react"
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast, showWarningToast } from "@/lib/toast"
import { IInvoice } from "@/types/inovice"
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
import AttachmentSidebar from "@/components/layout/AttachmentSidebar"
import CommentAndActivity from "@/components/layout/CommentAndActivity"
import { IUser } from "@/types/user"

interface InvoiceFormProps {
  mode: string
  invoice?: IInvoice
  onInvoiceSaved: () => void
}

interface AdvancePayment {
  id: string
  referenceName: string
  remarks: string
  advanceAmount: number
  allocatedAmount: number
  difference: number
  postingDate: string
}

interface PaymentTerm {
  id: string
  paymentTerm: string
  description: string
  dueDate: string
  invoicePortion: number
  paymentAmount: number
}

interface CollapsibleSection {
  id: string
  title: string
  isOpen: boolean
}

export default function InvoiceForm({ mode, invoice, onInvoiceSaved }: InvoiceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAddFormSidebar, setShowAddFormSidebar] = useState(false)
  const [loading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<IInvoice | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [users, setUsers] = useState<IUser[]>([])
  
  const { mongoUser } = useMongoUser()

  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([])
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])

  // States for loading the scanned invoice data
  const scanId = searchParams.get('scanId')
  const [loadingScan, setLoadingScan] = useState(false)
  const [scanData, setScanData] = useState(null)

  // Collapsible sections state
  const [collapsibleSections, setCollapsibleSections] = useState<Record<string, CollapsibleSection[]>>({
    payment: [
      { id: "advance-payment", title: "Advance Payment", isOpen: false },
      { id: "write-off", title: "Write Off", isOpen: false }
    ],
    terms: [
      { id: "payment-terms", title: "Payment Terms", isOpen: false },
      { id: "terms-conditions", title: "Terms and Conditions", isOpen: false }
    ],
    "more-info": [
      { id: "status", title: "Status", isOpen: false },
      { id: "account-details", title: "Account Details", isOpen: false },
      { id: "subscription", title: "Subscription", isOpen: false },
      { id: "printing-settings", title: "Printing Settings", isOpen: false },
      { id: "hold-invoice", title: "Hold Invoice", isOpen: false },
      { id: "additional-info", title: "Additional Info", isOpen: false }
    ]
  })

  const [formData, setFormData] = useState({
    id: invoice?.id || "",
    invoiceNumber: invoice?.invoiceNumber || "",
    date: invoice?.date || "",
    supplierName: invoice?.supplierName || "",
    supplierVAT: invoice?.supplierVAT || "",
    customerName: invoice?.customerName || "",
    customerVAT: invoice?.customerVAT || "",
    amountBeforeVAT: invoice?.amountBeforeVAT || 0,
    totalVAT: invoice?.totalVAT || 0,
    totalAmount: invoice?.totalAmount || 0,
    qrCodePresent: invoice?.qrCodePresent || false,
    qrCodeValid: invoice?.qrCodeValid || false,
    status: invoice?.status || "Draft",
    editedBy: invoice?.editedBy || "",
    scannedInvoiceId: invoice?.scannedInvoiceId || "",
    
    // New fields for additional tabs
    setAdvancesAndAllocate: invoice?.setAdvancesAndAllocate || false,
    writeOffAmount: invoice?.writeOffAmount || 0,
    supplierAddress: invoice?.supplierAddress || "",
    supplierContactPerson: invoice?.supplierContactPerson || "",
    dispatchAddress: invoice?.dispatchAddress || "",
    shippingAddress: invoice?.shippingAddress || "",
    billingAddress: invoice?.billingAddress || "",
    paymentTermsTemplate: invoice?.paymentTermsTemplate || "",
    terms: invoice?.terms || "",
    termsAndConditions: invoice?.termsAndConditions || "",
    creditTo: invoice?.creditTo || "",
    isOpeningEntry: invoice?.isOpeningEntry || "none",
    fromDate: invoice?.fromDate || "",
    toDate: invoice?.toDate || "",
    subscription: invoice?.subscription || "",
    letterHead: invoice?.letterHead || "",
    printHeading: invoice?.printHeading || "",
    groupSameItems: invoice?.groupSameItems || false,
    holdInvoice: invoice?.holdInvoice || false,
    isSupplier: invoice?.isSupplier || false,
    supplierGroup: invoice?.supplierGroup || "",
    remarks: invoice?.remarks || ""
  })

  useEffect(() => {
    const fetchScanData = async () => {
      
      if (scanId) {
        setLoadingScan(true)
        try {
          const response = await axios.get(`/api/user/invoice/invoice-scan/${scanId}`)
          if (response.data.success) {
            setScanData(response.data.data)
            // Populate form with scan data
            const scan = response.data.data
            setFormData(prev => ({
              ...prev,
              id: scan.id || "",
              invoiceNumber: scan.invoiceNumber || "",
              date: scan.invoiceDate || new Date().toISOString().split('T')[0],
              supplierName: scan.supplierName || "",
              supplierVAT: scan.supplierVAT || "",
              customerName: scan.customerName || "",
              customerVAT: scan.customerVAT || "",
              amountBeforeVAT: scan.amountBeforeVAT || 0,
              totalVAT: scan.totalVAT || 0,
              totalAmount: scan.totalAmount || 0,
              qrCodePresent: scan.qrCodePresent || false,
              qrCodeValid: scan.qrCodeValid || false,
              status: scan.status || "Draft",
              scannedInvoiceId: scan._id || "",
            }))
          }
        } catch (error) {
          console.error("Error fetching scan data:", error)
          showErrorToast("Failed to load invoice scan data")
        } finally {
          setLoadingScan(false)
        }
      }
    }

    fetchScanData()
  }, [scanId])

  useEffect(() => {
    const updateInvoice = async () => {
      if (invoice && !loadingScan) {
        setOriginalData(invoice)
        setFormData(prev => ({
          ...prev,
          id: invoice?.id || '',
          invoiceNumber: invoice.invoiceNumber || "",
          date: invoice.date || "",
          supplierName: invoice.supplierName || "",
          supplierVAT: invoice.supplierVAT || "",
          customerName: invoice.customerName || "",
          customerVAT: invoice.customerVAT || "",
          amountBeforeVAT: invoice.amountBeforeVAT || 0,
          totalVAT: invoice.totalVAT || 0,
          totalAmount: invoice.totalAmount || 0,
          qrCodePresent: invoice.qrCodePresent || false,
          qrCodeValid: invoice.qrCodeValid || false,
          status: invoice.status || "Draft",
          editedBy: invoice.editedBy || "",


          // other fields
          setAdvancesAndAllocate: invoice.setAdvancesAndAllocate || false,
          writeOffAmount: invoice.writeOffAmount || 0,
          supplierAddress: invoice.supplierAddress || "",
          supplierContactPerson: invoice.supplierContactPerson || "",
          dispatchAddress: invoice.dispatchAddress || "",
          shippingAddress: invoice.shippingAddress || "",
          billingAddress: invoice.billingAddress || "",
          paymentTermsTemplate: invoice.paymentTermsTemplate || "",
          terms: invoice.terms || "",
          termsAndConditions: invoice.termsAndConditions || "",
          creditTo: invoice.creditTo || "",
          isOpeningEntry: invoice.isOpeningEntry || "none",
          fromDate: invoice.fromDate || "",
          toDate: invoice.toDate || "",
          subscription: invoice.subscription || "",
          letterHead: invoice.letterHead || "",
          printHeading: invoice.printHeading || "",
          groupSameItems: invoice.groupSameItems || false,
          holdInvoice: invoice.holdInvoice || false,
          isSupplier: invoice.isSupplier || false,
          supplierGroup: invoice.supplierGroup || "",
          remarks: invoice.remarks || ""
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

    fetchAllUsers();
    updateInvoice();
  }, [invoice, loadingScan])

  useEffect(() => {
    if (mode === "edit" && originalData) {
      const fieldsToCompare: (keyof typeof formData)[] = [
      'id', 'invoiceNumber', 'date', 'supplierName', 'supplierVAT', 
      'customerName', 'customerVAT', 'amountBeforeVAT', 'totalVAT', 'totalAmount',
      'qrCodePresent', 'qrCodeValid', 'status', 'setAdvancesAndAllocate', 
      'writeOffAmount', 'supplierAddress', 'supplierContactPerson', 'dispatchAddress',
      'shippingAddress', 'billingAddress', 'paymentTermsTemplate', 'terms',
      'termsAndConditions', 'creditTo', 'isOpeningEntry', 'fromDate', 'toDate',
      'subscription', 'letterHead', 'printHeading', 'groupSameItems', 'holdInvoice',
      'isSupplier', 'supplierGroup', 'remarks'
    ]

    const changesDetected = fieldsToCompare.some(
      field => formData[field] !== originalData[field as keyof IInvoice]
    )

      setHasChanges(changesDetected)
    }
  }, [formData, originalData, mode])

  const totalAmount = (formData.amountBeforeVAT || 0) + (formData.totalVAT || 0)


  const formatDateForStorage = (date: Date) => {
    return format(date, 'yyyy-MM-dd'); // Use date-fns format instead
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean | Date) => {
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
    const loadingToast = showLoadingToast(mode === "add-invoice" ? "Creating invoice..." : "Updating invoice...")
    setIsLoading(true)
    // as we were not updating the total amount in form so sending the updated value here
     const totalAmount = (formData.amountBeforeVAT || 0) + (formData.totalVAT || 0)
    try {
      if (mode === "add-invoice") {
        const response = await axios.post("/api/user/invoice", {
          ...formData,
          editedBy: mongoUser?._id,
          createdBy: mongoUser?._id,
          totalAmount: totalAmount
        })
        console.log("Invoice creation response:", response)
        // Create activity for invoice creation
        if (response.data.success && mongoUser?._id) {
          await axios.post("/api/user/activity", {
            invoiceId: response.data.data._id,
            userId: mongoUser._id,
            activityType: 'create'
          })
        }
        // change the invoice created status in invoice scan collection
        if (scanId && response.data.success) {
          try {
            await axios.put(`/api/user/invoice/invoice-scan/${scanId}`, {
              isInvoiceCreated: true
            })
            console.log("Invoice scan updated successfully")
          } catch (scanError) {
            console.error("Error updating invoice scan:", scanError)
            // Don't show error toast here as invoice was created successfully
          }
        }

        showSuccessToast("Invoice created successfully!")
      } else if (mode === "edit") {
        await axios.put(`/api/user/invoice/${invoice?._id}`, {
          ...formData,
          editedBy: mongoUser?._id
        })
        showSuccessToast("Invoice updated successfully!")
      }
      
      setHasChanges(false)
      onInvoiceSaved()
      goToList()
    } catch (error) {
      console.error("Error saving invoice:", error)
      if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data.error || "Failed to save invoice")
      } else if (error instanceof Error) {
        showErrorToast(error.message)
      } else {
        showErrorToast("Failed to save invoice")
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
            {formData.status}
          </span>
        )
      }
    }
    return null
  }

  const tabs = [
    { id: "details", label: "Details" },
    { id: "payment", label: "Payment" },
    { id: "address", label: "Address & Contact" },
    { id: "terms", label: "Terms" },
    { id: "more-info", label: "More Info" }
  ]

  // add a loading screen as overlay when fetching the invoice data from backend
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
      <div className="p-6  flex items-center gap-3">
        <div className="animate-spin h-7 w-7 border-3 rounded-full border-b-gray-400 border-primary-dull"></div>
        <span className="text-primary-dull text-lg font-semibold">Loading your invoice...</span>
      </div>
    </div>
  )

  return (
    <div>
      {loadingScan && <LoadingOverlay />}
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
                  Invoice
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">
                {mode === "edit" ? "Edit Invoice" : "New Invoice"}
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
                {mode === "edit" ? (invoice?.id || "Edit Invoice") : "New Invoice"}
              </h2>
              {renderStatusTag()}
            </div>
          </div>
          <Button
            onClick={handleSave}
            className={`bg-primary-medium hover:bg-[--color-primary-bright] text-white ${loading ? 'disabled disabled:opacity-50 disabled:cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Save
          </Button>
        </div>

        <div className="w-full flex flex-col md:flex-row">
          <div
            className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
              showAddFormSidebar ? "flex w-full md:w-1/5 opacity-100" : "w-0 after:absolute after:inset-0 after:bg-gray-50"
            }`}
          >
            {mode === 'edit' && 
              <AttachmentSidebar 
                id={invoice?._id}
                invoice={invoice}
                users={users}
              />
            }
          </div>
          
          {/* Main Content */}
          <div 
            className={`transition-all duration-300 ease-in-out flex flex-col gap-6 ${
              showAddFormSidebar ? "md:w-4/5" : "w-full"
            }`}
          >
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
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="id">Invoice ID<span className="text-red-500">*</span></Label>
                        <Input
                          id="id"
                          value={formData.id}
                          onChange={(e) => handleInputChange("id", e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="invoiceNumber">Invoice Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="invoiceNumber"
                          value={formData.invoiceNumber}
                          onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                          required
                        />
                      </div>

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
                              {formData.date ? format(new Date(formData.date), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.date ? new Date(formData.date) : undefined}
                              onSelect={(date) => date && handleInputChange("date", formatDateForStorage(date))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="supplierName">Supplier Name *</Label>
                        <Input
                          id="supplierName"
                          value={formData.supplierName}
                          onChange={(e) => handleInputChange("supplierName", e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="supplierVAT">Supplier VAT</Label>
                        <Input
                          id="supplierVAT"
                          value={formData.supplierVAT}
                          onChange={(e) => handleInputChange("supplierVAT", e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="amountBeforeVAT">Amount Before VAT *</Label>
                        <Input
                          id="amountBeforeVAT"
                          type="number"
                          step="0.01"
                          value={formData.amountBeforeVAT === 0 ? "" : formData.amountBeforeVAT}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                            handleInputChange("amountBeforeVAT", value)
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => handleInputChange("customerName", e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="customerVAT">Customer VAT</Label>
                        <Input
                          id="customerVAT"
                          value={formData.customerVAT}
                          onChange={(e) => handleInputChange("customerVAT", e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="totalVAT">Total VAT *</Label>
                        <Input
                          id="totalVAT"
                          type="number"
                          step="0.01"
                          value={formData.totalVAT === 0 ? "" : formData.totalVAT}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                            handleInputChange("totalVAT", value)
                          }}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="totalAmount">Total Amount</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          step="0.01"
                          value={totalAmount}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>

                      {/* <div className="flex flex-col gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleInputChange("status", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div> */}

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="qrCodePresent"
                            checked={formData.qrCodePresent}
                            onCheckedChange={(checked) => handleInputChange("qrCodePresent", !!checked)}
                          />
                          <Label htmlFor="qrCodePresent">QR Code Present</Label>
                        </div>

                        {formData.qrCodePresent && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="qrCodeValid"
                              checked={formData.qrCodeValid}
                              onCheckedChange={(checked) => handleInputChange("qrCodeValid", !!checked)}
                            />
                            <Label htmlFor="qrCodeValid">QR Code Valid</Label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {activeTab === "payment" && (
                <div className="border rounded-xl shadow bg-gray-50/50">
                  {collapsibleSections.payment.map((section) => (
                    <div key={section.id} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleSection("payment", section.id)}
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
                              {section.id === "advance-payment" && (
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="setAdvancesAndAllocate"
                                      checked={formData.setAdvancesAndAllocate}
                                      onCheckedChange={(checked) => handleInputChange("setAdvancesAndAllocate", !!checked)}
                                    />
                                    <Label htmlFor="setAdvancesAndAllocate">Set Advances and Allocate (FIFO)</Label>
                                  </div>

                                  <Button variant="outline" className="mb-4">
                                    Get Advances Paid
                                  </Button>

                                  <div className="border rounded-lg overflow-hidden bg-white">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead className="bg-gray-100 border-b">
                                          <tr>
                                            <th className="px-4 py-3 font-semibold text-left border-r">
                                              <Checkbox />
                                            </th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">No.</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Reference Name</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Remarks</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Advance Amount</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Allocated Amount</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Difference</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Posting Date</th>
                                            <th className="px-4 py-3 text-left"></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                              No Data
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  <Button variant="outline">
                                    Add Row
                                  </Button>
                                </div>
                              )}

                              {section.id === "write-off" && (
                                <div className="flex flex-col gap-2 max-w-full md:max-w-1/2">
                                  <Label htmlFor="writeOffAmount">Write Off Amount (SAR)</Label>
                                  <Input
                                    id="writeOffAmount"
                                    type="number"
                                    step="0.01"
                                    value={formData.writeOffAmount === 0 ? "" : formData.writeOffAmount}
                                    onChange={(e) => {
                                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                                      handleInputChange("writeOffAmount", value)
                                    }}
                                  />
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

              {/* Address & Contact Tab */}
              {activeTab === "address" && (
                <div className="border rounded-xl shadow bg-gray-50/50 space-y-6 p-6">
                  <div>
                    <h3 className="text-primary-dull text-lg font-semibold mb-4">Supplier Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="supplierAddress">Select Supplier Address</Label>
                        <Input
                          id="supplierAddress"
                          value={formData.supplierAddress}
                          onChange={(e) => handleInputChange("supplierAddress", e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="supplierContactPerson">Contact Person</Label>
                        <Input
                          id="supplierContactPerson"
                          value={formData.supplierContactPerson}
                          onChange={(e) => handleInputChange("supplierContactPerson", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-primary-dull text-lg font-semibold mb-4">Shipping Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="dispatchAddress">Select Dispatch Address</Label>
                        <Input
                          id="dispatchAddress"
                          value={formData.dispatchAddress}
                          onChange={(e) => handleInputChange("dispatchAddress", e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="shippingAddress">Select Shipping Address</Label>
                        <Input
                          id="shippingAddress"
                          value={formData.shippingAddress}
                          onChange={(e) => handleInputChange("shippingAddress", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-primary-dull text-lg font-semibold mb-4">Company Billing Address</h3>
                    <div className="flex max-w-full md:max-w-1/2 flex-col gap-2">
                      <Label htmlFor="billingAddress">Select Billing Address</Label>
                      <Input
                        id="billingAddress"
                        value={formData.billingAddress}
                        onChange={(e) => handleInputChange("billingAddress", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Terms Tab */}
              {activeTab === "terms" && (
                <div className="border rounded-xl shadow bg-gray-50/50">
                  {collapsibleSections.terms.map((section) => (
                    <div key={section.id} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleSection("terms", section.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-primary-dull">{section.title}</h3>
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
                              {section.id === "payment-terms" && (
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-2 max-w-full md:max-w-1/2">
                                    <Label htmlFor="paymentTermsTemplate">Payment Terms Template</Label>
                                    <Input
                                      id="paymentTermsTemplate"
                                      value={formData.paymentTermsTemplate}
                                      onChange={(e) => handleInputChange("paymentTermsTemplate", e.target.value)}
                                    />
                                  </div>

                                  <div className="border rounded-lg overflow-hidden bg-white">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead className="bg-gray-100 border-b">
                                          <tr>
                                            <th className="px-4 py-3 font-semibold text-left border-r">
                                              <Checkbox />
                                            </th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">No.</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Payment Term</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Description</th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Due Date <span className='text-red-500'>*</span></th>
                                            <th className="px-4 py-3 font-semibold text-left border-r">Invoice Portion</th>
                                            <th className="px-4 py-3 text-left font-semibold">Payment Amount <span className='text-red-500'>*</span></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                              No Data
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  <Button variant="outline">
                                    Add Row
                                  </Button>
                                </div>
                              )}

                              {section.id === "terms-conditions" && (
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-2 w-full md:w-1/2">
                                    <Label htmlFor="terms">Terms</Label>
                                    <Input
                                      id="terms"
                                      value={formData.terms}
                                      onChange={(e) => handleInputChange("terms", e.target.value)}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                                    <textarea
                                      id="termsAndConditions"
                                      rows={4}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-medium focus:border-transparent"
                                      value={formData.termsAndConditions}
                                      onChange={(e) => handleInputChange("termsAndConditions", e.target.value)}
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

              {/* More Info Tab */}
              {activeTab === "more-info" && (
                <div className="border rounded-xl shadow bg-gray-50/50">
                  {collapsibleSections["more-info"].map((section) => (
                    <div key={section.id} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleSection("more-info", section.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-primary-dull">{section.title}</h3>
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
                              {section.id === "status" && (
                                <div className="flex flex-col gap-2 w-full md:max-w-1/2">
                                  <Label htmlFor="moreInfoStatus">Status</Label>
                                  <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleInputChange("status", value)}
                                  >
                                    <SelectTrigger id="moreInfoStatus" className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none"></SelectItem>
                                      <SelectItem value="Draft">Draft</SelectItem>
                                      <SelectItem value= "Pending">Pending</SelectItem>
                                      <SelectItem value="Return">Return</SelectItem>
                                      <SelectItem value="Paid">Paid</SelectItem>
                                      <SelectItem value="debit note issued">Debit Note Issued</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {section.id === "account-details" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="creditTo">Credit To</Label>
                                    <Input
                                      id="creditTo"
                                      value={formData.creditTo}
                                      onChange={(e) => handleInputChange("creditTo", e.target.value)}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="isOpeningEntry">Is Opening Entry</Label>
                                    <Select
                                      value={formData.isOpeningEntry}
                                      onValueChange={(value) => handleInputChange("isOpeningEntry", value)}
                                    >
                                      <SelectTrigger id="isOpeningEntry" className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none"></SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}

                              {section.id === "subscription" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-full">
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="subscription">Subscription</Label>
                                    <Input
                                      id="subscription"
                                      value={formData.subscription}
                                      onChange={(e) => handleInputChange("subscription", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="fromDate">From Date</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant={"outline"}
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !formData.fromDate && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.fromDate ? format(new Date(formData.fromDate), "PPP") : <span>Pick a date</span>}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <Calendar
                                            mode="single"
                                            selected={formData.fromDate ? new Date(formData.fromDate) : undefined}
                                            onSelect={(date) => date && handleInputChange("fromDate", formatDateForStorage(date))}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <div className="text-sm text-gray-500">Start date of current invoice&apos;s period</div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="toDate">To Date</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant={"outline"}
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !formData.toDate && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.toDate ? format(new Date(formData.toDate), "PPP") : <span>Pick a date</span>}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <Calendar
                                            mode="single"
                                            selected={formData.toDate ? new Date(formData.toDate) : undefined}
                                            onSelect={(date) => date && handleInputChange("toDate", formatDateForStorage(date))}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <div className="text-sm text-gray-500">End date of current invoice&apos;s period</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {section.id === "printing-settings" && (
                                <div className="space-y-4 max-w-full">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="letterHead">Letter Head</Label>
                                      <Input
                                        id="letterHead"
                                        value={formData.letterHead}
                                        onChange={(e) => handleInputChange("letterHead", e.target.value)}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="printHeading">Print Heading</Label>
                                      <Input
                                        id="printHeading"
                                        value={formData.printHeading}
                                        onChange={(e) => handleInputChange("printHeading", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="groupSameItems"
                                      checked={formData.groupSameItems}
                                      onCheckedChange={(checked) => handleInputChange("groupSameItems", !!checked)}
                                    />
                                    <Label htmlFor="groupSameItems">Group same items</Label>
                                  </div>
                                </div>
                              )}

                              {section.id === "hold-invoice" && (
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="holdInvoice"
                                    checked={formData.holdInvoice}
                                    onCheckedChange={(checked) => handleInputChange("holdInvoice", !!checked)}
                                  />
                                  <Label htmlFor="holdInvoice">Hold Invoice</Label>
                                </div>
                              )}

                              {section.id === "additional-info" && (
                                <div className="space-y-4 max-w-full">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="isSupplier"
                                      checked={formData.isSupplier}
                                      onCheckedChange={(checked) => handleInputChange("isSupplier", !!checked)}
                                    />
                                    <Label htmlFor="isSupplier">Is Supplier</Label>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="supplierGroup">Supplier Group</Label>
                                      <Input
                                        id="supplierGroup"
                                        value={formData.supplierGroup}
                                        onChange={(e) => handleInputChange("supplierGroup", e.target.value)}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="remarks">Remarks</Label>
                                      <textarea
                                        id="remarks"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-medium focus:border-transparent"
                                        value={formData.remarks}
                                        onChange={(e) => handleInputChange("remarks", e.target.value)}
                                      />
                                    </div>
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
            </div>
            {mode === 'edit' && <CommentAndActivity id={invoice?._id} users={users} activityId="invoiceId" />}
          </div>
        </div>
      </div>
     </div> 
  )
}