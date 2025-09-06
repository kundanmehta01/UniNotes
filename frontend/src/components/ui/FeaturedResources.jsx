import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { homeAPI } from '../../lib/api';

const FeaturedResources = () => {
  const [featuredPapers, setFeaturedPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const papersData = await homeAPI.getFeaturedPapers(4);
        setFeaturedPapers(papersData);
      } catch (error) {
        console.error('Failed to fetch featured resources:', error);
        // Use fallback data
        setFeaturedPapers(staticFeaturedPapers);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // Static fallback data
  const staticFeaturedPapers = [
    {
      id: 1,
      title: 'Introduction to Machine Learning',
      university: 'Stanford University',
      subject: 'Computer Science',
      downloads: 2850,
      rating: 4.9,
      thumbnail: '/api/placeholder/300/200',
      level: 'Graduate',
      tags: ['ML', 'AI', 'Python'],
    },
    {
      id: 2,
      title: 'Calculus and Analytical Geometry',
      university: 'MIT',
      subject: 'Mathematics',
      downloads: 3120,
      rating: 4.8,
      thumbnail: '/api/placeholder/300/200',
      level: 'Undergraduate',
      tags: ['Calculus', 'Geometry', 'Mathematics'],
    },
    {
      id: 3,
      title: 'Organic Chemistry Fundamentals',
      university: 'Harvard University',
      subject: 'Chemistry',
      downloads: 1950,
      rating: 4.7,
      thumbnail: '/api/placeholder/300/200',
      level: 'Undergraduate',
      tags: ['Chemistry', 'Organic', 'Lab'],
    },
    {
      id: 4,
      title: 'Data Structures and Algorithms',
      university: 'UC Berkeley',
      subject: 'Computer Science',
      downloads: 4200,
      rating: 4.9,
      thumbnail: '/api/placeholder/300/200',
      level: 'Undergraduate',
      tags: ['DSA', 'Programming', 'Algorithms'],
    },
  ];


  return (
    <div>
      {/* Featured Papers */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Resources</h2>
            <p className="text-gray-600 mt-1">Most popular papers this week</p>
          </div>
          <Link
            to="/papers?featured=true"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
          >
            View all featured
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredPapers.map((paper) => (
            <Link
              key={paper.id}
              to={`/papers/${paper.id}`}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {paper.level}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {paper.title}
                </h3>
                
                <div className="text-xs text-gray-500 mb-3">
                  <div>{paper.university}</div>
                  <div>{paper.subject}</div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {paper.downloads.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {paper.rating}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {paper.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {paper.tags.length > 2 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      +{paper.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FeaturedResources;
