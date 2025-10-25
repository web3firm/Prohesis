import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'outline' | 'ghost' | 'link';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className = '', variant = 'default', children, ...props }, ref) => {
		const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition';
		const variants: Record<string, string> = {
			default: 'bg-blue-600 text-white hover:bg-blue-700',
			outline: 'border bg-white text-gray-700 hover:bg-gray-50',
			ghost: 'bg-transparent text-gray-700 hover:bg-gray-50',
			link: 'bg-transparent underline text-blue-600',
		};

		return (
			<button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props}>
				{children}
			</button>
		);
	}
);
Button.displayName = 'Button';

export default Button;
