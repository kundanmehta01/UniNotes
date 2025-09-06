import { useState } from 'react';
import { cn } from '../../lib/utils';

const FilterPanel = ({
  filters = {},
  onFilterChange,
  filterOptions = null,
  className,
  contentType = 'default' // 'papers', 'notes', or 'default'
}) => {
  const [expandedSections, setExpandedSections] = useState({
    level: true,
    subject: true,
    university: true,
    type: true,
    recent: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };
    
    // Map frontend filter keys to backend API parameters
    const keyMapping = {
      'level': 'academic_level',
      'type': 'content_type', 
      'recent': 'upload_date_range',
      'subject': 'subject',
      'university': 'university',
      'exam_year': 'exam_year'
    };
    
    const apiKey = keyMapping[key] || key;
    
    if (newFilters[apiKey] === value) {
      delete newFilters[apiKey];
    } else {
      newFilters[apiKey] = value;
    }
    
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange?.({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Map frontend filter keys to backend API parameters
  const keyMapping = {
    'level': 'academic_level',
    'type': 'content_type', 
    'recent': 'upload_date_range',
    'subject': 'subject',
    'university': 'university',
    'exam_year': 'exam_year'
  };

  // Check if a specific section has an active filter
  const isFilterActive = (sectionKey) => {
    const apiKey = keyMapping[sectionKey] || sectionKey;
    return filters[apiKey] !== undefined;
  };

  // Get the current filter value for a section
  const getFilterValue = (sectionKey) => {
    const apiKey = keyMapping[sectionKey] || sectionKey;
    return filters[apiKey];
  };

  // Define all possible filter sections
  const allFilterSections = filterOptions ? [
    {
      key: 'level',
      title: 'Academic Level',
      icon: '🎓',
      options: filterOptions.academic_levels || []
    },
    {
      key: 'type',
      title: 'Content Type',
      icon: '📁',
      options: filterOptions.content_types || []
    },
    {
      key: 'subject',
      title: 'Subject',
      icon: '📚',
      options: filterOptions.subjects || []
    },
    {
      key: 'university',
      title: 'University',
      icon: '🏛️',
      options: filterOptions.universities || []
    },
    {
      key: 'recent',
      title: 'Upload Date',
      icon: '⏰',
      options: filterOptions.upload_date_ranges || []
    },
    {
      key: 'exam_year',
      title: 'Exam Year',
      icon: '📅',
      options: filterOptions.exam_years || []
    }
  ] : [
    // Fallback sections with loading/empty state
    {
      key: 'level',
      title: 'Academic Level',
      icon: '🎓',
      options: []
    },
    {
      key: 'type',
      title: 'Content Type',
      icon: '📁',
      options: []
    },
    {
      key: 'subject',
      title: 'Subject',
      icon: '📚',
      options: []
    },
    {
      key: 'university',
      title: 'University',
      icon: '🏛️',
      options: []
    },
    {
      key: 'recent',
      title: 'Upload Date',
      icon: '⏰',
      options: []
    },
    {
      key: 'exam_year',
      title: 'Exam Year',
      icon: '📅',
      options: []
    }
  ];
  
  // Filter sections based on content type
  const filterSections = allFilterSections.filter(section => {
    // Always exclude content_types since we have dedicated pages
    if (section.key === 'type') {
      return false;
    }
    
    // For notes page, exclude exam_year since it's for papers
    if (contentType === 'notes' && section.key === 'exam_year') {
      return false;
    }
    
    return true;
  });

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="space-y-6">
        {filterSections.map((section) => (
          <div key={section.key} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
            <button
              onClick={() => toggleSection(section.key)}
              className="flex items-center justify-between w-full text-left mb-4 hover:text-gray-900"
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{section.icon}</span>
                <span className="font-medium text-gray-900">{section.title}</span>
                {isFilterActive(section.key) && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    1
                  </span>
                )}
              </div>
              <svg
                className={cn(
                  'w-5 h-5 text-gray-400 transition-transform',
                  expandedSections[section.key] ? 'rotate-90' : 'rotate-0'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {expandedSections[section.key] && (
              <div className="space-y-2">
                {section.options.length > 0 ? (
                  section.options.slice(0, 8).map((option) => {
                    const isSelected = getFilterValue(section.key) === option.value;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleFilterChange(section.key, option.value)}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center mr-3',
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 hover:border-gray-400'
                            )}
                          >
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 8 8">
                                <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {option.count?.toLocaleString()}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {filterOptions ? 'No options available' : 'Loading options...'}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''} active
            </span>
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
