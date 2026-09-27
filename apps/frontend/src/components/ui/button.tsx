import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

// Cao 44px, bo 10px, chữ 16px/600 (DESIGN §6)
const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-button px-4 text-base font-semibold whitespace-nowrap transition-colors duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-fg hover:bg-secondary-hover',
        ghost: 'bg-transparent text-text hover:bg-surface-muted',
        danger: 'bg-danger text-primary-fg hover:opacity-90',
        outline: 'border border-border bg-transparent text-text hover:bg-surface-muted',
      },
      size: {
        default: '',
        sm: 'min-h-9 px-3 text-sm',
        icon: 'w-11 px-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { buttonVariants }
