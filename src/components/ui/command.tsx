"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  )
)
Command.displayName = "Command"

interface CommandInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onValueChange?: (value: string) => void
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
CommandInput.displayName = "CommandInput"

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props} />
  )
)
CommandList.displayName = "CommandList"

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
CommandEmpty.displayName = "CommandEmpty"

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
)
CommandGroup.displayName = "CommandGroup"

interface CommandItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
CommandItem.displayName = "CommandItem"

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem }
