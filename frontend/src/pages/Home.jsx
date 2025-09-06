import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '../components';
import useAuthStore from '../stores/authStore';
import AcademicLevelTabs from '../components/ui/AcademicLevelTabs';
import SubjectCards from '../components/ui/SubjectCards';
import FeaturedResources from '../components/ui/FeaturedResources';
import { homeAPI, analyticsAPI } from '../lib/api';

const Home = () => {
  const { isAuthenticated } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState('undergraduate');
  const [homeStats, setHomeStats] = useState(null);
  const [popularNotes, setPopularNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Valid academic levels (doctorate and professional removed)
  const validLevels = ['undergraduate', 'graduate'];
  
  // Handle level change with validation
  const handleLevelChange = (level) => {
    if (validLevels.includes(level)) {
      setSelectedLevel(level);
    }
  };

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Vast Paper Collection',
      description: 'Access thousands of academic papers, notes, and study materials from universities worldwide.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Organized by Institution',
      description: 'Papers are systematically organized by university, program, branch, semester, and subject for easy discovery.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Community Driven',
      description: 'Built by students, for students. Share your knowledge and help others succeed in their academic journey.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Quality Assured',
      description: 'All papers go through a moderation process to ensure quality and relevance for the academic community.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Easy Downloads',
      description: 'Simple one-click downloads with no hidden fees. Access the materials you need instantly.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ),
      title: 'Personal Library',
      description: 'Bookmark papers, track your uploads, and build your personal collection of study materials.',
    },
  ];

  // Fetch homepage data
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Fetch both stats and popular notes
        const [stats, notesData] = await Promise.all([
          homeAPI.getStats(),
          analyticsAPI.getPopularNotes(5, 30) // Get top 5 popular notes from last 30 days
        ]);
        
        setHomeStats(stats);
        setPopularNotes(notesData.notes || []);
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
        // Use fallback stats if API fails
        setHomeStats({
          total_papers: 1250,
          total_universities: 25,
          total_users: 850,
          total_downloads: 5600,
          academic_levels: {
            undergraduate: 750,
            graduate: 500
          }
        });
        setPopularNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Format numbers for display
  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M+';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K+';
    }
    return count?.toString() || '0';
  };

  // Generate stats array from API data
  const stats = homeStats ? [
    { label: 'Academic Papers', value: formatCount(homeStats.total_papers) },
    { label: 'Universities', value: formatCount(homeStats.total_universities) },
    { label: 'Study Notes', value: formatCount(homeStats.total_notes || 0) },
    { label: 'Active Students', value: formatCount(homeStats.total_users) },
    { label: 'Downloads', value: formatCount(homeStats.total_downloads) },
  ] : [
    { label: 'Academic Papers', value: '...' },
    { label: 'Universities', value: '...' },
    { label: 'Study Notes', value: '...' },
    { label: 'Active Students', value: '...' },
    { label: 'Downloads', value: '...' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-8 sm:py-12 text-black relative  bg-[#d7d6ff]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Side Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left sm:ml-16">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Explore University-Wise PYQs & Study Smarter 🎓
              </h1>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6">
                Your One-Stop Destination for University PYQs & Study Materials ~ Available for Instant Download ✨
              </p>

              {/* Original Buttons - Maintained Functionality */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 mb-6">
                {isAuthenticated ? (
                  <Link to="/papers">
                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-full">
                      Explore Resources
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-full">
                        Join for Free
                      </Button>
                    </Link>
                    <Link to="/papers">
                      <Button variant="outline" size="sm" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-full">
                        Browse Papers
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Side Image */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end mr-16">
              <img
                src="/hero-illustration.png"
                alt="Student studying"
                className="max-w-full sm:max-w-xs md:max-w-md lg:max-w-lg drop-shadow-lg"
                onError={(e) => {
                  // Fallback to a placeholder if image doesn't exist
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback placeholder */}
              <div className="hidden max-w-xs h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📚</div>
                  <div className="text-sm font-medium">Study Illustration</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Level Tabs Section */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <AcademicLevelTabs 
            onLevelChange={handleLevelChange} 
            defaultLevel={selectedLevel}
            academicLevels={homeStats?.academic_levels}
          />
        </div>
      </div>

      {/* Subject Cards Section */}
      <div className="py-16 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Explore by Subject
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Browse academic resources organized by field of study
            </p>
          </div>

          <SubjectCards level={selectedLevel} homeStats={homeStats} />
        </div>
      </div>

      {/* Featured Resources Section */}
      <div className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <FeaturedResources />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="w-full py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Trusted by Students Worldwide
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium text-blue-100 sm:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Popular Notes Section */}
          {popularNotes.length > 0 && (
            <div className="mt-8 pt-8 border-t border-blue-500/30">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                📚 Trending Study Notes
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {popularNotes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-blue-100 hover:bg-white/20 transition-colors duration-200"
                  >
                    <span className="font-medium">{note.title}</span>
                    <span className="ml-2 text-xs opacity-75">
                      {note.download_count} downloads
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50">
        <div className="w-full py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Ready to boost your studies?</span>
            <span className="block text-blue-600">Join thousands of students today.</span>
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row lg:mt-0 lg:flex-shrink-0 gap-3">
            <div className="inline-flex">
              {isAuthenticated ? (
                <Link to="/upload">
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-full">
                    Upload Your First Paper
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-full">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
            <div className="inline-flex">
              <Link to="/about">
                <Button variant="outline" size="sm" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How UniNotesHub Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Simple steps to access and share academic materials
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sign Up</h3>
                <p className="mt-2 text-gray-600">
                  Create your free account and join our community of students and academics.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Browse & Download</h3>
                <p className="mt-2 text-gray-600">
                  Search and filter papers by university, subject, and semester. Download what you need instantly.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Share & Contribute</h3>
                <p className="mt-2 text-gray-600">
                  Upload your own papers and notes to help fellow students and build your academic reputation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
