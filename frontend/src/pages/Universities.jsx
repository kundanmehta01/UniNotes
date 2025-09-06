import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Loading, Button } from '../components';
import { papersAPI } from '../lib/api';

const Universities = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoading(true);
        // Fetch filter options to get university data
        const response = await papersAPI.getFilterOptions();
        setUniversities(response.universities || []);
      } catch (err) {
        console.error('Failed to fetch universities:', err);
        setError('Failed to load universities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Universities</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:py-28 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Universities
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto">
              Explore academic resources from {universities.length} universities worldwide. 
              Find papers, notes, and study materials from top institutions.
            </p>
          </div>
        </div>
      </div>

      {/* Universities Grid */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {universities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-7 0h7m-7 0v-2a1 1 0 011-1h2a1 1 0 011 1v2m-7 0V9a2 2 0 012-2h2a2 2 0 012 2v8M9 7h6m-6 4h6m1 0l-3-3 3-3M7 13h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Universities Found</h3>
            <p className="text-gray-600">We're working on adding more universities. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Browse by University
              </h2>
              <p className="mt-3 text-xl text-gray-600">
                Choose from {universities.length} universities with academic resources
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {universities.map((university, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                              {university.label}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Papers Available:</span>
                            <span className="font-medium text-blue-600">
                              {formatCount(university.count)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Link 
                            to={`/papers?university=${encodeURIComponent(university.value)}`}
                            className="flex-1"
                          >
                            <Button size="sm" className="w-full">
                              View Papers
                            </Button>
                          </Link>
                          <Link 
                            to={`/notes?university=${encodeURIComponent(university.value)}`}
                          >
                            <Button variant="outline" size="sm">
                              Notes
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {universities.length}+
              </div>
              <div className="text-sm font-medium text-gray-600">
                Universities
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCount(universities.reduce((total, uni) => total + uni.count, 0))}+
              </div>
              <div className="text-sm font-medium text-gray-600">
                Academic Papers
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                Global
              </div>
              <div className="text-sm font-medium text-gray-600">
                Coverage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Don't see your university?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Help us grow our collection by uploading materials from your institution.
            </p>
            <div className="mt-8">
              <Link to="/upload">
                <Button size="lg">
                  Upload Academic Material
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Universities;
