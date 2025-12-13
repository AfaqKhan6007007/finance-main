"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Logo from "@/app/assests/auth/OfficeFlow.png"
import { useScreenSize } from '@/context/ScreenSizeContext'
import {motion, AnimatePresence} from "framer-motion"
import { LayoutDashboard, BookOpen, FileText, BookMarked, Scale, BarChart3, CreditCard, Receipt, FileScan, Building2 } from 'lucide-react';




interface SidebarProps {
  toggleSideBar?: boolean;
  setToggleSideBar?: (value: boolean) => void;
  iconBar?: boolean;
  isHovered?: boolean;
  setIsHovered?: (value: boolean) => void;
}

export default function Sidebar({toggleSideBar=false, setToggleSideBar, iconBar, isHovered,setIsHovered}:SidebarProps) {
  const {isLg} = useScreenSize();
  const shouldShowSideBar = isLg || (!isLg && toggleSideBar);


  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/user/dashboard' },
    { name: 'Chart of Accounts', icon: <BookOpen size={20} />, path: '/user/account' },
    { name: 'Journal Entries', icon: <FileText size={20} />, path: '/user/journal-entry' },
    { name: 'Trial Balance', icon: <Scale size={20} />, path: '/user/trial-balance' },
    { name: 'Ledger', icon: <BookMarked size={20} />, path: '/user/ledger' },
    { name: 'Accounts Payable', icon: <CreditCard size={20} />, path: '/user/accounts-payable' },
    { name: 'Accounts Receivable', icon: <Receipt size={20} />, path: '/user/accounts-receiveable' },
    { name: 'Financial Report', icon: <BarChart3 size={20} />, path: '/user/financial-report' },
    { name: 'Invoices', icon: <FileText size={20} />, path: '/user/invoices' },
    { name: 'Invoices Scan', icon: <FileScan size={20} />, path: '/user/invoices-scan' },
    { name: 'Companies', icon: <Building2 size={20}/>, path: '/user/companies'}
  ]

  const handleOverlayClick = () => {
    if (setToggleSideBar) {
      setToggleSideBar(false);
    }
  };

  const handleMouseEnter = () => {
    if (setIsHovered) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (setIsHovered) {
      setIsHovered(false);
    }
  };

  const sidebarWidth = isLg && iconBar ? (isHovered ? 'w-64' : 'w-20') : 'w-64';

  return (
    <AnimatePresence>
      {shouldShowSideBar && (
        <>
          {/* Black overlay - only shown on mobile */}
            {!isLg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black z-[9]"
                onClick={handleOverlayClick}
              />
            )}
          <motion.div 
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "tween", duration: 0.2 }}
            className={`flex flex-col h-full bg-white border-r border-gray-200 ${sidebarWidth} fixed left-0 top-0 bottom-0 z-10 transition-all duration-300`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Logo and Company Name */}
            {
              isLg ?
              <Link href='/user/analytics'>
              <div className={`flex items-center ${iconBar ? (isHovered ? 'px-6 py-4': ' px-2 py-4 justify-center') : 'px-6 py-4'}`}>
              <Image
                src={Logo}
                alt="Finance app Logo"
                width={40}
                height={40}
                priority
                className="object-contain transition-all duration-300"
              />
              {(!iconBar || isHovered) && 
                <span className="ml-2 text-xl font-bold">
                  <span className="text-primary-medium">Finance</span>
                </span>
              }
            </div>
            </Link>
            :
            null
            }
            {/* Navigation Items */}
            <div className={`flex-1 overflow-y-auto py-4 ${!isLg ? 'mt-[80px]' : ''}`}>
              <nav className="flex flex-col space-y-1 px-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-secondary/50 rounded-lg transition-colors duration-200"
                  >
                    <span className="mr-3">{item.icon}</span>
                    {(!iconBar || isHovered  || !isLg) && <span>{item.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>
      </>
      )}
    </AnimatePresence>
  )
}