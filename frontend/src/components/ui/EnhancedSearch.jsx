import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

const EnhancedSearch = ({
  onSearch,
  onFilterChange,
  suggestions = [],
  placeholder = "Search papers, notes, and resources...",
  showSuggestions = true,
  filters = {},
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const searchRef = useRef(null);
  const suggestionRefs = useRef([]);

  const quickFilters = [
    { key: 'type', label: 'Notes', value: 'notes', icon: '📝' },
    { key: 'type', label: 'Papers', value: 'papers', icon: '📄' },
    { key: 'type', label: 'Slides', value: 'slides', icon: '📊' },
    { key: 'level', label: 'Undergraduate', value: 'undergraduate', icon: '🎓' },
    { key: 'level', label: 'Graduate', value: 'graduate', icon: '📚' },
    { key: 'recent', label: 'This Week', value: '7days', icon: '⏰' },
    { key: 'trending', label: 'Popular', value: 'true', icon: '🔥' },
  ];

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedSuggestionIndex(-1);
    
    if (query.length > 1 && showSuggestions) {
      setShowSuggestionDropdown(true);
    } else {
      setShowSuggestionDropdown(false);
    }
    
    onSearch?.(query);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
      setSearchQuery(suggestions[selectedSuggestionIndex].title);
      onSearch?.(suggestions[selectedSuggestionIndex].title);
    } else {
      onSearch?.(searchQuery);
    }
    setShowSuggestionDropdown(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    onSearch?.(suggestion.title);
    setShowSuggestionDropdown(false);
    searchRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestionDropdown || !suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Escape':
        setShowSuggestionDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
    }
  };

  const handleQuickFilter = (filterKey, filterValue) => {
    const newFilters = { ...filters };
    
    // Toggle filter if it's already active
    if (newFilters[filterKey] === filterValue) {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = filterValue;
    }
    
    onFilterChange?.(newFilters);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestionDropdown(false);
    onSearch?.('');
    searchRef.current?.focus();
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative max-w-4xl mx-auto', className)}>
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <svg 
              className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            ref={searchRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchQuery.length > 1 && suggestions.length > 0) {
                setShowSuggestionDropdown(true);
              }
            }}
            className="w-full pl-12 pr-20 py-4 text-lg border-2 border-gray-200 rounded-2xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400 shadow-sm hover:shadow-md focus:shadow-lg"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-4">
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowQuickFilters(!showQuickFilters)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                hasActiveFilters || showQuickFilters
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
              title="Quick filters"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestionDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-3 py-2">Suggestions</div>
              {suggestions.slice(0, 8).map((suggestion, index) => (
                <button
                  key={index}
                  ref={el => suggestionRefs.current[index] = el}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center space-x-3",
                    selectedSuggestionIndex === index
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{suggestion.title}</div>
                    {suggestion.subject && (
                      <div className="text-sm text-gray-500 truncate">{suggestion.subject}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Quick Filters */}
      {showQuickFilters && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Quick Filters</h3>
            <button
              onClick={() => setShowQuickFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter, index) => {
              const isActive = filters[filter.key] === filter.value;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickFilter(filter.key, filter.value)}
                  className={cn(
                    "inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <span className="mr-2">{filter.icon}</span>
                  {filter.label}
                  {isActive && (
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => onFilterChange?.({})}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showQuickFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            const filter = quickFilters.find(f => f.key === key && f.value === value);
            return (
              <span
                key={`${key}-${value}`}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
              >
                {filter?.icon && <span className="mr-1">{filter.icon}</span>}
                {filter?.label || `${key}: ${value}`}
                <button
                  type="button"
                  onClick={() => handleQuickFilter(key, value)}
                  className="ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-200"
                >
                  <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;
