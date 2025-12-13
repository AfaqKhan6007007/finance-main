'use client'
import { useSearchParams, useRouter} from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import CompanyForm from "@/components/pages/company/CompanyForm";
import ListView from "@/components/pages/company/ListView";
import { useState, useEffect } from "react";
import { ICompany } from "@/types/company";
import axios from "axios"
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { motion, AnimatePresence } from 'framer-motion';
import { FilterConfig, FilterValues } from "@/types/filters";
import FilterBar from "@/components/layout/FilterBar";
// import { IKanbanView } from "@/types/kanbanView";
// import KanbanCreateModal from "@/components/pages/company/KanbanCreateModal";
// import KanbanView from "@/components/pages/company/KanbanView";
// import ReportView from "@/components/pages/company/ReportView";

export default function CompanyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get("mode") || "list";
  // check id in the query to open a unique company
  const companyId = searchParams.get("id");
  const [companies, setCompanies] = useState<ICompany[]>([]);

  // const kanbanBoardName = searchParams.get("kanbanBoard")
  // const [kanbanViews, setKanbanViews] = useState<IKanbanView[]>([]);
  // const [selectedKanbanBoard, setSelectedKanbanBoard] = useState<string>(kanbanBoardName || '');
  // const [showKanbanBoard ,setShowKanbanBoard] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true)

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<ICompany | null>(null);

  const [filters, setFilters] = useState({
      companyId: "",
    });
  
    const handleFiltersChange = (newFilters: FilterValues) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    };
  
    // Filter config for FilterBar
    const filterConfigs: FilterConfig[] = [
      {
        id: "companyId", 
        type: "id",
        props: {
          value: filters.companyId,
          placeholder: "ID",
          className: "w-80"
        }
      },
    ];
  
  
    const filteredCompanies = companies.filter(company => {
      const term = searchTerm.toLowerCase();
      
      // Search term filter
      const matchesSearch = 
        company.companyName?.toLowerCase().includes(term) ||
        company.abbreviation?.toLowerCase().includes(term) ||
        company.country?.toLowerCase().includes(term) ||
        company.domain?.toLowerCase().includes(term)
      
      
      // Account ID filter
      const matchesCompanyId = !filters.companyId || 
        company.companyName?.toLowerCase().includes(filters.companyId.toLowerCase());
  
      
      return matchesSearch && 
             matchesCompanyId
    });


  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/user/company")

      const payload = res.data
      let arr: ICompany[] = []
      if (Array.isArray(payload)) {
        arr = payload
      } else if (Array.isArray(payload.companies)) {
        arr = payload.companies
      } else if (Array.isArray(payload.data)) {
        arr = payload.data
      } else if (Array.isArray(payload.items)) {
        arr = payload.items
      } else if (Array.isArray(payload.result)) {
        arr = payload.result
      } else {
        // fallback: try to find any array value on the object
        const firstArray = Object.values(payload).find(v => Array.isArray(v))
        if (Array.isArray(firstArray)) arr = firstArray as ICompany[]
      }

      setCompanies(arr || [])
    } catch (err) {
      console.error("fetchCompanies error:", err)
      showErrorToast("Failed to load companies")
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  // const fetchKanbanViews = async () => {
  //   try {
  //     const res = await axios.get("/api/user/kanbanView");
  //     if (res.data.success) {
  //       setKanbanViews(res.data.data || []);

  //       // Auto-select first board if none selected and we have boards
  //       if (res.data.data.length > 0 && !selectedKanbanBoard) {
  //         const firstBoard = res.data.data[0].name;
  //         setSelectedKanbanBoard(firstBoard)
  //         if (mode === "kanban") {
  //           updateUrlWithBoard(firstBoard);
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     console.error("fetchKanbanViews error:", err);
  //     setKanbanViews([]);
  //   } 
  // };

  useEffect(() => {
    fetchCompanies()
    // fetchKanbanViews()
  }, [])

  // const updateUrlWithBoard = (boardName: string) => {
  //   const params = new URLSearchParams(searchParams.toString());
  //   params.set("mode", "kanban");
  //   params.set("kanbanBoard", boardName);
  //   router.push(`?${params.toString()}`);
  // };

  // Callback to refresh companies
  const handleCompanySaved = () => {
    fetchCompanies() // Refetch companies after save
  }

  // const onKanbanBoardChange = (boardName: string) => {
  //   if (boardName=== 'create-new') {
  //     setShowKanbanBoard(true)
  //     return;
  //   }
    
  //   setSelectedKanbanBoard(boardName);
  //   updateUrlWithBoard(boardName);
  // };

  // const onKanbanBoardAdded = (newBoardName: string) => {
  //   fetchKanbanViews().then(() => {
  //     // Auto-select the newly created board
  //     setSelectedKanbanBoard(newBoardName);
  //     updateUrlWithBoard(newBoardName);
  //   });
  // };

  // const handleAddCompany = (columnName?: string, columnsBasedon?: string) => {
  //   // If we have column info from kanban view, pass it as params
  //   const params: Record<string, string> = {}
    
  //   if (columnName && columnsBasedon) {
  //     // Map the column basis to the actual form field name
  //     params[columnsBasedon] = columnName
  //   }
    
  //   setMode("add-company", params)
  // }

  const setMode = (newMode: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newMode)
    // Set all extra parameters
    Object.entries(extra).forEach(([k, v]) => {
      if (v) {
        params.set(k, v)
      } else {
        params.delete(k)
      }
    })

    // If switching away from kanban mode, remove kanbanBoard from URL
    if (newMode !== "kanban") {
      params.delete("kanbanBoard");
      // setSelectedKanbanBoard(''); // Also clear the selected board
    }
    
    router.push(`?${params.toString()}`);
  }

  const handleDeleteClick = (company: ICompany) => {
      setDeletingCompany(company);
      setShowDeleteModal(true);
    };
  
    const confirmDelete = async () => {
      if (!deletingCompany) return;
  
      setIsDeleting(true);
      const loadingToastId = showLoadingToast('Deleting Company...');
      
      try {
        await axios.delete(`/api/user/company/${deletingCompany._id}`);
        
        // Remove from local state
        setCompanies(prev => prev.filter(company => company._id !== deletingCompany._id));
        dismissToast(loadingToastId);
        showSuccessToast('Company deleted successfully!');
        setShowDeleteModal(false);
        
        // navigate to list view without the id param
         const params = new URLSearchParams();
          params.set("mode", "list");
          router.push(`?${params.toString()}`);
       
      } catch (error) {
        dismissToast(loadingToastId);
        if (axios.isAxiosError(error)) {
          showErrorToast(error.response?.data.error || "Failed to delete company");
        } else if (error instanceof Error) {
          showErrorToast(error.message);
        } else {
          showErrorToast("An unexpected error occurred");
        }
      } finally {
        setIsDeleting(false);
        setDeletingCompany(null);
      }
    };

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
                Are you sure you want to delete company <span className="font-medium">{deletingCompany?.companyName}</span>? All of its accounts will also be deleted and this action cannot be undone.
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
           && !companyId 
           && (
              <>
                <PageHeader 
                  title="Companies"  
                  setMode={setMode} 
                  // kanbanViews={kanbanViews}
                  // selectedKanbanBoard={selectedKanbanBoard}
                  // onKanbanBoardChange={onKanbanBoardChange}
                  onSearch={setSearchTerm}
                />
                <FilterBar 
                filters={filterConfigs} 
                onFiltersChange={handleFiltersChange}
                />
              </>
              )
        }

        {/* Kanban View - Commented for now */}
        {/* {mode === "kanban" && 
          <KanbanView
            companies={filteredCompanies}
            kanbanViews={kanbanViews}
            loading={loading}
            onAddKanbanBoard={() => setShowKanbanBoard(true)}
            onAddCompany={(columnName, columnsBasedon) => handleAddCompany(columnName, columnsBasedon)}
            onEditCompany={(id) => setMode("edit", { id })}
          />
        } */}

        {mode === "list" && 
          <ListView
            companies={filteredCompanies}
            loading={loading}
            onRowClick={(id: string) => setMode("edit", { id })}
          />
        }

        {/* Report View - Commented for now */}
        {/* {mode === "report" &&
          <ReportView
            companies={filteredCompanies}
            loading={loading}
            onRowClick={(id: string) => setMode("edit", { id })} 
          />
        } */}

        {
          (mode.startsWith("add-") || mode === "edit") 
          && 
          <CompanyForm
            mode={mode} 
            companies={companies} 
            company={companies.find(comp => comp._id === companyId) || undefined}
            onCompanySaved={handleCompanySaved}
            onDeleteClick={handleDeleteClick}
          />
        }
      </div>

      {/* Kanban Create Modal - Commented for now */}
      {/* {showKanbanBoard && 
        <KanbanCreateModal 
          handleShowKanbanBoard={() => setShowKanbanBoard(false)}
          onKanbanBoardAdded = {(boardName) => onKanbanBoardAdded(boardName)}
        />
      } */}
    </div>
  );
}