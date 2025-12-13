// components/pages/invoices/KanbanCreateModal.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { showLoadingToast, showSuccessToast, showErrorToast, dismissToast } from "@/lib/toast";
import axios from "axios";

interface KanbanCreateModalProps {
    handleShowKanbanBoard: () => void;
    onKanbanBoardAdded: (boardName: string) => void;
}

interface FormData {
    name: string;
    columnsBasedon: string;
    columns: string[];
}

export default function KanbanCreateModal({ handleShowKanbanBoard, onKanbanBoardAdded }: KanbanCreateModalProps) {
    const invoiceStatuses = ["Paid", "Pending", "Overdue", "Draft"];
    // const qrCodeStatuses = ["Present", "Not Present", "Valid", "Invalid"];

    const columnsMap = {
        status: invoiceStatuses,
        qrCodePresent: ["true", "false"],
        qrCodeValid: ["true", "false"],
        supplierName: [], // This would be populated dynamically
        customerName: [] // This would be populated dynamically
    }

    const [formData, setFormData] = useState<FormData>({
        name: "",
        columnsBasedon: "",
        columns: [],
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        formData.columns = columnsMap[formData.columnsBasedon as keyof typeof columnsMap] || [];
        
        if (!formData.name.trim()) {
            showErrorToast("Board name is required");
            return;
        }

        if (!formData.columnsBasedon) {
            showErrorToast("Please select columns basis");
            return;
        }
        if (!formData.columns.length){
            showErrorToast("No columns available for the selected basis");
            return;
        }

        setLoading(true);
        const loadingToast = showLoadingToast("Creating kanban board...");

        try {
            const response = await axios.post('/api/user/kanbanView', {
                ...formData,
                type: 'invoices'
            });
            if (response.data.success){
                showSuccessToast("Kanban board created successfully!");
                handleShowKanbanBoard();
                onKanbanBoardAdded(formData.name);            
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
            showErrorToast(error.response?.data.error);
          } else if (error instanceof Error) {
            showErrorToast(error.message);
          } else {
            showErrorToast("Failed to create kanban board");
          }
        } finally {
            dismissToast(loadingToast);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30">
            <div className="bg-white mt-[10%] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-primary-dull">Create New Kanban Board</h2>
                    <button
                        onClick={handleShowKanbanBoard}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="board-name" className="text-sm font-medium">
                            Board Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="board-name"
                            type="text"
                            placeholder="Enter board name"
                            className="w-full h-10 px-4 text-base"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="columns-based-on" className="text-sm font-medium">
                            Columns Based On <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                            onValueChange={(value) => handleInputChange("columnsBasedon", value)}
                            value={formData.columnsBasedon}
                            disabled={loading}
                        >
                            <SelectTrigger id="columns-based-on" className="w-full h-12 px-4 text-base">
                                <SelectValue placeholder="Select column type" />
                            </SelectTrigger>
                            <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                                <SelectItem value="status" className="h-12 px-4 text-base flex items-center">
                                    Status
                                </SelectItem>
                                <SelectItem value="qrCodePresent" className="h-12 px-4 text-base flex items-center">
                                    QR Code Present
                                </SelectItem>
                                <SelectItem value="qrCodeValid" className="h-12 px-4 text-base flex items-center">
                                    QR Code Valid
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
                    <button
                        onClick={handleShowKanbanBoard}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name.trim() || !formData.columnsBasedon}
                        className="px-6 py-2 bg-primary-medium text-white rounded-lg hover:bg-primary-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Create Board"}
                    </button>
                </div>
            </div>
        </div>
    )
}