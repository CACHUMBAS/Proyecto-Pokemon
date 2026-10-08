import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}
export function Button({ variant = 'primary', type = 'button', className = '', ...props }: Props) {
  return <button {...props} type={type} className={`button button-${variant} ${className}`} />
}
