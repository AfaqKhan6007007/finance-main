import mongoose,{Schema} from "mongoose";
import {z} from "zod";
import { IKanbanView } from "@/types/kanbanView";

export const kanbanViewSchemaZod = z.object({
    name: z.string().min(1,"Name is required"),
    columnsBasedon: z.string().min(1, "Please provide column basis of kanban"),
    columns: z.array(z.string()).default([]),
})


const kanbanViewSchema: Schema = new Schema({
    name: {type: String, required: true},
    columnsBasedon: {type: String, required: true},
    columns: {type: Array, default: []}
    },
    {timestamps: true}
)

export const KanbanView = mongoose.models.kanbanView || mongoose.model<IKanbanView>("kanbanView", kanbanViewSchema)