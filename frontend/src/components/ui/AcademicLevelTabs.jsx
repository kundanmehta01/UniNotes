import { useState } from 'react';
import { cn } from '../../lib/utils';

const AcademicLevelTabs = ({ onLevelChange, defaultLevel = 'undergraduate', academicLevels }) => {
  const [activeLevel, setActiveLevel] = useState(defaultLevel);

  // Format count for display
  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K+';
    }
    return count?.toString() || '0';
  };

  const levels = [
    { 
      id: 'undergraduate', 
      label: 'Undergraduate', 
      count: academicLevels ? formatCount(academicLevels.undergraduate) : '...' 
    },
    { 
      id: 'graduate', 
      label: 'Graduate', 
      count: academicLevels ? formatCount(academicLevels.graduate) : '...' 
    },
  ];

  const handleLevelClick = (levelId) => {
    setActiveLevel(levelId);
    onLevelChange?.(levelId);
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-200 bg-white">
        {/* Desktop Navigation */}
        <nav className="-mb-px hidden sm:flex sm:space-x-8" aria-label="Academic Levels">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelClick(level.id)}
              className={cn(
                'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                activeLevel === level.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span>{level.label}</span>
              <span 
                className={cn(
                  'ml-2 py-0.5 px-2 rounded-full text-xs font-medium transition-colors duration-200',
                  activeLevel === level.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                )}
              >
                {level.count}
              </span>
            </button>
          ))}
        </nav>

        {/* Mobile Navigation - Scrollable */}
        <div className="sm:hidden">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex space-x-1 px-4 min-w-max">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleLevelClick(level.id)}
                  className={cn(
                    'group inline-flex flex-col items-center py-3 px-3 border-b-2 font-medium text-xs transition-colors duration-200 whitespace-nowrap',
                    activeLevel === level.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="text-center">{level.label}</span>
                  <span 
                    className={cn(
                      'mt-1 py-0.5 px-1.5 rounded-full text-xs font-medium transition-colors duration-200',
                      activeLevel === level.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    )}
                  >
                    {level.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicLevelTabs;
