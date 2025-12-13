import { ReactNode } from "react";
import { toast } from "sonner";
import hotToast from 'react-hot-toast'

// these toasts are from sonner
export const showSuccessToast = (message: string, className?: string, closeButton: boolean = false) => {
    toast.success(message, {
        className: className,
        closeButton: closeButton
    })
}

export const showErrorToast = (message: string, className?: string, closeButton: boolean = false) => {
    toast.error (message,{
        className: className,
        closeButton: closeButton
    })
}

export const showDefaultToast = (message: string, className?: string, closeButton: boolean = false) => {
    toast(message,{
        className: className,
        closeButton: closeButton
    })
}

export const showDescriptionToast = (message: string, className?: string, closeButton: boolean = false, description?: string) => {
    toast.message(message,{
        description: description,
        className: className,
        closeButton: closeButton
    })
}

export const showInfoToast = (message: string, className?: string, closeButton: boolean = false) => {
    toast.info(message,{
        className: className,
        closeButton: closeButton
    })
}

export const showWarningToast = (message: string, className?: string, closeButton: boolean = false) => {
    toast.warning(message,{
        className: className,
        closeButton: closeButton
    })
}

type ToastAction = {
  label: string;
  onClick: () => void;
};

export const showActionToast = (message: string, className?: string, closeButton: boolean = false, action?: ToastAction) => {
    toast(message,{
        action: action
        ? {
            label: action.label,
            onClick: action.onClick,
            }
        : undefined, 
        className: className,
        closeButton: closeButton
    })
}

export const showCustomToast = (content: ReactNode) => {
    toast(content);
}

// these two toast are from react-hot-toast
export const showLoadingToast = (message: string) => {
  return hotToast.loading(message,{
    style:{
    background: '#00A07D',
    color: '#fff',}
  })
}

export const dismissToast = (id: string) => {
  hotToast.dismiss(id)
}

