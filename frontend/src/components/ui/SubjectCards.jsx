import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { homeAPI } from '../../lib/api';

const SubjectCards = ({ level = 'undergraduate', homeStats }) => {
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format count for display
  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K+';
    }
    return count?.toString() || '0';
  };

  // Subject icon and styling mapping
  const subjectStyles = {
    'computer science': {
      icon: '💻',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    'computer-science': {
      icon: '💻',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    'mathematics': {
      icon: '🧮',
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    'physics': {
      icon: '⚛️',
      gradient: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    'engineering': {
      icon: '⚙️',
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    'business': {
      icon: '📊',
      gradient: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    'biology': {
      icon: '🧬',
      gradient: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    'chemistry': {
      icon: '⚗️',
      gradient: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    'data science': {
      icon: '📈',
      gradient: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
    },
    'artificial intelligence': {
      icon: '🤖',
      gradient: 'from-blue-600 to-purple-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    // Default style for unknown subjects
    'default': {
      icon: '📚',
      gradient: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    }
  };

  // Helper function to get display name for category
  const getCategoryDisplayName = (category) => {
    const displayNames = {
      'computer-science': 'Computer Science',
      'mathematics': 'Mathematics',
      'physics': 'Physics',
      'engineering': 'Engineering',
      'business': 'Business',
      'biology': 'Biology',
      'chemistry': 'Chemistry',
      'data-science': 'Data Science',
      'artificial-intelligence': 'Artificial Intelligence'
    };
    return displayNames[category] || category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Helper function to get appropriate description based on academic level
  const getCategoryDescription = (category, level) => {
    const descriptions = {
      undergraduate: {
        'computer-science': 'Programming fundamentals, data structures, algorithms',
        'mathematics': 'Calculus, algebra, statistics, discrete math',
        'physics': 'Mechanics, thermodynamics, electromagnetism',
        'engineering': 'Mechanical, electrical, civil engineering basics',
        'business': 'Business fundamentals, economics, marketing',
        'biology': 'Cell biology, genetics, ecology, anatomy',
        'chemistry': 'General chemistry, organic chemistry, biochemistry'
      },
      graduate: {
        'computer-science': 'Advanced algorithms, system design, research methods',
        'mathematics': 'Advanced calculus, linear algebra, mathematical modeling',
        'physics': 'Quantum mechanics, advanced thermodynamics, research',
        'engineering': 'Advanced engineering design, research, specializations',
        'business': 'Strategic management, advanced finance, leadership',
        'biology': 'Advanced molecular biology, research methodologies',
        'chemistry': 'Advanced chemistry, research, analytical methods'
      }
    };

    const levelDescriptions = descriptions[level] || descriptions.undergraduate;
    return levelDescriptions[category] || `Explore ${getCategoryDisplayName(category)} resources for ${level} level`;
  };

  // Helper function to determine if a category should be included for a specific level
  const shouldIncludeForLevel = (category, level) => {
    // All basic subjects are available for both levels
    const basicSubjects = ['computer-science', 'mathematics', 'physics', 'engineering', 'business', 'biology', 'chemistry'];
    
    if (basicSubjects.includes(category)) {
      return true; // Basic subjects available for both levels
    }

    // Advanced subjects more relevant for graduate level
    const advancedSubjects = ['data-science', 'artificial-intelligence', 'machine-learning'];
    if (advancedSubjects.includes(category)) {
      return level === 'graduate'; // Only show for graduate level
    }

    // For any other category, include it
    return true;
  };

  // Fetch subject stats from API
  useEffect(() => {
    const fetchSubjectStats = async () => {
      try {
        setLoading(true);
        
        // Fetch level-specific subject stats from API
        const stats = await homeAPI.getSubjectStats(level);
        
        // Transform the flat category stats into subject cards
        const subjectCards = [];
        
        // Process the stats and create cards based on the current level
        Object.entries(stats).forEach(([category, paperCount]) => {
          if (category === 'other' || paperCount === 0) return; // Skip 'other' category
          
          const normalizedCategory = category.toLowerCase();
          const style = subjectStyles[normalizedCategory] || subjectStyles.default;
          
          // Get display name for the category
          const displayName = getCategoryDisplayName(category);
          const description = getCategoryDescription(category, level);
          
          // Only include subjects that make sense for the academic level
          if (shouldIncludeForLevel(category, level)) {
            subjectCards.push({
              id: category,
              name: displayName,
              description: description,
              count: formatCount(paperCount),
              ...style
            });
          }
        });
        
        // Sort by paper count (descending) and limit to top subjects
        const sortedSubjects = subjectCards
          .sort((a, b) => {
            const countA = parseInt(a.count.replace(/[^0-9]/g, '')) || 0;
            const countB = parseInt(b.count.replace(/[^0-9]/g, '')) || 0;
            return countB - countA;
          })
          .slice(0, 8); // Show top 8 subjects
        
        setSubjectData(sortedSubjects);
      } catch (error) {
        console.error('Failed to fetch subject stats:', error);
        // Use fallback static data for the selected level
        setSubjectData(getFallbackSubjects(level));
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectStats();
  }, [level]);

  // Fallback static data (only undergraduate and graduate)
  const getFallbackSubjects = (level) => {
    const fallbackData = {
      undergraduate: [
        {
          id: 'computer-science',
          name: 'Computer Science',
          description: 'Programming, algorithms, software engineering',
          count: '1,250+',
          ...subjectStyles['computer-science']
        },
        {
          id: 'mathematics',
          name: 'Mathematics',
          description: 'Calculus, algebra, statistics, discrete math',
          count: '890+',
          ...subjectStyles.mathematics
        },
        {
          id: 'physics',
          name: 'Physics',
          description: 'Mechanics, thermodynamics, quantum physics',
          count: '720+',
          ...subjectStyles.physics
        },
        {
          id: 'engineering',
          name: 'Engineering',
          description: 'Mechanical, electrical, civil, chemical',
          count: '1,100+',
          ...subjectStyles.engineering
        },
        {
          id: 'business',
          name: 'Business',
          description: 'Management, finance, marketing, economics',
          count: '950+',
          ...subjectStyles.business
        },
        {
          id: 'biology',
          name: 'Biology',
          description: 'Cell biology, genetics, ecology, anatomy',
          count: '680+',
          ...subjectStyles.biology
        },
      ],
      graduate: [
        {
          id: 'data-science',
          name: 'Data Science',
          description: 'Big data, analytics, visualization',
          count: '350+',
          ...subjectStyles['data science']
        },
        {
          id: 'artificial-intelligence',
          name: 'Artificial Intelligence',
          description: 'Machine learning, AI, distributed systems',
          count: '420+',
          ...subjectStyles['artificial intelligence']
        },
        {
          id: 'business-administration',
          name: 'Business Administration',
          description: 'Strategic management, leadership, consulting',
          count: '580+',
          ...subjectStyles.business
        },
      ],
    };
    
    return fallbackData[level] || fallbackData.undergraduate;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="w-3/4 h-6 bg-gray-200 rounded mb-2"></div>
            <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {subjectData.map((subject) => (
        <Link
          key={subject.id}
          to={`/papers?subject=${subject.id}&level=${level}`}
          className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className={cn('absolute top-0 left-0 w-full h-1 bg-gradient-to-r', subject.gradient)} />
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-2xl', subject.bgColor)}>
                {subject.icon}
              </div>
              <div className={cn('text-xs font-semibold px-2 py-1 rounded-full', subject.bgColor, subject.textColor)}>
                {subject.count} papers
              </div>
            </div>
            
            <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
              {subject.name}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {subject.description}
            </p>
            
            <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700 transition-colors">
              <span>Explore papers</span>
              <svg 
                className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default SubjectCards;
