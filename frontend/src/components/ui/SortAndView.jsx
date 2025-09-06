import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

const SortAndView = ({
  sortOptions = [],
  currentSort = 'newest',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  resultsCount = 0,
  className
}) => {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const defaultSortOptions = [
    { value: 'newest', label: 'Newest First', icon: '⏰' },
    { value: 'oldest', label: 'Oldest First', icon: '📅' },
    { value: 'popular', label: 'Most Popular', icon: '🔥' },
    { value: 'downloads', label: 'Most Downloads', icon: '⬇️' },
    { value: 'title_asc', label: 'Title A-Z', icon: '🔤' },
    { value: 'title_desc', label: 'Title Z-A', icon: '🔢' },
    { value: 'rating', label: 'Highest Rated', icon: '⭐' }
  ];

  const availableSortOptions = sortOptions.length > 0 ? sortOptions : defaultSortOptions;
  const currentSortOption = availableSortOptions.find(option => option.value === currentSort) || availableSortOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortChange = (sortValue) => {
    onSortChange?.(sortValue);
    setShowSortDropdown(false);
  };

  const viewModeOptions = [
    { 
      value: 'grid', 
      label: 'Grid view', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      value: 'list', 
      label: 'List view', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    }
  ];

  return (
    <div className={cn('flex items-center justify-between py-4', className)}>
      {/* Results count */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          {resultsCount > 0 ? (
            <>
              <span className="font-semibold text-gray-900">{resultsCount.toLocaleString()}</span>
              {' '}result{resultsCount !== 1 ? 's' : ''} found
            </>
          ) : (
            'No results found'
          )}
        </span>
      </div>

      {/* Sort and View Controls */}
      <div className="flex items-center space-x-4">
        {/* Sort Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            <span className="mr-2">{currentSortOption?.icon}</span>
            <span>Sort: {currentSortOption?.label}</span>
            <svg 
              className={cn(
                "ml-2 h-4 w-4 text-gray-400 transition-transform",
                showSortDropdown ? "rotate-180" : "rotate-0"
              )} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Sort Dropdown Menu */}
          {showSortDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Sort by
                </div>
                {availableSortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm flex items-center space-x-3 hover:bg-gray-50 transition-colors',
                      currentSort === option.value
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700'
                    )}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span className="flex-1">{option.label}</span>
                    {currentSort === option.value && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        {showViewToggle && (
          <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-white">
            {viewModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onViewModeChange?.(option.value)}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === option.value
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                title={option.label}
              >
                {option.icon}
                <span className="ml-2 hidden sm:inline">{option.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SortAndView;
