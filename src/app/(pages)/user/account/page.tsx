// app/account/page.tsx
'use client'
import { useSearchParams, useRouter} from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import AccountForm from "@/components/pages/account/AccountForm";
import ListView from "@/components/pages/account/ListView";
import { useState, useEffect } from "react";
import { IAccount } from "@/types/account";
import axios from "axios"
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { IKanbanView } from "@/types/kanbanView";
import KanbanCreateModal from "@/components/pages/account/KanbanCreateModal";
import KanbanView from "@/components/pages/account/KanbanView";
import ReportView from "@/components/pages/account/ReportView";
import { motion, AnimatePresence } from 'framer-motion';
import { FilterConfig, FilterValues } from "@/types/filters";
import FilterBar from "@/components/layout/FilterBar";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get("mode") || "list";
  // check id in the query to open a unqiue account
  const accountId = searchParams.get("id");
  const [accounts, setAccounts] = useState<IAccount[]>([]);

  const kanbanBoardName = searchParams.get("kanbanBoard")
  const [kanbanViews, setKanbanViews] = useState<IKanbanView[]>([]);
  const [selectedKanbanBoard, setSelectedKanbanBoard] = useState<string>(kanbanBoardName || '');
  const [showKanbanBoard ,setShowKanbanBoard] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true)

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<IAccount | null>(null);

  const [filters, setFilters] = useState({
    companies: "",
    accountIds: "",
    accountNumbers: "",      
    rootTypes: "",           
    reportTypes: "",         
    accountTypes: "", 
    // other filters...
  });

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Filter config for FilterBar
  const filterConfigs: FilterConfig[] = [
    {
      id: "companies",
      type: "company",
      props: {
        value: filters.companies,
        placeholder: "Company",
        className: "w-80"
      }
    },
    {
      id: "accountIds", 
      type: "id",
      props: {
        value: filters.accountIds,
        placeholder: "ID",
        className: "w-80"
      }
    },
    {
      id: "accountNumbers",
      type: "accountNumber",
      props: {
        value: filters.accountNumbers,
        placeholder: "Account Number",
        className: "w-64"
      }
    },
    {
      id: "rootTypes",
      type: "rootType",
      props: {
        value: filters.rootTypes,
        placeholder: "Root Type",
        className: "w-48"
      }
    },
    {
      id: "reportTypes",
      type: "reportType",
      props: {
        value: filters.reportTypes,
        placeholder: "Report Type",
        className: "w-48"
      }
    },
    {
      id: "accountTypes",
      type: "accountType",
      props: {
        value: filters.accountTypes,
        placeholder: "Account Type",
        className: "w-64"
      }
    }
  ];


  const filteredAccounts = accounts.filter(acc => {
    const term = searchTerm.toLowerCase();
    
    // Search term filter
    const matchesSearch = 
      acc.id?.toLowerCase().includes(term) ||
      acc.accountName?.toLowerCase().includes(term) ||
      acc.accountNumber?.toLowerCase().includes(term);
    
    // Company filter 
    const matchesCompany = !filters.companies || acc.company === filters.companies; 

    // Account ID filter
    const matchesAccountId = !filters.accountIds || 
      acc.id?.toLowerCase().includes(filters.accountIds.toLowerCase());

    // Account Number filter (partial matching)
    const matchesAccountNumber = !filters.accountNumbers || 
      acc.accountNumber?.toLowerCase().includes(filters.accountNumbers.toLowerCase());
    
    // Root Type filter (exact matching)
    const matchesRootType = !filters.rootTypes || acc.rootType === filters.rootTypes;
    
    // Report Type filter (exact matching)
    const matchesReportType = !filters.reportTypes || acc.reportType === filters.reportTypes;
    
    // Account Type filter (exact matching)
    const matchesAccountType = !filters.accountTypes || acc.accountType === filters.accountTypes;
    
    return matchesSearch && 
           matchesCompany && 
           matchesAccountId && 
           matchesAccountNumber && 
           matchesRootType && 
           matchesReportType && 
           matchesAccountType;
  });


  const fetchAccounts = async () => {
      setLoading(true)
      try {
        const res = await axios.get("/api/user/account")

        const payload = res.data
        let arr: IAccount[] = []
        if (Array.isArray(payload)) {
          arr = payload
        } else if (Array.isArray(payload.accounts)) {
          arr = payload.accounts
        } else if (Array.isArray(payload.data)) {
          arr = payload.data
        } else if (Array.isArray(payload.items)) {
          arr = payload.items
        } else if (Array.isArray(payload.result)) {
          arr = payload.result
        } else {
          // fallback: try to find any array value on the object
          const firstArray = Object.values(payload).find(v => Array.isArray(v))
          if (Array.isArray(firstArray)) arr = firstArray as IAccount[]
        }

        setAccounts(arr || [])
      } catch (err) {
        console.error("fetchAccounts error:", err)
        showErrorToast("Failed to load accounts")
        setAccounts([])
      } finally {
        setLoading(false)
      }
    }

    const fetchKanbanViews = async () => {
      try {
        const res = await axios.get("/api/user/kanbanView");
        if (res.data.success) {
          setKanbanViews(res.data.data || []);

          // Auto-select first board if none selected and we have boards
          if (res.data.data.length > 0 && !selectedKanbanBoard) {
            const firstBoard = res.data.data[0].name;
            setSelectedKanbanBoard(firstBoard)
            if (mode === "kanban") {
              updateUrlWithBoard(firstBoard);
            }
          }
          
        }
      } catch (err) {
        console.error("fetchKanbanViews error:", err);
        setKanbanViews([]);
      } 
    };

  useEffect(() => {
    fetchAccounts()
    fetchKanbanViews()
  }, [])


  const updateUrlWithBoard = (boardName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", "kanban");
    params.set("kanbanBoard", boardName);
    router.push(`?${params.toString()}`);
  };

  // Callback to refresh accounts
  const handleAccountSaved = () => {
    fetchAccounts() // Refetch accounts after save
  }


  const onKanbanBoardChange = (boardName: string) => {
    if (boardName=== 'create-new') {
      setShowKanbanBoard(true)
      return;
    }
    
    setSelectedKanbanBoard(boardName);
    updateUrlWithBoard(boardName);
  };

  const onKanbanBoardAdded = (newBoardName: string) => {
    fetchKanbanViews().then(() => {
      // Auto-select the newly created board
      setSelectedKanbanBoard(newBoardName);
      updateUrlWithBoard(newBoardName);
    });
  };

  const handleAddAccount = (columnName?: string, columnsBasedon?: string) => {
  // If we have column info from kanban view, pass it as params
  const params: Record<string, string> = {}
  
  if (columnName && columnsBasedon) {
    // Map the column basis to the actual form field name
    params[columnsBasedon] = columnName
  }
  
  setMode("add-account", params)
}


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

    if (newMode === "kanban" && kanbanViews.length > 0 && !params.get("kanbanBoard")) {
      const firstBoard = kanbanViews[0].name;
      params.set("kanbanBoard", firstBoard);
      setSelectedKanbanBoard(firstBoard);
    }

    // If switching away from kanban mode, remove kanbanBoard from URL
    if (newMode !== "kanban") {
      params.delete("kanbanBoard");
      setSelectedKanbanBoard(''); // Also clear the selected board
    }
    
    router.push(`?${params.toString()}`);
  }

  const handleDeleteClick = (account: IAccount) => {
    setDeletingAccount(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingAccount) return;

    setIsDeleting(true);
    const loadingToastId = showLoadingToast('Deleting Account...');
    
    try {
      await axios.delete(`/api/user/account/${deletingAccount._id}`);
      
      // Remove from local state
      setAccounts(prev => prev.filter(acc => acc._id !== deletingAccount._id));
      dismissToast(loadingToastId);
      showSuccessToast('Account deleted successfully!');
      setShowDeleteModal(false);
      
      // navigate to list view without the id param
       const params = new URLSearchParams();
        params.set("mode", "list");
        router.push(`?${params.toString()}`);
     
    } catch (error) {
      dismissToast(loadingToastId);
      if (axios.isAxiosError(error)) {
        showErrorToast(error.response?.data.error || "Failed to delete account");
      } else if (error instanceof Error) {
        showErrorToast(error.message);
      } else {
        showErrorToast("An unexpected error occurred");
      }
    } finally {
      setIsDeleting(false);
      setDeletingAccount(null);
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
                Are you sure you want to delete account <span className="font-medium">{deletingAccount?.accountName}</span>? This action cannot be undone.
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
         && !accountId 
         && ( <>
              <PageHeader 
                title="Accounts"  
                setMode={setMode} 
                kanbanViews={kanbanViews}
                selectedKanbanBoard={selectedKanbanBoard}
                onKanbanBoardChange={onKanbanBoardChange}
                onSearch={setSearchTerm}
              />
              <FilterBar 
                filters={filterConfigs} 
                onFiltersChange={handleFiltersChange}
                />
              </>
            )
      }

      {/* Page body reacts to mode */}
      {mode === "kanban" && 
        <KanbanView
          accounts={filteredAccounts}
          kanbanViews={kanbanViews}
          loading={loading}
          onAddKanbanBoard={() => setShowKanbanBoard(true)}
          onAddAccount={(columnName, columnsBasedon) => handleAddAccount(columnName, columnsBasedon)}
          onEditAccount={(id) => setMode("edit", { id })}
        />
      }

      {mode === "list" && 
        <ListView
          accounts={filteredAccounts}
          loading={loading} //pass the loading state, so while accounts are being fetch, it shows loading on the list view
          onRowClick={(id: string) => setMode("edit", { id })} // pass callback
        />
      }

      {mode === "report" &&
        <ReportView
          accounts={filteredAccounts}
          loading={loading}
          onRowClick={(id: string) => setMode("edit", { id })} 
        />
      }


      {
        (mode.startsWith("add-") || mode === "edit") 
        && 
        <AccountForm
          mode={mode} 
          accounts={accounts} 
          account={accounts.find(acc => acc.id === accountId)}
          onAccountSaved={handleAccountSaved}
          onDeleteClick={handleDeleteClick}
        />
      }
    </div>
    {showKanbanBoard && 
      <KanbanCreateModal 
        handleShowKanbanBoard={() => setShowKanbanBoard(false)}
        onKanbanBoardAdded = {(boardName) => onKanbanBoardAdded(boardName)}
      />
    }
    </div>
  );
}
