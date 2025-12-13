import { ReactNode } from "react";
import { Toaster as SonnetToaster } from "sonner";
import { Toaster as HotToaster } from 'react-hot-toast'
import { ScreenSizeProvider } from '@/context/ScreenSizeContext'
import { UserProvider } from "@/context/UserContext";


export default function Providers({children}: {children: ReactNode }){

    return(
        <>
            <ScreenSizeProvider>
                <UserProvider>
                    <SonnetToaster expand={true} richColors position="top-center"/>
                    <HotToaster position="top-center" />     
                    {children}
                </UserProvider>
            </ScreenSizeProvider>
        </>
    )

}