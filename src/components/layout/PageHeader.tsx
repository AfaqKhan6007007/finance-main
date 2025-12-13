'use client'
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  List, 
  FileDown, 
  ChevronDown, 
  PlusCircle,
  Table,
  BarChart3,
  Kanban,
  GitBranch,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IKanbanView } from '@/types/kanbanView';

interface PageHeaderProps{
    title: string;
    setMode: (value: string) => void;
    kanbanViews?: IKanbanView[];
    selectedKanbanBoard?: string;
    onKanbanBoardChange?: (boardName: string) => void;
    onSearch?: (value: string) => void;
}

export default function PageHeader({ title, setMode, kanbanViews, selectedKanbanBoard, onKanbanBoardChange, onSearch}: PageHeaderProps){

    const searchParams = useSearchParams();
    const router = useRouter();

    const viewMode = searchParams.get("mode") || "grid";
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!searchParams.get("mode")) {
        router.replace("?mode=list"); // replace so no back button issue
        }
    }, [searchParams, router]);


    return(
        <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className='flex flex-col gap-2'>
                <h1 className="text-3xl font-bold text-primary-dull/90">
                    {title[0].toUpperCase() + title.slice(1)}
                </h1>
                <h6 className='text-lg text-gray-400 font-medium'>
                    {
                        `Complete list of all ${title.toLowerCase()} in system`
                    }
                </h6>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">            
                <div className='flex gap-4 items-center'>
                    {/* kanban views */}
                    {viewMode === "kanban" && (
                      <Select
                        onValueChange={onKanbanBoardChange} // This should change the board, not the view mode
                        value={selectedKanbanBoard} // This should be the selected board ID
                      >
                        <SelectTrigger className="w-48 bg-white h-10 border-gray-200">
                          <SelectValue placeholder="Select kanban board" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {kanbanViews?.map((view: IKanbanView) => (
                            <SelectItem 
                              key={view.name} // Don't forget the key!
                              value={view.name} // Use the board name as value because have to show this is the prams and it will be unique
                              className="flex items-center gap-2"
                            >
                              {view.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="create-new">
                            + Create New Board
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* View Select Dropdown */}
                    <Select
                        onValueChange={val => setMode(val)}
                        value={viewMode}
                    >
                        <SelectTrigger className="w-40 bg-white h-20 border-gray-200">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="list" className="flex items-center gap-2">
                                <List className="w-4 h-4" />
                                List View
                            </SelectItem>
                            <SelectItem value="report" className="flex items-center gap-2">
                                <Table className="w-4 h-4" />
                                Report View
                            </SelectItem>
                            <SelectItem value="dashboard" className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Dashboard View
                            </SelectItem>
                            <SelectItem 
                              value="kanban" 
                              className="flex items-center gap-2"
                            >
                                <Kanban className="w-4 h-4" />
                                Kanban View
                            </SelectItem>
                            <SelectItem value="tree" className="flex items-center gap-2">
                                <GitBranch className="w-4 h-4" />
                                Tree View
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    
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
    
                {/* Add Button */}
                <button 
                    onClick={() => setMode(`add-${title.toLowerCase()}`)}
                    className='h-10 flex gap-2 items-center justify-center px-4 text-sm bg-primary-medium cursor-pointer rounded text-white font-medium shadow-md hover:bg-primary-bright transition-colors border border-primary-medium'
                >
                    <PlusCircle className="w-4 h-4" />
                    Add {title[0].toUpperCase() + title.slice(1)}
                </button>
            </div>
        </div>
        <div className="bg-white mt-8 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                type="text"
                placeholder="Search by account name, ID, or number..."
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value)
                    onSearch?.(e.target.value)
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
            </div>
        </div>
        </div>
    )
}