"use client";

import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import { useMongoUser } from "@/context/UserContext";
import { dismissToast, showErrorToast, showLoadingToast } from "@/lib/toast";
import { IActivity } from "@/types/activity";
import { IUser } from "@/types/user";

interface CommentAndActivityProps {
  id: string | undefined;
  users: IUser[];
  activityId: string;
}

export default function CommentAndActivity({ id, users, activityId = '' }: CommentAndActivityProps) {
  const { user } = useUser();
  const { mongoUser } = useMongoUser();
  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [comment, setComment] = useState(""); // Separate state for comment input

  // Fetch activities and users when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoadingActivities(true);
        // Fetch activities for this account
        const activitiesResponse = await axios.get(`/api/user/activity?${activityId}=${id}`);
        if (activitiesResponse.data.success) {
          setActivities(activitiesResponse.data.data);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        showErrorToast("Failed to load activities");
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchData();
  }, [id]);

  const getInitials = (fullName: string | null) => {
    if (!fullName) return "";
    const names = fullName.split(" ");
    const first = names[0]?.charAt(0) || "";
    const last = names[1]?.charAt(0) || "";
    return (first + last).toLowerCase();
  };

  const getUserName = (userId: string) => {
    console.log("the user id for the activity: ", userId)
      if (userId === "Administrator") return "Administrator";

      const user = users.find(u => u._id === userId);
      if (!user) return "Unknown User";

      // Compare with the currently logged-in user's ID
      if (user._id === mongoUser?._id) return "You";

      return `${user.firstName} ${user.lastName}`.trim();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async () => {
    // Use the current values directly instead of relying on formData state
    const currentId = id;
    const currentUserId = mongoUser?._id;

    if (!currentUserId) {
      showErrorToast("User Id not present for comment");
      return;
    }
    if (!currentId) {
      showErrorToast("Fetching related account Id failed");
      return;
    }

    const loadingToastId = showLoadingToast("Submitting comment");
    setIsLoading(true);
    
    try {  
      // Create the form data with current values
      const submitData = {
        accountId: activityId === 'accountId' ? currentId : null,
        journalId: activityId === 'journalId' ? currentId : null, 
        invoiceId: activityId === 'invoiceId' ? currentId : null, 
        userId: currentUserId,
        activityType: "comment" as const,
        metadata: {
          comment: comment
        }
      };


      // Call your API with submitData
      await axios.post(`/api/user/activity`, submitData);
      
      // Clear comment field after submit
      setComment("");
      
      // Refresh activities to show the new comment
      const activitiesResponse = await axios.get(`/api/user/activity?activityId=${currentId}`);
      if (activitiesResponse.data.success) {
        setActivities(activitiesResponse.data.data);
      }

    } catch (error) {
      console.error("Error submitting comment:", error);
      showErrorToast("Failed to submit comment");
    } finally {
      dismissToast(loadingToastId);
      setIsLoading(false);
    }
  };

  const renderActivityContent = (activity: IActivity) => {
    const userName = getUserName(activity.userId);
    
    switch (activity.activityType) {
      case "comment":
        return (
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
              {getInitials(userName)}
            </div>
            <div>
              <p className="text-sm font-medium">{userName} commented</p>
              <p className="text-sm text-gray-600 mt-1">{activity.metadata.comment}</p>
            </div>
          </div>
        );

      case "like":
        return (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs text-white">
              {getInitials(userName)}
            </div>
            <p className="text-sm font-medium">{userName} liked this account</p>
          </div>
        );

      case "create":
        return (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
              {getInitials(userName)}
            </div>
            <p className="text-sm font-medium">{userName} created this account</p>
          </div>
        );

      case "update":
        return (
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white">
              {getInitials(userName)}
            </div>
            <div>
              <p className="text-sm font-medium">{userName} updated account details</p>
              {activity.activityType === "update" && activity.metadata.updatedFields && (
                <div className="text-sm text-gray-600 mt-1">
                 {Object.entries(activity.metadata.updatedFields ?? {}).map(([field, changes]) => {
                    const c = changes as { old: string; new: string }
                    return (
                      <p key={field}>
                        {field}: {c.old} → {c.new}
                      </p>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Comment */}
      <div className="space-y-3">
        <h2 className="font-medium text-lg text-primary-dull">Comments</h2>
        <div className="flex gap-3 items-start">
          {user && (
            <div className="w-8 h-8 rounded-full bg-primary-dull/70 flex items-center justify-center text-sm text-white">
              {getInitials(user.fullName)}
            </div>
          )}
        
          <div className="flex flex-col gap-3 w-full">
            <Input
              id="comment"
              placeholder="Enter your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {comment.trim() && (
              <Button
                className={`bg-primary-dull hover:bg-primary-medium cursor-pointer text-white w-fit`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                Comment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="space-y-3">
        <h2 className="font-medium text-lg text-primary-dull">Activity</h2>
        
        {loadingActivities ? (
          <div className="text-center py-4">
            <p>Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>No activities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="border-l-2 border-primary-dull pl-4 py-2"
              >
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  {renderActivityContent(activity)}
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}