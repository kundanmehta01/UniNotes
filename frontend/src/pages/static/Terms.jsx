import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a placeholder component that redirects to the comprehensive Terms of Service
const Terms = () => {
  return <Navigate to="/terms-of-service" replace />;
};

export default Terms;
