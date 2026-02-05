import { ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: {
    label: string;
    href?: string;
  }[];
  actions?: ReactNode;
  stats?: {
    icon?: ReactNode;
    label: string;
    value: string | number;
  }[];
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  stats,
  children,
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumb.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-muted-foreground/50">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Title and Description */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {stat.icon && <span className="shrink-0">{stat.icon}</span>}
              <span className="font-medium text-foreground">{stat.value}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Additional Content */}
      {children}
    </div>
  );
}

/**
 * ActionButton - A button component for use in PageHeader actions
 */
export interface ActionButtonProps {
  asChild?: boolean;
  variant?: "default" | "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function ActionButton({
  asChild = false,
  variant = "default",
  size = "md",
  children,
  className,
  onClick,
  href,
  icon,
  disabled = false,
}: ActionButtonProps) {
  const Comp = asChild ? Slot : (href ? "a" : "button");

  const variantStyles = {
    default: "bg-background hover:bg-muted text-foreground border border-input",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-muted text-foreground",
    outline: "border border-input bg-background hover:bg-muted text-foreground",
  };

  const sizeStyles = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
  };

  return (
    <Comp
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon}
      {children}
    </Comp>
  );
}

/**
 * ActionGroup - A group of action buttons with a separator
 */
export interface ActionGroupProps {
  children: ReactNode;
  separator?: boolean;
}

export function ActionGroup({ children, separator = false }: ActionGroupProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
      {separator && <div className="w-px h-5 bg-border" />}
    </div>
  );
}

/**
 * DropdownAction - A dropdown menu action
 */
export interface DropdownActionProps {
  trigger: ReactNode;
  children: ReactNode;
}

export function DropdownAction({ trigger, children }: DropdownActionProps) {
  return (
    <div className="relative group">
      {trigger}
      {/* Dropdown menu would go here - can add Radix UI Dropdown later */}
    </div>
  );
}
