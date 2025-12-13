// app/journal-entries/page.tsx
'use client'
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ListView from "@/components/pages/journal-entries/ListView";
import { useState, useEffect } from "react";
import { IJournalEntry } from "@/types/journalEntry";
import axios from "axios"
import { showErrorToast } from "@/lib/toast";
import { IKanbanView } from "@/types/kanbanView";
import KanbanCreateModal from "@/components/pages/journal-entries/KanbanCreateModal";
import KanbanView from "@/components/pages/journal-entries/KanbanView";
import ReportView from "@/components/pages/journal-entries/ReportView";
import {journalEntries} from "@/data/journalEntries"
import JournalEntryForm from "@/components/pages/journal-entries/AddJournlEntry";
import { IAccount } from "@/types/account";


export default function JournalEntriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get("mode") || "list";
  const entryId = searchParams.get("id");
  const [journalEntries, setJournalEntries] = useState<IJournalEntry[]>([]);

  const kanbanBoardName = searchParams.get("kanbanBoard")
  const [kanbanViews, setKanbanViews] = useState<IKanbanView[]>([]);
  const [selectedKanbanBoard, setSelectedKanbanBoard] = useState<string>(kanbanBoardName || '');
  const [showKanbanBoard, setShowKanbanBoard] = useState(false);

  const [accounts, setAccounts] = useState<IAccount[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false)

  const filteredEntries = journalEntries.filter(entry => {
    const term = searchTerm.toLowerCase();
    return (
      entry.id?.toLowerCase().includes(term) ||
      entry.account?.toLowerCase().includes(term) ||
      entry.debit?.toLocaleString().includes(term) ||
      entry.credit?.toLocaleString().includes(term) ||
      entry.description?.toLowerCase().includes(term)
    );
  });

  const fetchJournalEntries = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/user/journal-entry")
      
      let arr: IJournalEntry[] = []
      if (Array.isArray(res.data)) {
        arr = res.data
      } else if (Array.isArray(res.data.journalEntries)) {
        arr = res.data.journalEntries
      } else if (Array.isArray(res.data.data)) {
        arr = res.data.data
      } else if (Array.isArray(res.data.items)) {
        arr = res.data.items
      } else if (Array.isArray(res.data.result)) {
        arr = res.data.result
      } else {
        const firstArray = Object.values(res.data).find(v => Array.isArray(v))
        if (Array.isArray(firstArray)) arr = firstArray as IJournalEntry[]
      }

      setJournalEntries(arr || [])
    } catch (err) {
      console.error("fetchJournalEntries error:", err)
      showErrorToast("Failed to load journal entries")
      setJournalEntries([])
    } finally {
      setLoading(false)
    }
  }

//   const fetchKanbanViews = async () => {
//     try {
//       const res = await axios.get("/api/user/kanbanView/journal-entries");
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
    fetchJournalEntries()
    // fetchKanbanViews()
  }, [])


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


  useEffect(() => {
    fetchAccounts()
  }, [])

  const updateUrlWithBoard = (boardName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", "kanban");
    params.set("kanbanBoard", boardName);
    router.push(`?${params.toString()}`);
  };

//   const handleEntrySaved = () => {
//     fetchJournalEntries()
//   }

  const onKanbanBoardChange = (boardName: string) => {
    if (boardName === 'create-new') {
      setShowKanbanBoard(true)
      return;
    }
    
    setSelectedKanbanBoard(boardName);
    updateUrlWithBoard(boardName);
  };

  const onKanbanBoardAdded = (newBoardName: string) => {
    // fetchKanbanViews().then(() => {
    //   setSelectedKanbanBoard(newBoardName);
    //   updateUrlWithBoard(newBoardName);
    // });
  };

  const handleAddEntry = (columnName?: string, columnsBasedon?: string) => {
    const params: Record<string, string> = {}
    
    if (columnName && columnsBasedon) {
      params[columnsBasedon] = columnName
    }
    
    setMode("add-entry", params)
  }

  const handleJournalEntrySaved = () => {
    fetchJournalEntries() // Refetch entries after save
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
      <div className="w-full h-full flex flex-col gap-8">
        
        {!mode.startsWith("add-")
          && !entryId 
          && (<PageHeader 
                title="Journal Entries"  
                setMode={setMode} 
                kanbanViews={kanbanViews}
                selectedKanbanBoard={selectedKanbanBoard}
                onKanbanBoardChange={onKanbanBoardChange}
                onSearch={setSearchTerm}
              />
            )
        }

        {/* Page body reacts to mode */}
        {mode === "kanban" && 
          <KanbanView
            journalEntries={filteredEntries}
            kanbanViews={kanbanViews}
            loading={loading}
            onAddKanbanBoard={() => setShowKanbanBoard(true)}
            onAddEntry={(columnName, columnsBasedon) => handleAddEntry(columnName, columnsBasedon)}
            onEditEntry={(id) => setMode("edit", { id })}
          />
        }

        {mode === "list" && 
          <ListView
            journalEntries={filteredEntries}
            loading={loading}
            onRowClick={(id: string) => setMode("edit", { id })}
            accounts={accounts}
          />
        }

        {mode === "report" &&
          <ReportView
            journalEntries={filteredEntries}
            loading={loading}
            onRowClick={(id: string) => setMode("edit", { id })} 
          />
        }

        {
          (mode.startsWith("add-") || mode === "edit") 
          && 
          <JournalEntryForm
            mode={mode} 
            journalEntry = {journalEntries.find(entry => entry.id === entryId) || undefined} 
            accounts={accounts}
            onJournalEntrySaved={handleJournalEntrySaved}
          />
        }
      </div>
      {showKanbanBoard && 
        <KanbanCreateModal 
          handleShowKanbanBoard={() => setShowKanbanBoard(false)}
          onKanbanBoardAdded={(boardName) => onKanbanBoardAdded(boardName)}
        />
      }
    </div>
  );
}