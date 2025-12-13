// /user/layout.tsx
'use client'

import '../../globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { Suspense, useState } from 'react'
import { useScreenSize } from '@/context/ScreenSizeContext'
import Chatbot from '@/components/layout/Chatbot'



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [toggleSideBar, setToggleSideBar] = useState(false);
  const [iconBar, setIconBar] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const {isLg} = useScreenSize();
  return (

          <div className="relative flex h-screen no-scrollbar">
            <Sidebar toggleSideBar={toggleSideBar} setToggleSideBar={setToggleSideBar} iconBar={iconBar} isHovered={isHovered} setIsHovered={setIsHovered}/>
            <div className="flex-1 flex flex-col overflow-hidden ">
              <Topbar setToggleSideBar={setToggleSideBar} setIconBar={setIconBar} iconBar={iconBar} isHovered={isHovered}/>
              <main className={`flex-1 h-full bg-gray-50 overflow-y-auto p-6 mt-14 ${!isLg ? 'ml-0' : (iconBar ? 'ml-20' : 'ml-64')} no-scrollbar`}>
                {/* when using useSearchParams wrap the component in suspence -*/}
                <Suspense>
                  {children}
                </Suspense>
              </main>
            </div>

            <Chatbot/>
          </div>
  )
}