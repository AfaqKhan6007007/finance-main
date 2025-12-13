// components/pages/journal-entries/KanbanView.tsx
'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { IJournalEntry } from '@/types/journalEntry'
import { IKanbanView } from '@/types/kanbanView'
import { Plus, Columns, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface KanbanViewProps {
  journalEntries: IJournalEntry[]
  kanbanViews: IKanbanView[]
  loading?: boolean
  onAddEntry: (column?: string, columnsBasedon?: string) => void
  onAddKanbanBoard: () => void
  onEditEntry: (id: string) => void
}

export default function KanbanView({ 
  journalEntries, 
  kanbanViews, 
  loading = false,
  onAddEntry,
  onAddKanbanBoard,
  onEditEntry 
}: KanbanViewProps) {
  const searchParams = useSearchParams()
  const kanbanBoardName = searchParams.get('kanbanBoard')
  const [currentKanbanView, setCurrentKanbanView] = useState<IKanbanView | null>(null)
  const [groupedEntries, setGroupedEntries] = useState<Record<string, IJournalEntry[]>>({})

  useEffect(() => {
    if (kanbanBoardName && kanbanViews.length > 0) {
      const view = kanbanViews.find(v => v.name === kanbanBoardName)
      setCurrentKanbanView(view || null)
    } else {
      setCurrentKanbanView(null)
    }
  }, [kanbanBoardName, kanbanViews])

  useEffect(() => {
    if (!currentKanbanView || !journalEntries.length) {
      setGroupedEntries({})
      return
    }

    const grouped: Record<string, IJournalEntry[]> = {}
    currentKanbanView.columns.forEach(column => {
      grouped[column] = []
    })
    
    journalEntries.forEach(entry => {
      const columnValue = getEntryColumnValue(entry, currentKanbanView.columnsBasedon)
      if (columnValue && grouped[columnValue]) {
        grouped[columnValue].push(entry)
      }
    })

    setGroupedEntries(grouped)
  }, [journalEntries, currentKanbanView])

  const getEntryColumnValue = (entry: IJournalEntry, columnBasedOn: string): string => {
    const value = entry[columnBasedOn as keyof IJournalEntry]
    return value?.toString() || 'Unknown'
  }

  if (!kanbanBoardName) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <Columns className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No Kanban Board Selected
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please select a Kanban board from the dropdown above to view your journal entries in a Kanban layout.
        </p>
        <Button className='bg-primary-dull hover:bg-primary-medium/80 cursor-pointer' onClick={() => onAddKanbanBoard()}>
          <Plus className="w-4 h-4 mr-2 " />
          Create Kanban Board
        </Button>
      </div>
    )
  }

  if (kanbanBoardName && !currentKanbanView && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Kanban Board Not Found
        </h3>
        <p className="text-muted-foreground mb-6">
          {`The selected Kanban board ${kanbanBoardName} does not exist.`}
        </p>
        <Button className="bg-primary-dull" onClick={() => onAddKanbanBoard()}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Board
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dull"></div>
      </div>
    )
  }

  if (!currentKanbanView?.columns?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <AlertCircle className="w-16 h-16 text-warning mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Columns Defined
        </h3>
        <p className="text-muted-foreground mb-6">
          {`The Kanban board ${currentKanbanView?.name} has no columns defined.`}
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 h-full overflow-x-auto no-scrollbar">
      {Object.entries(groupedEntries).map(([columnName, columnEntries]) => (
        <KanbanColumn
          key={columnName}
          columnName={columnName}
          entries={columnEntries}
          onAddEntry={() => onAddEntry(
            columnName === 'add-new' ? undefined : columnName,
            currentKanbanView?.columnsBasedon
          )}
          onEditEntry={onEditEntry}
        />
      ))}
    </div>
  )
}

interface KanbanColumnProps {
  columnName: string
  entries: IJournalEntry[]
  isAddNewColumn?: boolean
  onAddEntry: () => void
  onEditEntry: (id: string) => void
}

function KanbanColumn({ 
  columnName, 
  entries, 
  isAddNewColumn = false, 
  onAddEntry, 
  onEditEntry 
}: KanbanColumnProps) {
  return (
    <div 
      className="flex flex-col h-full bg-gray-100 rounded-2xl border shadow no-scrollbar"
      style={{
        minWidth: '280px',
        maxWidth: '400px',
        width: '100%',
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary-dull text-sm capitalize">
            {columnName}
          </h3>
          <span className="text-xs bg-primary-dull/70 text-white rounded-full px-2 py-1 min-w-6 text-center">
            {entries.length}
          </span>
        </div>
      </div>

      <div className="p-2 ">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-gray-800 cursor-pointer"
          onClick={onAddEntry}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      <div className="flex-1 p-2 overflow-y-auto no-scrollbar">
        <div className="space-y-2 no-scrollbar">
          {entries.map((entry) => (
            <KanbanCard
              key={entry.id}
              entry={entry}
              onClick={() => onEditEntry(entry.id!)}
            />
          ))}
          
          {entries.length === 0 && !isAddNewColumn && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No entries in this column
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface KanbanCardProps {
  entry: IJournalEntry
  onClick: () => void
}

function KanbanCard({ entry, onClick }: KanbanCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-1">
          <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
            {entry.id}
          </h4>
          <p className="text-xs text-muted-foreground">
            {entry.amount}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.date).toLocaleDateString()}
          </p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs font-medium text-green-600">
              Dr: {formatCurrency(entry.debit)}
            </span>
            <span className="text-xs font-medium text-blue-600">
              Cr: {formatCurrency(entry.credit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}