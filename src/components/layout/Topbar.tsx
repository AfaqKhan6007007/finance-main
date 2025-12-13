// components/Topbar.tsx
"use client"
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Logo from "@/app/assests/auth/OfficeFlow.png"
import { useScreenSize } from '@/context/ScreenSizeContext'

import { Search, MessageSquare, Mail, Bell } from 'lucide-react'
import { ArrowLeftToLine, ArrowRightFromLine } from "lucide-react";

interface TopbarProps{
    setToggleSideBar: React.Dispatch<React.SetStateAction<boolean>>
    setIconBar: React.Dispatch<React.SetStateAction<boolean>>
    iconBar:boolean
    isHovered: boolean
}
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function Topbar({setToggleSideBar, setIconBar, iconBar, isHovered}: TopbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isActionButton, setIsActionButton] = useState(false);
  const actionButtonRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null!);
  const {isLg} = useScreenSize();
//   const {user} = useUser();

// console.log("User data:", user);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

    // hide the action button dropdown when clicking outside anywhere
    useEffect(()=>{
        const handleClickOutside = (event: MouseEvent) =>{
            if (
                 actionButtonRef.current &&
                 !actionButtonRef.current.contains(event.target as Node) &&
                 !buttonRef.current.contains(event.target as Node)
            ){
                setIsActionButton(false);
            }
        };

        if(isActionButton){
            document.addEventListener('mousedown',handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    },[isActionButton])

    // for the large screen ref management
    useEffect(()=>{
        const handleClickOutside = (event: MouseEvent) =>{
            if (
                 actionButtonRef.current &&
                 !actionButtonRef.current.contains(event.target as Node) &&
                 !buttonRef.current.contains(event.target as Node)
            ){
                setIsMenuOpen(false);
            }
        };

        if(isMenuOpen){
            document.addEventListener('mousedown',handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    },[isMenuOpen])


  return (
    <header className={`fixed top-0 right-0 left-0 ${isLg ? (iconBar ? (isHovered ? 'lg:left-64' :'lg:left-20') :'lg:left-64') : null} h-16 z-20 bg-white border-b border-gray-200 transition-all duration-300 ${isScrolled? ' shadow-sm':''}`}>
      {!isLg
      ?
      <div className="lg:hidden h-full flex items-center justify-between px-2">
        {/* Left side - Hamburger menu (mobile) and search */}
        <div 
            className='flex flex-col gap-2 cursor-pointer'
            onClick={()=> setToggleSideBar(prev => !prev)}
        >
            <div className='w-10 h-1 rounded-xs bg-primary-medium'></div>
            <div className='w-5 h-1 rounded-xs bg-primary-medium'></div>
            <div className='w-10 h-1 rounded-xs bg-primary-medium'></div>
        </div>
          

        {/* Center - Logo (mobile only) */}
        <div className="flex items-center">
          <Link href={'/user/analytics'}>
            <Image
              src={Logo}
              alt="SalesCRM Logo"
              width={60}
              height={60}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        <div className='relative'
        >
            <UserButton userProfileUrl='/user/profile'/>
        </div>

        
      </div>
      :
    //   how navbar will be shown on large screens
      <div className='flex items-center justify-between h-full px-4'>

        {/* Left Side - Toggle and Search Icon */}
        <div className='flex gap-2'>
            <div 
                className='bg-gray-200 rounded-lg flex items-center justify-center h-10 w-10 cursor-pointer'
                onClick={()=> setIconBar(prev => !prev)}
            >
                {!iconBar ? 
                    <ArrowLeftToLine 
                        size={20}
                    />
                     : 
                     <ArrowRightFromLine 
                        size={20}
                     /> 
                }
            </div>
            <div className='border border-gray-200 flex items-center justify-center h-10  px-4 gap-2 rounded-md'>
                <Search size={20} className='text-gray-400'/>
                <input 
                    type=""
                    placeholder='Search'
                    className='focus:outline-none'
                />
            </div>
        </div>

        {/* Right side - Icons and user dropdown */}
        <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                <MessageSquare size={20} />
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                <Mail size={20} />
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                <Bell size={20} />
              </button>
              
              <UserButton userProfileUrl='/user/profile'/>

        </div>
      </div>
    }
    </header>
  )
}