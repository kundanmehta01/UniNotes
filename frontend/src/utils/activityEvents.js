/**
 * Utility for dispatching activity update events
 * This allows different parts of the app to notify the Recent Activity page
 * when new activities are created
 */

export const dispatchActivityUpdate = (activityType = null, metadata = {}) => {
  console.log('🎯 Dispatching activity update:', { activityType, metadata });
  
  const event = new CustomEvent('activityUpdated', {
    detail: {
      type: activityType,
      metadata,
      timestamp: new Date().toISOString()
    }
  });
  
  window.dispatchEvent(event);
};

/**
 * Common activity types
 */
export const ACTIVITY_TYPES = {
  BOOKMARK: 'bookmark',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  RATING: 'rating'
};
