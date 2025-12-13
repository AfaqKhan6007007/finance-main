"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { EyeOff, Eye } from "lucide-react"
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useSignIn } from "@clerk/clerk-react";
import { useClerk } from "@clerk/nextjs";
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import AuthImage from '@/app/assests/auth/auth-pg-img.png'
import Logo from "@/app/assests/auth/OfficeFlow.png"

function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false);
  const { signIn} = useSignIn();
  const { setActive } = useClerk();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToastId= showLoadingToast('Processing Request');
    try{
      const response = await signIn?.create({
        identifier:formData.email,
        password:formData.password,
      })
      if(response?.status === 'complete'){
        await setActive({ session: response.createdSessionId });
         dismissToast(loadingToastId);
         showSuccessToast("Login Successful.");
        router.push('/user/account');
      }
    }catch(error){
    if (isClerkAPIResponseError(error)){ 
        const errorMessage = error.errors?.[0]?.longMessage || "Failed Login";
          dismissToast(loadingToastId);
          showErrorToast(errorMessage);   
      }
    }
      setIsLoading(false);

  }

  return (
    <div className="h-screen w-full flex">

      {/* left banner side */}
      <div className='hidden lg:flex flex-[3] items-center justify-center p-[5%] bg-gradient-to-b from-primary-bright to-primary-dull'>
        <div className='flex flex-col h-[85%] p-10 gap-4 w-full border border-white rounded-md bg-white/10 backdrop-blur-lg'>
          <h1 className='text-white text-4xl font-bold'>
            Empowering Business<br/>
            with complete Financial<br/>
            solutions.
          </h1>
          <div className='flex flex-col items-center justify-center gap-4 flex-1'>
            <div className='relative  w-full h-full max-h-[300px]'>
              <Image 
                src={AuthImage}
                alt="authentication Page image"
                fill 
                priority
                className='object-contain'
              />
            </div>
            <p className='text-white text-xl text-center font-bold p-2'>
              Efficiently manage finances, streamline operations seamlessly.
            </p>
          </div>
        </div>
      </div>

      {/* right login side */}
      <div className='flex flex-1 lg:flex-[5] flex-col items-center justify-between px-12 md:p-4'>
        {/* Logo */}
        <div className='relative flex items-center'>
          <Image
            src={Logo}
            alt="Official logo of the Sales CRM Application"
            id="Logo"
            priority
            className='w-20 h-20 object-contain'
          />
          <label htmlFor="Logo" className='font-bold text-xl'><span className='text-primary-dull'>Finance</span></label>
        </div>

        {/* Login Form */}
        <div className="flex flex-1 flex-col w-full justify-center items-center">
          <div className='flex flex-col gap-3 -mt-20'>
            <h2 className="text-center text-2xl font-bold text-gray-900">
              Sign In
            </h2>
            <p className='text-dark text-center'>Please enter your details to sign in</p>
          </div>

          <div className="mt-10 w-full md:w-[60%]">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-md/6 font-bold text-dark">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder='example@gmail.com'
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm/6 font-bold text-dark">
                    Password
                  </label>
                </div>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder='**********'
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 
                      <Eye className="text-gray-500" size={20} /> : 
                      <EyeOff className="text-gray-500" size={20} />
                    }
                  </button>
                </div>
                <div className="text-sm text-end pr-2 pt-1">
                  <a href="#" className="font-medium hover:underline text-primary-dull hover:text-primary-medium">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full cursor-pointer justify-center rounded-md bg-primary-dull px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-primary-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dull disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm/6 text-dark">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="font-medium text-primary-dull hover:text-primary-medium relative group"
              >
                Create Account
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-medium transition-all group-hover:w-full"></span>
              </Link>
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="mb-4 text-center text-sm">
          Copyright © {new Date().getFullYear()} <span className='text-primary-dull'>Finance.</span> All rights reserved.
        </footer>
      </div>
    </div>
  )
}

export default LoginPage