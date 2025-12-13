'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { IInvoice } from '@/types/inovice'
import { IKanbanView } from '@/types/kanbanView'
import { Plus, Columns, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface KanbanViewProps {
  invoices: IInvoice[]
  kanbanViews: IKanbanView[]
  loading?: boolean
  onAddInvoice: (column?: string, columnsBasedon?: string) => void
  onAddKanbanBoard: () => void
  onEditInvoice: (id: string) => void
}

export default function KanbanView({ 
  invoices, 
  kanbanViews, 
  loading = false,
  onAddInvoice,
  onAddKanbanBoard,
  onEditInvoice 
}: KanbanViewProps) {
  const searchParams = useSearchParams()
  const kanbanBoardName = searchParams.get('kanbanBoard')
  const [currentKanbanView, setCurrentKanbanView] = useState<IKanbanView | null>(null)
  const [groupedInvoices, setGroupedInvoices] = useState<Record<string, IInvoice[]>>({})

  useEffect(() => {
    if (kanbanBoardName && kanbanViews.length > 0) {
      const view = kanbanViews.find(v => v.name === kanbanBoardName)
      setCurrentKanbanView(view || null)
    } else {
      setCurrentKanbanView(null)
    }
  }, [kanbanBoardName, kanbanViews])

  useEffect(() => {
    if (!currentKanbanView || !invoices.length) {
      setGroupedInvoices({})
      return
    }

    const grouped: Record<string, IInvoice[]> = {}
    currentKanbanView.columns.forEach(column => {
      grouped[column] = []
    })

    invoices.forEach(invoice => {
      const columnValue = getInvoiceColumnValue(invoice, currentKanbanView.columnsBasedon)
      if (columnValue && grouped[columnValue]) {
        grouped[columnValue].push(invoice)
      }
    })

    setGroupedInvoices(grouped)
  }, [invoices, currentKanbanView])

  const getInvoiceColumnValue = (invoice: IInvoice, columnBasedOn: string): string => {
    const value = invoice[columnBasedOn as keyof IInvoice]
    return value?.toString() || 'Unknown'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (!kanbanBoardName) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <Columns className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No Kanban Board Selected
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please select a Kanban board from the dropdown above to view your invoices in a Kanban layout.
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
      {Object.entries(groupedInvoices).map(([columnName, columnInvoices]) => (
        <KanbanColumn
          key={columnName}
          columnName={columnName}
          invoices={columnInvoices}
          onAddInvoice={() => onAddInvoice(
            columnName,
            currentKanbanView?.columnsBasedon
          )}
          onEditInvoice={onEditInvoice}
        />
      ))}
    </div>
  )
}

interface KanbanColumnProps {
  columnName: string
  invoices: IInvoice[]
  onAddInvoice: () => void
  onEditInvoice: (id: string) => void
}

function KanbanColumn({ 
  columnName, 
  invoices, 
  onAddInvoice, 
  onEditInvoice 
}: KanbanColumnProps) {
  return (
    <div 
      className="flex flex-col h-full bg-gray-100 rounded-2xl border shadow no-scrollbar"
      style={{
        minWidth: '300px',
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
            {invoices.length}
          </span>
        </div>
      </div>

      <div className="p-2 ">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-gray-800 cursor-pointer"
          onClick={onAddInvoice}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Invoice
        </Button>
      </div>

      <div className="flex-1 p-2 overflow-y-auto no-scrollbar">
        <div className="space-y-2 no-scrollbar">
          {invoices.map((invoice) => (
            <KanbanCard
              key={invoice.id}
              invoice={invoice}
              onClick={() => onEditInvoice(invoice.id!)}
            />
          ))}
          
          {invoices.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No invoices in this column
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface KanbanCardProps {
  invoice: IInvoice
  onClick: () => void
}

function KanbanCard({ invoice, onClick }: KanbanCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return "bg-green-100 text-green-700"
      case 'Pending':
        return "bg-yellow-100 text-yellow-700"
      case 'Overdue':
        return "bg-red-100 text-red-700"
      case 'Draft':
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
              {invoice.invoiceNumber}
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="line-clamp-1">
              <span className="font-medium">From:</span> {invoice.supplierName}
            </p>
            <p className="line-clamp-1">
              <span className="font-medium">To:</span> {invoice.customerName}
            </p>
            <p className="font-semibold text-gray-800">
              Total: {formatCurrency(invoice.totalAmount)}
            </p>
          </div>
          
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-gray-500">
              {new Date(invoice.date).toLocaleDateString()}
            </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle download
                  console.log("Downloading:", invoice.invoiceNumber)
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}