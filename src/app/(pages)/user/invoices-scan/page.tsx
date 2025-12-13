"use client"
import React, { useState, useEffect } from 'react'
import { MdDeleteForever } from "react-icons/md";
import axios from 'axios';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '@/lib/toast';
import { useScreenSize } from '@/context/ScreenSizeContext';
import { type DateRange } from "react-day-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';
// import { DateRangeFilter } from "@/components/Filters/DateRangeFilter";
// import { CustomSelect } from "@/components/Filters/CustomSelect";
import { Pagination } from "@/components/layout/Pagination";
// import { SearchBar } from '@/components/SearchBar';
import { Button } from "@/components/ui/button"
// import DownloadExcelFile from '@/lib/ExcelDataGenerator';
import { useRouter } from 'next/navigation';
import { FiEdit, FiFileText } from "react-icons/fi";
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { BarChart3, CalendarIcon, ChevronDown, FileDown, PlusCircle, Table } from "lucide-react"
import { cn } from "@/lib/utils"

interface IInvoiceScan {
  _id: string
  id: string
  invoiceNumber: string
  invoiceDate: string
  date: Date
  supplierName: string
  supplierVAT: string
  customerName: string
  customerVAT: string
  amountBeforeVAT: number
  totalVAT: number
  totalAmount: number
  qrCodePresent: boolean
  qrCodeValid: boolean
  status: string
  createdAt: string
  isInvoiceCreated: boolean
}

export default function InvoiceScanPage() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [invoiceScans, setInvoiceScans] = useState<IInvoiceScan[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWidth } = useScreenSize();

  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('Recently Added');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingInvoiceScan, setDeletingInvoiceScan] = useState<IInvoiceScan | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingInvoiceScan, setEditingInvoiceScan] = useState<IInvoiceScan | null>(null);

  const router = useRouter();

  // Fetch invoice scans from API
  const fetchInvoiceScans = async () => {
    try {
      const response = await axios.get('/api/user/invoice/invoice-scan');
      setInvoiceScans(response.data.data);
    } catch (error) {
      console.error('Error fetching invoice scans:', error);
      showErrorToast('Failed to fetch invoice scans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceScans();
  }, []);

  // Handle edit click
  const handleEditClick = (invoiceScan: IInvoiceScan) => {
    setEditingInvoiceScan(invoiceScan);
    setShowEditForm(true);
  };

  // Handle successful update
  const handleInvoiceScanUpdated = () => {
    setShowEditForm(false);
    setEditingInvoiceScan(null);
    fetchInvoiceScans(); // Refresh the list
  };

  const handleDeleteClick = (invoiceScan: IInvoiceScan) => {
    setDeletingInvoiceScan(invoiceScan)
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingInvoiceScan) return;

    setIsDeleting(true);
    const loadingToastId = showLoadingToast('Deleting Invoice Scan...');
    
    try {
      await axios.delete(`/api/user/invoice/invoice-scan/${deletingInvoiceScan?._id}`);
      setInvoiceScans(prev => prev.filter(is => is._id !== deletingInvoiceScan._id));
      dismissToast(loadingToastId);
      showSuccessToast('Invoice scan deleted successfully!');
      setShowDeleteModal(false);
    } catch (error) {
      dismissToast(loadingToastId);
      if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data.error || "Failed to delete invoice scan");
      } else if (error instanceof Error) {
        showErrorToast(error.message);
      } else {
        showErrorToast("An unexpected error occurred");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Filter invoice scans based on search term and invoice creation status
  const filteredInvoiceScans = invoiceScans.filter(invoiceScan => {
    const matchesSearch =
      invoiceScan?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoiceScan?.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoiceScan?.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

    const createdAt = new Date(invoiceScan.createdAt);
    const matchesDateRange = !range?.from || !range?.to || 
        (createdAt >= range.from && createdAt <= range.to);
      
    // Time period filters
    const now = new Date();
    const matchesTimePeriod = 
        dateFilter === 'Last Month' ? 
        createdAt >= new Date(now.setMonth(now.getMonth() - 1)) :
        dateFilter === 'Last 7 Days' ?
        createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
        true;
    
    // Only show invoice scans that don't have invoices created yet
    const matchesInvoiceStatus = !invoiceScan.isInvoiceCreated;
    
    return matchesSearch && matchesDateRange && matchesTimePeriod && matchesInvoiceStatus;
  });

  const sortedInvoiceScans = [...filteredInvoiceScans].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (dateFilter === 'Recently Added' || dateFilter === 'Descending') {
          return dateB - dateA; // Newest first
      } else if (dateFilter === 'Ascending') {
          return dateA - dateB; // Oldest first
      }
      return 0;
  });
    
  // Pagination calculations
  const totalInvoiceScans = sortedInvoiceScans.length;
  const indexOfLastInvoiceScan = currentPage * rowsPerPage;
  const indexOfFirstInvoiceScan = indexOfLastInvoiceScan - rowsPerPage;
  const currentInvoiceScans = sortedInvoiceScans.slice(indexOfFirstInvoiceScan, indexOfLastInvoiceScan);

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow PDF
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showErrorToast("File type not supported. Upload PDF or Image.");
      return;
    }

    const loadingToastId = showLoadingToast("Uploading and processing invoice...");

    try {
        // Create FormData and append the file
        const formData = new FormData();
        formData.append("file", file);

        // Send POST request to backend
        const response = await axios.post(
        "/api/user/invoice/invoice-scan",
        formData,
        {
            headers: {
            "Content-Type": "multipart/form-data",
            },
        }
        );

        if (response.data.success) {
        showSuccessToast("Invoice processed successfully!");
        console.log("Extracted data:", response.data);
        fetchInvoiceScans(); // Refresh list if needed
        } else {
        showErrorToast(response.data.message || "Failed to process invoice");
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data?.message || "Upload failed");
        } else {
        showErrorToast("Unexpected error occurred");
        }
    } finally {
        dismissToast(loadingToastId);
        e.target.value = ""; // Reset file input so same file can be re-uploaded
    }
    };



  const handleCreateInvoice = (invoiceScan: IInvoiceScan) => {
    // Redirect to invoice creation page with pre-filled data
    router.push(`/user/invoices?mode=add-invoice&scanId=${invoiceScan._id}`);
  };

  return (
    <>
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the invoice scan for <span className="font-medium">{deletingInvoiceScan?.invoiceNumber}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete()}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 w-full max-w-7xl mx-auto px-8 pb-16">


        {/* Main Content */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className='flex flex-col gap-2'>
                <h1 className="text-3xl font-bold text-primary-dull/90">
                    Invoices Scan
                </h1>
                <h6 className='text-lg text-gray-400 font-medium'>
                    Upload the invoice files to scan and extract invoice data automatically.
                </h6>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">            
                <div className='flex gap-4 items-center'>
                    
                    
                    {/* Export Button */}
                    <DropdownMenu onOpenChange={setShowExportMenu}>
                        <DropdownMenuTrigger
                            className={`${
                                showExportMenu ? 'bg-primary-medium text-white' : 'bg-white text-black'
                            } border border-gray-200 rounded shadow-md cursor-pointer hover:bg-gray-100 h-10 px-4 flex items-center gap-2`}
                        >
                            <FileDown className="w-4 h-4" />
                            Export
                            <ChevronDown className="w-3 h-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            className="bg-white border border-gray-200 rounded shadow-lg p-2 mt-1"
                            align="end"
                        >
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer py-2 px-3 rounded text-sm hover:bg-gray-100">
                                <Table className="w-4 h-4" />
                                Export as Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer py-2 px-3 rounded text-sm hover:bg-gray-100">
                                <BarChart3 className="w-4 h-4" />
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
    
                <input
                  type="file"
                  id="invoiceUpload"
                  accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleInvoiceUpload}
                />
                <label 
                  htmlFor="invoiceUpload"
                  className='h-10 flex gap-2 items-center justify-center px-4 text-sm bg-primary-medium cursor-pointer rounded text-white font-medium shadow-md hover:bg-primary-bright transition-colors border border-primary-medium'
                >
                  <PlusCircle className="w-4 h-4" />Scan Invoice
                </label>
            </div>
        </div>

          {/* Table Section */}
          <div className='mt-10'>
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white px-4 py-6 rounded-t-lg shadow-md outline-2 outline-gray-100 ">
              <div className="text-xl text-gray-500 font-medium">
                Scanned Invoices List
              </div>

              {/* Table filters */}
              <div className='flex flex-col xl:flex-row gap-4'>  
                <div className='flex gap-4'>
                  {/* <DateRangeFilter 
                    range={range} 
                    onRangeChange={setRange}
                  /> */}
                </div>

                <div className='flex gap-4'>
                  <div className='flex gap-2 items-center'>
                    <p className='text-md font-medium text-gray-500'>Sort By:</p>     
                    {/* <CustomSelect
                      value={dateFilter}
                      onValueChange={setDateFilter}
                      options={["Recently Added", "Ascending", "Descending", "Last Month", "Last 7 Days"]}
                      placeholder="Sort by"
                      width="w-42"
                      onPageReset={() => setCurrentPage(1)}
                    />   */}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRange(undefined);
                      setDateFilter('Recently Added');
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="py-5 text-gray-700 text-sm w-fit"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Entries and search bar div */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-b border-gray-200">
              {/* Rows per page select */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                {/* <CustomSelect
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => setRowsPerPage(Number(value))}
                  options={["2", "5", "10", "15", "20"]}
                  placeholder="Select rows"
                  width="w-[80px]"
                  onPageReset={() => setCurrentPage(1)}
                  hideChevron={false}
                  className="text-sm py-2 px-0 cursor-pointer"
                /> */}
              </div>
              
              {/* Search bar */}
              {/* <SearchBar
                placeholder="Search scanned invoices..."
                value={searchTerm}
                onChange={(value: string) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                className="w-64"
              /> */}
            </div>

            {/* Main table */}
            <div className="overflow-x-auto bg-white rounded-b-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "Invoice ID",
                      "Invoice Number", 
                      "Invoice Date", 
                      "Supplier Name", 
                      "Supplier VAT",
                      "Customer Name", 
                      "Customer VAT",
                      "Amount Before VAT",
                      "Total VAT", 
                      "Total Amount",
                      "QR Code",
                      "Status",
                      "Created Date",
                      "Actions"
                    ].map((header, idx) => (
                      <th 
                        key={idx} 
                        scope="col" 
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                {loading ? 
                  <tbody>
                    <tr>
                      <td colSpan={14} className="px-6 py-4">
                        <div className="flex items-center justify-center w-full py-5">
                          <div className="w-10 h-10 border-4 border-primary-dull border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                :
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentInvoiceScans.map((invoiceScan) => (
                    <tr key={invoiceScan._id} className='hover:bg-gray-50'>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoiceScan.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoiceScan.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(invoiceScan.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoiceScan.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoiceScan.supplierVAT}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoiceScan.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoiceScan.customerVAT}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        SAR {invoiceScan.amountBeforeVAT?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        SAR {invoiceScan.totalVAT?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        SAR {invoiceScan.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={invoiceScan.qrCodePresent} disabled />
                          {invoiceScan.qrCodePresent && (
                            <Checkbox checked={invoiceScan.qrCodeValid} disabled />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoiceScan.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          invoiceScan.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          invoiceScan.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoiceScan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(invoiceScan.createdAt).toLocaleDateString()}
                      </td>
                      
                      <td className="py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleCreateInvoice(invoiceScan)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 cursor-pointer"
                          title="Create Invoice"
                        >
                          <FiFileText className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(invoiceScan)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 cursor-pointer"
                          title="Edit Invoice Scan"
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(invoiceScan)}
                          className="text-gray-700 hover:text-red-500 p-2 rounded-full hover:bg-red-100 cursor-pointer"
                          title="Delete Invoice Scan"
                        >
                          <MdDeleteForever className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                }
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalInvoiceScans}
              itemsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              className="px-6 py-4 bg-white border-t border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && editingInvoiceScan && (
          <InvoiceScanEditForm
            invoiceScan={editingInvoiceScan}
            onClose={() => {
              setShowEditForm(false);
              setEditingInvoiceScan(null);
            }}
            onInvoiceScanUpdated={handleInvoiceScanUpdated}
          />
        )}
      </AnimatePresence>
    </> 
  )
}

// Edit Form Component (similar to your invoice form but simplified)
interface InvoiceScanEditFormProps {
  invoiceScan: IInvoiceScan
  onClose: () => void
  onInvoiceScanUpdated: () => void
}

function InvoiceScanEditForm({ invoiceScan, onClose, onInvoiceScanUpdated }: InvoiceScanEditFormProps) {
  const [formData, setFormData] = useState({
    id: invoiceScan.id || "",
    invoiceNumber: invoiceScan.invoiceNumber || "",
    invoiceDate: invoiceScan.invoiceDate || new Date().toISOString().split('T')[0],
    date: invoiceScan.date ? new Date(invoiceScan.date) : new Date(),
    supplierName: invoiceScan.supplierName || "",
    supplierVAT: invoiceScan.supplierVAT || "",
    customerName: invoiceScan.customerName || "",
    customerVAT: invoiceScan.customerVAT || "",
    amountBeforeVAT: invoiceScan.amountBeforeVAT || 0,
    totalVAT: invoiceScan.totalVAT || 0,
    totalAmount: invoiceScan.totalAmount || 0,
    qrCodePresent: invoiceScan.qrCodePresent || false,
    qrCodeValid: invoiceScan.qrCodeValid || false,
    status: invoiceScan.status || "Draft",
  })

  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    const loadingToast = showLoadingToast("Updating invoice scan...")
    setLoading(true)
    
    try {
      await axios.put(`/api/user/invoice/invoice-scan/${invoiceScan._id}`, formData)
      showSuccessToast("Invoice scan updated successfully!")
      onInvoiceScanUpdated()
    } catch (error) {
      console.error("Error updating invoice scan:", error)
      if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data.error || "Failed to update invoice scan")
      } else if (error instanceof Error) {
        showErrorToast(error.message)
      } else {
        showErrorToast("Failed to update invoice scan")
      }
    } finally {
      dismissToast(loadingToast)
      setLoading(false)
    }
  }

  const totalAmount = (formData.amountBeforeVAT || 0) + (formData.totalVAT || 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-primary-dull">Edit Invoice Scan</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

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

              <div className="flex flex-col gap-2">
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
              </div>

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

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary-medium hover:bg-primary-bright text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}