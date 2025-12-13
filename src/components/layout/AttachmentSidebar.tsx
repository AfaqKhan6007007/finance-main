import { UserRoundPlus, Plus, Paperclip, Tag, Heart, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react";
import axios from "axios";
import { useMongoUser } from "@/context/UserContext";
import formatTimeAgo from "@/lib/formatTimeAgo";
import { IUser } from "@/types/user";
import { IAccount } from "@/types/account";
import { IJournalEntry } from "@/types/journalEntry";
import { IInvoice } from "@/types/inovice";
import { ICompany } from "@/types/company";

interface AttachmentSidebarProps{
    id: string | undefined; //used separtely because can send account._id in request
    users: IUser[],
    account?: IAccount,
    journal?: IJournalEntry | undefined,
    invoice?: IInvoice | undefined,
    company?: ICompany | undefined
}

export default function AttachmentSidebar({id, users,account, journal, invoice, company }: AttachmentSidebarProps){

    const [loading, setLoading] = useState(false);
    const {mongoUser} = useMongoUser();
    const [liked, setLiked] = useState<boolean | undefined>(undefined);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);

   useEffect(() => {
    const fetchLikeStatus = async () => {
        if (!mongoUser?._id || !id) return; // guard

        setLoading(true);
        try {
        const response = await axios.get("/api/user/likes", {
            params: {
            id,
            userId: mongoUser._id,
            },
        });

        if (response.data.success) {
            setLiked(response.data.data.hasLiked);
            setLikeCount(response.data.data.likeCount)
        } else {
            console.error("Failed:", response.data.error);
        }
        } catch (error) {
        console.error("Error fetching like status:", error);
        } finally {
        setLoading(false);
        }
    };

    const fetchCommentCount = async () => {
        if (!id) return;

        try {
        const response = await axios.get("/api/user/activity/count", {
            params: {
            id,
            activityType: "comment",
            },
        });
        console.log("the comment count total: ", response)
        if (response.data.success) {
            setCommentCount(response.data.total); // just count how many comment activities returned
        }
        } catch (error) {
        console.error("Error fetching comment count:", error);
        }
    };

    fetchLikeStatus();
    fetchCommentCount();
    }, [mongoUser?._id, id]);


    const handleLikeToggle = async () => {
        if (!mongoUser?._id || !id) return;

        setLoading(true);
        try {
                const response = await axios.post("/api/user/likes", { 
                id, 
                userId: mongoUser._id 
                });
                if (response.data.success) {
                setLiked(response?.data?.action === "liked");
                setLikeCount(response?.data.action === "liked" ? likeCount + 1 : likeCount - 1)
                } else {
                console.error("Failed:", response.data.error);
                }
                } catch (error) {
                    console.error("Error toggling like:", error);
                } finally {
                    setLoading(false);
                }
            };

        const getUserName = (userId: string) => {
            if (userId === "Administrator") return "Administrator";

            const user = users.find(u => u._id === userId);
            if (!user) return "Unknown User";

            // Compare with the currently logged-in user's ID
            if (user._id === mongoUser?._id) return "You";

            return `${user.firstName} ${user.lastName}`.trim();
        };

    return(
        <div className="w-[80%] flex flex-col gap-20 pt-3">
            {/* Attachments */}
            <div className=' flex flex-col gap-5'>
                <div className="flex justify-between ">
                    <div className="flex gap-1 text-gray-800 ">
                    <UserRoundPlus className="w-4 text-gray-600" />
                    <p className="ml-1">Assigned To</p>
                    </div>
                    
                    <Plus className="w-6.5 h-6.5 cursor-pointer text-gray-600 hover:bg-gray-200 hover:text-gray-500 rounded-full p-1" />
                </div>

                <div className="flex justify-between">
                    <div className="flex gap-1 text-gray-800">
                    <Paperclip  className="w-4 text-gray-600" />
                    <p className="ml-1">Attachment</p>
                    </div>
                    
                    <Plus className="w-6.5 h-6.5 cursor-pointer text-gray-600 hover:bg-gray-200 hover:text-gray-500 rounded-full p-1" />
                </div>

                <div className="flex justify-between">
                    <div className="flex gap-1 text-gray-800">
                    <Tag className="w-4 text-gray-600" />
                    <p className="ml-1">Tags</p>
                    </div>
                    
                    <Plus className="w-6.5 h-6.5 cursor-pointer text-gray-600 hover:bg-gray-200 hover:text-gray-500 rounded-full p-1" />
                </div>

                <div className="flex justify-between">
                    <div className="flex gap-1 text-gray-800">
                    <UserRoundPlus className="w-4 text-gray-600" />
                    <p className="ml-1">Share</p>
                    </div>
                    
                    <Plus className="w-6.5 h-6.5 cursor-pointer text-gray-600 hover:bg-gray-200 hover:text-gray-500 rounded-full p-1" />
                </div>
            </div>

            {/* the like, comments, & activity */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-0 border-b-1 border-gray-300 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 items-center">
                            <Heart 
                                className={`w-4 cursor-pointer 
                                ${liked ? "text-red-600 fill-red-600" : "text-gray-600"}
                                ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} 
                                onClick={handleLikeToggle}
                            /> 
                                <span className="text-sm">{likeCount}</span>
                        </div>
                        <span className="flex items-center justify-center">·</span>
                        <div className="flex gap-1 items-center">
                           <MessageCircle className="w-4 text-gray-600" /><span className="text-sm">{commentCount}</span>
                        </div>
                    </div>
                    <p className="uppercase text-gray-800 text-xs font-normal">Follow</p>
                </div>
                
                {/* creation and update status */}
                <div className="flex flex-col gap-3 text-gray-600 text-xs">
                    <p className="flex">
                        {getUserName(account?.editedBy || journal?.editedBy || invoice?.editedBy || company?.editedBy || '')} last edited this • {formatTimeAgo(account?.updatedAt || journal?.updatedAt || invoice?.updatedAt || company?.updatedAt || "")}
                    </p>
                    <p className="flex items-center">
                        {getUserName(account?.createdBy || journal?.createdBy || invoice?.createdBy || company?.createdBy || '') || "unknown"} created this • {formatTimeAgo(account?.createdAt || journal?.createdAt || invoice?.createdAt || company?.createdAt || "")}
                    </p>
                </div>
            </div>
        </div>
    )
}