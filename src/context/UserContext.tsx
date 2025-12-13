"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { IUser } from "@/types/user";

// Define a proper type for your MongoDB user
// Context type
interface UserContextType {
  mongoUser: IUser | null;
  loading: boolean;
}

// Create context
const UserContext = createContext<UserContextType>({
  mongoUser: null,
  loading: true,
});

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser } = useUser();
  const [mongoUser, setMongoUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMongoUser = async () => {
      if (!clerkUser) {
        setMongoUser(null);
        setLoading(false);
        return;
      }

      try {
        // Example: match by email (or Clerk ID if stored in your DB)
        const email = clerkUser.emailAddresses[0].emailAddress;
        console.log("the email of clerk user in the context:", email)
        const res = await axios.get(`/api/user/fetchDbUsers?email=${email}`);
        console.log("response in context: ",res)
        setMongoUser(res.data.data);
      } catch (error) {
        console.error("Failed to fetch MongoDB user:", error);
        setMongoUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMongoUser();
  }, [clerkUser]);

  return (
    <UserContext.Provider value={{ mongoUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for easy access
export const useMongoUser = () => useContext(UserContext);
