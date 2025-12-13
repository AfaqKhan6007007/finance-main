"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TermsAndConditions from '@/components/pages/signup/TermsAndConditions'
import {useRouter} from 'next/navigation'

import { User, Mail, EyeOff, Eye } from 'lucide-react'

import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast} from '@/lib/toast'

import AuthImage from '@/app/assests/auth/auth-pg-img.png'
import Logo from "@/app/assests/auth/OfficeFlow.png"

import { useSignUp, useClerk } from '@clerk/nextjs'
import {isClerkAPIResponseError} from '@clerk/nextjs/errors'

// import axios from 'axios'

function SignupPage() {
  const router = useRouter();
  const{ signUp} = useSignUp();
  const {setActive} = useClerk();
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    username:'',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

// handling the custom login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if(!formData.name){
      showErrorToast("Enter first name");
      return;
    }else if(!formData.lastName){
      showErrorToast("Enter last name");
      return;
    }else if(!formData.username){
      showErrorToast("Enter your username");
      return;
    }else if(!formData.email){
      showErrorToast("Enter your email");
      return;
    }else if(!formData.password){
      showErrorToast("Enter your password");
      return;
    }else if(!formData.confirmPassword){
      showErrorToast("Confirm your password");
      return;
    }else if(formData.password !== formData.confirmPassword){
      showErrorToast("Passwords do not match");
      return;
    }else if (!termsAccepted) {
      showErrorToast('Please accept the terms and conditions')
      return
    }
   


    setIsLoading(true)
    const showLoadingToastId = showLoadingToast("Creating your account...")

    

    try {
      const result = await signUp?.create({
        firstName: formData.name,
        lastName:formData.lastName,
        username:formData.username,
        emailAddress: formData.email,
        password: formData.password,
      });
      if (result?.status === 'complete') {
        // Account created and verified immediately (unlikely but possible)
        await setActive({ session: result?.createdSessionId });
        dismissToast(showLoadingToastId);
        showSuccessToast('Account created successfully!');
        router.push('/user/dashboard');
      } else {
        // Email verification required
        await signUp?.prepareEmailAddressVerification();
        setPendingVerification(true);
        dismissToast(showLoadingToastId);
        showSuccessToast('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      dismissToast(showLoadingToastId);
      
      if (isClerkAPIResponseError(err)) {
        // Clerk-specific errors
        showErrorToast(err.errors[0]?.longMessage || 'Signup failed');
      } else if (err instanceof Error) {
        // Generic errors
        showErrorToast(err.message);
      } else {
        // Unknown errors
        showErrorToast('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }
// Verification code input component only if user account with the email password
  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-center">Verify Your Email</h2>
          <p className="text-center">
            We&apos;ve sent a verification code to {formData.email}
          </p>
          
          <form className="mt-8 space-y-6" onSubmit={async (e) => {
            e.preventDefault();
            const code = (e.currentTarget.elements.namedItem('code') as HTMLInputElement).value;
            const showLoadingToastId = showLoadingToast("Verifying you account...");
            try {
              const completeSignUp = await signUp?.attemptEmailAddressVerification({
                code,
              });

              if (completeSignUp?.status === 'complete') {
                dismissToast(showLoadingToastId);
                 showSuccessToast("Verfication complete");
                 showSuccessToast("Please wait till you will be redirected");
                await setActive({ session: completeSignUp?.createdSessionId });
                router.push('/user/dashboard');
              }
            } catch (err) {
                dismissToast(showLoadingToastId);
              if (isClerkAPIResponseError(err)) {
                showErrorToast(err.errors[0]?.longMessage || 'Verification failed');
              }
            }
          }}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dull focus:border-primary-dull"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-dull hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dull"
              >
                Verify Email
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
// login page rendering

  return (
    <div className="h-screen w-full flex">
      
      {/* Terms and Conditions Modal */}
      {showTermsModal && <TermsAndConditions setShowTermsModal={setShowTermsModal}/>}

      {/* left banner side */}
      <div className='hidden lg:flex flex-[3] items-center justify-center p-[5%] bg-gradient-to-b from-primary-bright to-primary-dull'>
        <div className='flex flex-col h-[80%] p-10 gap-4 w-full border border-white rounded-md bg-white/10 backdrop-blur-lg'>
          <h1 className='text-white text-4xl font-bold'>
            Empowering Business<br/>
            with complete Financial<br/>
            solutions.
          </h1>
          <div className='flex flex-col items-center justify-center gap-4 flex-1'>
            <div className='relative w-[100%] h-[100%] max-h-[300px]'>
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

      {/* right signup side */}
      <div className='flex flex-1 lg:flex-[5] flex-col items-center justify-between px-12 md:p-4 overflow-y-scroll no-scrollbar'>
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

        {/* Signup Form */}
        <div className="flex flex-1 flex-col w-full justify-center items-center">
          <div className='flex flex-col gap-3'>
            <h2 className="text-center text-2xl font-bold text-gray-900">
              Create Account
            </h2>
            <p className='text-dark text-center'>Please enter your details to sign up</p>
          </div>

          <div className="mt-10 w-full md:w-[60%]">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-md/6 font-bold text-dark">
                  First Name
                </label>
                <div className="mt-2 relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='John Doe'
                    className="block w-full rounded-md bg-white pl-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="text-gray-500" size={20}/>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-md/6 font-bold text-dark">
                  Last Name
                </label>
                <div className="mt-2 relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder='John Doe'
                    className="block w-full rounded-md bg-white pl-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="text-gray-500" size={20} />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-md/6 font-bold text-dark">
                  Username
                </label>
                <div className="mt-2 relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder='John Doe'
                    className="block w-full rounded-md bg-white pl-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="text-gray-500" size={20}/>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-md/6 font-bold text-dark">
                  Email address
                </label>
                <div className="mt-2 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder='example@gmail.com'
                    className="block w-full rounded-md bg-white pl-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="text-gray-500" size={20} />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm/6 font-bold text-dark">
                  Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder='**********'
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                  <button
                    type="button"
                    className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 
                      <Eye className="text-gray-500" size={20}/> : 
                      <EyeOff className="text-gray-500" size={20}/>
                    }
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm/6 font-bold text-dark">
                  Confirm Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder='**********'
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-bright sm:text-sm/6"
                  />
                  <button
                    type="button"
                    className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 
                      <Eye className="text-gray-500" /> : 
                      <EyeOff className="text-gray-500" />
                    }
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-dull focus:ring-primary-dull"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{' '}
                  <button 
                    type="button" 
                    onClick={() => setShowTermsModal(true)}
                    className="font-medium text-primary-dull hover:underline hover:text-primary-medium"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>
                 {/* Clerk CAPTCHA Widget      */}
              <div id="clerk-captcha" data-cl-theme="light" data-cl-size="flexible"></div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full cursor-pointer justify-center rounded-md bg-primary-dull px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-primary-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dull disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm/6 text-dark">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-primary-dull hover:text-primary-medium relative group"
              >
                Sign in
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-medium transition-all group-hover:w-full"></span>
              </Link>
            </p>
          </div>

          
        </div>

        {/* Footer */}
        <footer className="mt-6 mb-3 text-center text-sm">
          Copyright © {new Date().getFullYear()} <span className='text-primary-dull'>Finance.</span> All rights reserved.
        </footer>
      </div>
    </div>
  )
}

export default SignupPage