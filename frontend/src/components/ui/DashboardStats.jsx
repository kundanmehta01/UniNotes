import { Card, CardContent } from '../ui/Card';

const DashboardStats = ({ stats, isLoading = false }) => {
  const statsConfig = [
    {
      key: 'downloads',
      label: 'Downloads',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: 'uploads',
      label: 'My Uploads',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      key: 'bookmarks',
      label: 'Saved Papers',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsConfig.map((config) => (
        <Card key={config.key} className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {config.label}
                </p>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-9 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats[config.key]?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      all time
                    </p>
                  </>
                )}
              </div>
              <div className={`p-3 rounded-xl ${config.bgColor}`}>
                <div className={config.textColor}>
                  {config.icon}
                </div>
              </div>
            </div>
            
            {/* Gradient accent */}
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${config.color}`}></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
