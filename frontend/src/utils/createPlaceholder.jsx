const createPlaceholder = (pageName, description) => {
  return () => (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{pageName}</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{pageName} - Coming Soon</h2>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default createPlaceholder;
