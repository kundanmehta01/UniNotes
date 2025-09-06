import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Badge = forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    destructive: 'bg-red-100 hover:bg-red-200 text-red-800',
    success: 'bg-green-100 hover:bg-green-200 text-green-800',
    warning: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
    info: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
    outline: 'border border-gray-200 text-gray-900 hover:bg-gray-100',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export default Badge;
