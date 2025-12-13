'use client'
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ListView from "@/components/pages/invoices/ListView";
import { useState, useEffect } from "react";
import { IInvoice } from "@/types/inovice";
import axios from "axios"
import { showErrorToast, showLoadingToast, dismissToast, showSuccessToast } from "@/lib/toast";
import { IKanbanView } from "@/types/kanbanView";
// import KanbanCreateModal from "@/components/pages/invoices/KanbanCreateModal";
import KanbanView from "@/components/pages/invoices/KanbanView";
import ReportView from "@/components/pages/invoices/ReportView";
// import { invoices } from "@/data/invoices";
import InvoiceForm from "@/components/pages/invoices/AddInvoice";
import { motion, AnimatePresence } from 'framer-motion';

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get("mode") || "list";
  const invoiceId = searchParams.get("id");
  const [invoices, setInvoices] = useState<IInvoice[]>([]);

  const kanbanBoardName = searchParams.get("kanbanBoard")
  const [kanbanViews, setKanbanViews] = useState<IKanbanView[]>([]);
  const [selectedKanbanBoard, setSelectedKanbanBoard] = useState<string>(kanbanBoardName || '');
  const [showKanbanBoard, setShowKanbanBoard] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<IInvoice | null>(null);

  const filteredInvoices = invoices.filter(invoice => {
    const term = searchTerm.toLowerCase();
    return (
      invoice.id?.toLowerCase().includes(term) ||
      invoice.invoiceNumber?.toLowerCase().includes(term) ||
      invoice.supplierName?.toLowerCase().includes(term) ||
      invoice.customerName?.toLowerCase().includes(term) ||
      invoice.status?.toLowerCase().includes(term)
    );
  });

  
  const handleDeleteClick = (invoice: IInvoice) => {
    setDeletingInvoice(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingInvoice) return;

    setIsDeleting(true);
    const loadingToastId = showLoadingToast('Deleting Invoice...');
    
    try {
      await axios.delete(`/api/user/invoice/${deletingInvoice._id}`);
      
      // Remove from local state
      setInvoices(prev => prev.filter(inv => inv._id !== deletingInvoice._id));
      if(deletingInvoice.scannedInvoiceId){
        try {
          await axios.put(`/api/user/invoice/invoice-scan/${deletingInvoice.scannedInvoiceId}`, {
            isInvoiceCreated: false
          })
          console.log("Invoice scan updated successfully")
        } catch (scanError) {
          console.error("Error updating invoice scan:", scanError)
        }
      }
      dismissToast(loadingToastId);
      showSuccessToast('Invoice deleted successfully!');
      setShowDeleteModal(false);
     
    } catch (error) {
      dismissToast(loadingToastId);
      if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data.error || "Failed to delete invoice");
      } else if (error instanceof Error) {
        showErrorToast(error.message);
      } else {
        showErrorToast("An unexpected error occurred");
      }
    } finally {
      setIsDeleting(false);
      setDeletingInvoice(null);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/user/invoice")
      
      let arr: IInvoice[] = []
      if (Array.isArray(res.data)) {
        arr = res.data
      } else if (Array.isArray(res.data.invoices)) {
        arr = res.data.invoices
      } else if (Array.isArray(res.data.data)) {
        arr = res.data.data
      } else if (Array.isArray(res.data.items)) {
        arr = res.data.items
      } else if (Array.isArray(res.data.result)) {
        arr = res.data.result
      } else {
        const firstArray = Object.values(res.data).find(v => Array.isArray(v))
        if (Array.isArray(firstArray)) arr = firstArray as IInvoice[]
      }

      setInvoices(arr || [])
    } catch (err) {
      console.error("fetchInvoices error:", err)
      showErrorToast("Failed to load invoices")
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

//   const fetchKanbanViews = async () => {
//     try {
//       const res = await axios.get("/api/user/kanbanView/invoices");
//       if (res.data.success) {
//         setKanbanViews(res.data.data || []);

//         if (res.data.data.length > 0 && !selectedKanbanBoard) {
//           const firstBoard = res.data.data[0].name;
//           setSelectedKanbanBoard(firstBoard)
//           if (mode === "kanban") {
//             updateUrlWithBoard(firstBoard);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("fetchKanbanViews error:", err);
//       setKanbanViews([]);
//     }
//   };

  useEffect(() => {
    fetchInvoices()
    // fetchKanbanViews()
  }, [])

//   const updateUrlWithBoard = (boardName: string) => {
//     const params = new URLSearchParams(searchParams.toString());
//     params.set("mode", "kanban");
//     params.set("kanbanBoard", boardName);
//     router.push(`?${params.toString()}`);
//   };

//   const onKanbanBoardChange = (boardName: string) => {
//     if (boardName === 'create-new') {
//       setShowKanbanBoard(true)
//       return;
//     }
    
//     setSelectedKanbanBoard(boardName);
//     updateUrlWithBoard(boardName);
//   };

//   const onKanbanBoardAdded = (newBoardName: string) => {
//     fetchKanbanViews().then(() => {
//       setSelectedKanbanBoard(newBoardName);
//       updateUrlWithBoard(newBoardName);
//     });
//   };

  const handleAddInvoice = (columnName?: string, columnsBasedon?: string) => {
    const params: Record<string, string> = {}
    
    if (columnName && columnsBasedon) {
      params[columnsBasedon] = columnName
    }
    
    setMode("add-invoice", params)
  }

  const handleInvoiceSaved = () => {
    fetchInvoices() // Refetch invoices after save
  }

  const setMode = (newMode: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newMode)
    
    Object.entries(extra).forEach(([k, v]) => {
      if (v) {
        params.set(k, v)
      } else {
        params.delete(k)
      }
    })

    if (newMode === "kanban" && kanbanViews.length > 0 && !params.get("kanbanBoard")) {
      const firstBoard = kanbanViews[0].name;
      params.set("kanbanBoard", firstBoard);
      setSelectedKanbanBoard(firstBoard);
    }

    if (newMode !== "kanban") {
      params.delete("kanbanBoard");
      setSelectedKanbanBoard('');
    }
    
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="h-full">
      {/* Delete Confirmation Modal */}
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
                Are you sure you want to delete invoice <span className="font-medium">{deletingInvoice?.invoiceNumber}</span>? This action cannot be undone.
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
                  onClick={confirmDelete}
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
      <div className="w-full h-full flex flex-col gap-8">
        
        {!mode.startsWith("add-")
          && !invoiceId 
          && (<PageHeader 
                title="Invoices"  
                setMode={setMode} 
                kanbanViews={kanbanViews}
                selectedKanbanBoard={selectedKanbanBoard}
                // onKanbanBoardChange={onKanbanBoardChange}
                onSearch={setSearchTerm}
              />
            )
        }

        {/* Page body reacts to mode */}
        {mode === "kanban" && 
          <KanbanView
            invoices={filteredInvoices}
            kanbanViews={kanbanViews}
            loading={loading}
            onAddKanbanBoard={() => setShowKanbanBoard(true)}
            onAddInvoice={(columnName, columnsBasedon) => handleAddInvoice(columnName, columnsBasedon)}
            onEditInvoice={(id) => setMode("edit", { id })}
          />
        }

        {mode === "list" && 
          <ListView
            invoices={filteredInvoices}
            loading={loading}
            onRowClick={(id: string) => setMode("edit", { id })}
            onDeleteClick={handleDeleteClick}
          />
        }

        {mode === "report" &&
          <ReportView
            invoices={filteredInvoices}
            loading={loading}
            onRowClick={(id: string) => setMode("edit", { id })} 
          />
        }

        {
          (mode.startsWith("add-") || mode === "edit") 
          && 
          <InvoiceForm
            mode={mode} 
            invoice={invoices.find(invoice => invoice.id === invoiceId) || undefined} 
            onInvoiceSaved={handleInvoiceSaved}
          />
        }
      </div>
      {/* {showKanbanBoard && 
        <KanbanCreateModal 
          handleShowKanbanBoard={() => setShowKanbanBoard(false)}
          onKanbanBoardAdded={(boardName) => onKanbanBoardAdded(boardName)}
        />
      } */}
    </div>
  );
}