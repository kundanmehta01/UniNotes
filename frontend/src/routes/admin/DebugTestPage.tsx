import React from 'react';
import UniversityTest from '../../components/debug/UniversityTest';

const DebugTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug Test Page</h1>
        <p className="text-gray-600 mb-8">
          This page is for testing the UniversityTest component and debugging API calls.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <UniversityTest />
        </div>
      </div>
    </div>
  );
};

export default DebugTestPage;
