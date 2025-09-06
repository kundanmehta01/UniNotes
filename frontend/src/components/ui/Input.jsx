import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({
  className,
  type = 'text',
  error,
  label,
  placeholder,
  required,
  disabled,
  help,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          className
        )}
        placeholder={placeholder}
        ref={ref}
        disabled={disabled}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {help && !error && (
        <p className="mt-1 text-sm text-gray-500">{help}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
