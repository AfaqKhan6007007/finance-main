// components/pages/account/KanbanView.tsx
'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { IAccount } from '@/types/account'
import { IKanbanView } from '@/types/kanbanView'
import { Plus, Columns, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface KanbanViewProps {
  accounts: IAccount[]
  kanbanViews: IKanbanView[]
  loading?: boolean
  onAddAccount: (column?: string, columnsBasedon?: string) => void
  onAddKanbanBoard: () => void
  onEditAccount: (id: string) => void
}

export default function KanbanView({ 
  accounts, 
  kanbanViews, 
  loading = false,
  onAddAccount,
  onAddKanbanBoard,
  onEditAccount 
}: KanbanViewProps) {
  const searchParams = useSearchParams()
  const kanbanBoardName = searchParams.get('kanbanBoard')
  const [currentKanbanView, setCurrentKanbanView] = useState<IKanbanView | null>(null)
  const [groupedAccounts, setGroupedAccounts] = useState<Record<string, IAccount[]>>({})

  // Find the current kanban view based on URL parameter
  useEffect(() => {
    if (kanbanBoardName && kanbanViews.length > 0) {
      const view = kanbanViews.find(v => v.name === kanbanBoardName)
      setCurrentKanbanView(view || null)
    } else {
      setCurrentKanbanView(null)
    }
  }, [kanbanBoardName, kanbanViews])

  // Group accounts by columns
  useEffect(() => {
    if (!currentKanbanView || !accounts.length) {
      setGroupedAccounts({})
      return
    }

    const grouped: Record<string, IAccount[]> = {}
    // Initialize all columns with empty arrays
    currentKanbanView.columns.forEach(column => {
      grouped[column] = []
    })
    
    // uncomment below line for add new functionality
    // grouped['add-new'] = []

    // Group accounts based on the column basis
    accounts.forEach(account => {
      const columnValue = getAccountColumnValue(account, currentKanbanView.columnsBasedon)
      console.log("the column name: ", columnValue)
      if (columnValue && grouped[columnValue]) {
        grouped[columnValue].push(account)
      }
    })
    console.log("groupe accournass: ", grouped);
    setGroupedAccounts(grouped)
  }, [accounts, currentKanbanView])

  // Helper function to get account value for the column basis
  const getAccountColumnValue = (account: IAccount, columnBasedOn: string): string => {
    const value = account[columnBasedOn as keyof IAccount]
    return value?.toString() || 'Unknown'
  }

  // If no kanban board is selected
  if (!kanbanBoardName) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <Columns className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No Kanban Board Selected
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please select a Kanban board from the dropdown above to view your accounts in a Kanban layout.
        </p>
        <Button className='bg-primary-dull hover:bg-primary-medium/80 cursor-pointer' onClick={() => onAddKanbanBoard()}>
          <Plus className="w-4 h-4 mr-2 " />
          Create Kanban Board
        </Button>
      </div>
    )
  }

  // If kanban board is selected but not found
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dull"></div>
      </div>
    )
  }

  // If no columns defined
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
      {Object.entries(groupedAccounts).map(([columnName, columnAccounts]) => (
        <KanbanColumn
          key={columnName}
          columnName={columnName}
          accounts={columnAccounts}
          // uncomment below line for add new functionality
          // isAddNewColumn={columnName === 'add-new'}   
          onAddAccount={() => onAddAccount(
            columnName === 'add-new' ? undefined : columnName,
            currentKanbanView?.columnsBasedon // Pass the column basis
          )}
          onEditAccount={onEditAccount}
        />
      ))}
    </div>
  )
}

// Individual Kanban Column Component
interface KanbanColumnProps {
  columnName: string
  accounts: IAccount[]
  isAddNewColumn?: boolean
  onAddAccount: () => void
  onEditAccount: (id: string) => void
}

function KanbanColumn({ 
  columnName, 
  accounts, 
  isAddNewColumn = false, 
  onAddAccount, 
  onEditAccount 
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
      {/* Column Header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary-dull text-sm capitalize">
            {/* uncomment below line for add new functionality
            {isAddNewColumn ? 'Add New' : columnName} */}
            {columnName}
          </h3>
          <span className="text-xs bg-primary-dull/70 text-white rounded-full px-2 py-1 min-w-6 text-center">
            {/* uncomment below line for add new functionality
            {isAddNewColumn ? '+' : accounts.length} */}
            {accounts.length}
          </span>
        </div>
      </div>

      {/* Add Account Button - Always at top */}
      <div className="p-2 ">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-gray-800 cursor-pointer"
          onClick={onAddAccount}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Accounts List */}
      <div className="flex-1 p-2 overflow-y-auto no-scrollbar">
        <div className="space-y-2 no-scrollbar">
          {accounts.map((account) => (
            <KanbanCard
              key={account.id}
              account={account}
              onClick={() => onEditAccount(account.id!)}
            />
          ))}
          
          {accounts.length === 0 && !isAddNewColumn && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No accounts in this column
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Individual Account Card Component
interface KanbanCardProps {
  account: IAccount
  onClick: () => void
}

function KanbanCard({ account, onClick }: KanbanCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-1">
          <h4 className="font-medium  text-gray-800 text-sm line-clamp-1">
            {account.accountName}
          </h4>
          {account.accountType && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {account.accountType}
            </p>
          )}
          {/* Add more account fields as needed */}
          {account.accountNumber && (
            <p className="text-xs text-muted-foreground">
              #{account.accountNumber}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}