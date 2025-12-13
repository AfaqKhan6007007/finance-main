export interface IKanbanView{
    _id: string;
    name: string;
    columns: Array<string>;
    columnsBasedon: string;
    createdAt: Date;
    updatedAt: Date;

}