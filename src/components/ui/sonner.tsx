"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "group flex items-center gap-3 w-full max-w-sm p-4 rounded-lg border shadow-lg transition-all",
          title: "text-sm font-medium",
          description: "text-sm opacity-80",
          actionButton: "bg-transparent border border-current px-3 py-1 rounded text-sm font-medium",
          cancelButton: "bg-transparent border border-current px-3 py-1 rounded text-sm font-medium opacity-50",
          success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
          error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
          warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
          info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
          loading: "bg-muted border-border text-foreground",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-green-600 dark:text-green-400" />,
        info: <InfoIcon className="size-5 text-blue-600 dark:text-blue-400" />,
        warning: <TriangleAlertIcon className="size-5 text-amber-600 dark:text-amber-400" />,
        error: <XCircleIcon className="size-5 text-red-600 dark:text-red-400" />,
        loading: <Loader2Icon className="size-5 animate-spin text-muted-foreground" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
