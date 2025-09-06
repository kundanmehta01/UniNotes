import React, { useState } from 'react';
import useTaxonomyStore from '../../stores/taxonomyStore';
import toast from 'react-hot-toast';

const UniversityTest = () => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    website: ''
  });

  const { universities, createUniversity, fetchUniversities } = useTaxonomyStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('UniversityTest: Submitting form with data:', formData);
    console.log('UniversityTest: Current window location before submit:', window.location.href);
    
    try {
      console.log('UniversityTest: Calling createUniversity...');
      const result = await createUniversity(formData);
      console.log('UniversityTest: University created successfully:', result);
      console.log('UniversityTest: Current window location after create:', window.location.href);
      
      // Clear form
      setFormData({
        name: '',
        code: '',
        location: '',
        website: ''
      });
      console.log('UniversityTest: Form cleared');
      
      // Refresh the list
      console.log('UniversityTest: Fetching universities...');
      await fetchUniversities();
      console.log('UniversityTest: Universities fetched');
      console.log('UniversityTest: Final window location:', window.location.href);
    } catch (error) {
      console.error('UniversityTest: Error creating university:', error);
      console.log('UniversityTest: Current window location after error:', window.location.href);
      toast.error('Failed to create university: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">University Test Component</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="University Name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="MIT"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Cambridge, MA"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="https://university.edu"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
        >
          Create University
        </button>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Universities ({universities.length})</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {universities.map((uni) => (
            <div key={uni.id} className="p-2 border border-gray-200 rounded">
              <div className="font-medium">{uni.name}</div>
              <div className="text-sm text-gray-500">
                {uni.code && `Code: ${uni.code}`} {uni.location && `• Location: ${uni.location}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UniversityTest;
