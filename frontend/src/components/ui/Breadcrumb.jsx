import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

const Breadcrumb = ({ items = [], className }) => {
  if (!items.length) return null;

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-gray-600', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg 
                  className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
              
              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Enhanced breadcrumb with icons and dropdown support
const EnhancedBreadcrumb = ({ 
  items = [], 
  maxItems = 4,
  showHome = true,
  homeIcon = true,
  className 
}) => {
  if (!items.length && !showHome) return null;

  // Add home item if requested
  const allItems = showHome 
    ? [{ label: 'Home', href: '/', icon: 'home' }, ...items]
    : items;

  // Handle collapsed breadcrumbs if too many items
  const shouldCollapse = allItems.length > maxItems;
  const visibleItems = shouldCollapse 
    ? [
        allItems[0], // First item
        { label: '...', collapsed: true },
        ...allItems.slice(-2) // Last 2 items
      ]
    : allItems;

  const getItemIcon = (iconType) => {
    const icons = {
      home: (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      folder: (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      document: (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    };
    
    return icons[iconType] || null;
  };

  return (
    <nav className={cn('flex items-center py-3', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isCollapsed = item.collapsed;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg 
                  className="flex-shrink-0 h-4 w-4 text-gray-300 mx-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
              
              {isCollapsed ? (
                <button
                  className="px-2 py-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Show hidden items"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              ) : isLast ? (
                <span className="flex items-center font-medium text-gray-900" aria-current="page">
                  {item.icon && getItemIcon(item.icon)}
                  <span className="truncate max-w-xs">{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium hover:bg-blue-50 px-2 py-1 rounded"
                >
                  {item.icon && getItemIcon(item.icon)}
                  <span className="truncate max-w-xs">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Export both versions
export { Breadcrumb as default, EnhancedBreadcrumb };
