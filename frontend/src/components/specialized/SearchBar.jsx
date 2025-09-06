import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { cn, debounce } from '../../lib/utils';

const SearchBar = ({
  onSearch,
  onFilterChange,
  filters = {},
  universities = [],
  programs = [],
  branches = [],
  semesters = [],
  subjects = [],
  placeholder = "Search papers by title, subject, or keywords...",
  showFilters = true,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounced search function
  const debouncedSearch = debounce((query) => {
    onSearch?.(query);
  }, 300);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleFilterChange = (filterName, value) => {
    onFilterChange?.({ ...filters, [filterName]: value });
  };

  const clearFilters = () => {
    const clearedFilters = {
      university: '',
      program: '',
      branch: '',
      semester: '',
      subject: '',
      year: '',
      status: 'approved',
    };
    onFilterChange?.(clearedFilters);
    setSearchQuery('');
    onSearch?.('');
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== '' && value !== 'approved'
  ) || searchQuery;

  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-12"
        />
        {showFilters && (
          <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* University Filter */}
            <Select
              label="University"
              placeholder="Select university..."
              value={filters.university || ''}
              onChange={(value) => handleFilterChange('university', value)}
              options={[
                { value: '', label: 'All Universities' },
                ...universities.map(uni => ({ value: uni.id, label: uni.name }))
              ]}
            />

            {/* Program Filter */}
            <Select
              label="Program"
              placeholder="Select program..."
              value={filters.program || ''}
              onChange={(value) => handleFilterChange('program', value)}
              options={[
                { value: '', label: 'All Programs' },
                ...programs.map(prog => ({ value: prog.id, label: prog.name }))
              ]}
              disabled={!filters.university}
            />

            {/* Branch Filter */}
            <Select
              label="Branch"
              placeholder="Select branch..."
              value={filters.branch || ''}
              onChange={(value) => handleFilterChange('branch', value)}
              options={[
                { value: '', label: 'All Branches' },
                ...branches.map(branch => ({ value: branch.id, label: branch.name }))
              ]}
              disabled={!filters.program}
            />

            {/* Semester Filter */}
            <Select
              label="Semester"
              placeholder="Select semester..."
              value={filters.semester || ''}
              onChange={(value) => handleFilterChange('semester', value)}
              options={[
                { value: '', label: 'All Semesters' },
                ...semesters.map(sem => ({ value: sem.id, label: sem.name }))
              ]}
              disabled={!filters.branch}
            />

            {/* Subject Filter */}
            <Select
              label="Subject"
              placeholder="Select subject..."
              value={filters.subject || ''}
              onChange={(value) => handleFilterChange('subject', value)}
              options={[
                { value: '', label: 'All Subjects' },
                ...subjects.map(sub => ({ value: sub.id, label: sub.name }))
              ]}
              disabled={!filters.semester}
            />

            {/* Year Filter */}
            <Select
              label="Year"
              placeholder="Select year..."
              value={filters.year || ''}
              onChange={(value) => handleFilterChange('year', value)}
              options={[
                { value: '', label: 'All Years' },
                ...yearOptions
              ]}
            />

            {/* Status Filter - for admin/moderator users */}
            <Select
              label="Status"
              placeholder="Select status..."
              value={filters.status || 'approved'}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'all', label: 'All Status' },
              ]}
            />
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {hasActiveFilters ? 'Filters applied' : 'No filters applied'}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(false)}
              >
                Hide Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{searchQuery}"
              <button
                type="button"
                className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                onClick={() => {
                  setSearchQuery('');
                  onSearch?.('');
                }}
              >
                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          )}
          
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === '' || value === 'approved') return null;
            
            let label = key.charAt(0).toUpperCase() + key.slice(1);
            let displayValue = value;
            
            // Try to get display name for dropdown values
            if (key === 'university') {
              const uni = universities.find(u => u.id === value);
              displayValue = uni?.name || value;
            } else if (key === 'program') {
              const prog = programs.find(p => p.id === value);
              displayValue = prog?.name || value;
            } else if (key === 'branch') {
              const branch = branches.find(b => b.id === value);
              displayValue = branch?.name || value;
            } else if (key === 'semester') {
              const sem = semesters.find(s => s.id === value);
              displayValue = sem?.name || value;
            } else if (key === 'subject') {
              const sub = subjects.find(s => s.id === value);
              displayValue = sub?.name || value;
            }
            
            return (
              <span
                key={key}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {label}: {displayValue}
                <button
                  type="button"
                  className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-500"
                  onClick={() => handleFilterChange(key, '')}
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

export default SearchBar;
