import { cn } from '../../lib/utils';

const Loading = ({ 
  size = 'default', 
  className,
  text = 'Loading...',
  showText = true 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <svg
        className={cn('animate-spin text-blue-600', sizes[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {showText && text && (
        <span className="text-sm text-gray-600">{text}</span>
      )}
    </div>
  );
};

const PageLoading = ({ text = 'Loading page...' }) => (
  <div className="flex items-center justify-center min-h-screen">
    <Loading size="xl" text={text} />
  </div>
);

const InlineLoading = ({ text = 'Loading...', className }) => (
  <div className={cn('flex items-center space-x-2 py-2', className)}>
    <Loading size="sm" text={text} />
  </div>
);

const SkeletonLoader = ({ className, ...props }) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-gray-200',
      className
    )}
    {...props}
  />
);

const CardSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-6 space-y-4">
    <SkeletonLoader className="h-4 w-3/4" />
    <SkeletonLoader className="h-4 w-1/2" />
    <SkeletonLoader className="h-20 w-full" />
    <div className="flex space-x-2">
      <SkeletonLoader className="h-8 w-20" />
      <SkeletonLoader className="h-8 w-24" />
    </div>
  </div>
);

const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <SkeletonLoader className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export { 
  Loading, 
  PageLoading, 
  InlineLoading, 
  SkeletonLoader, 
  CardSkeleton, 
  ListSkeleton 
};
