import { logEvent, setUserId as setAnalyticsUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../firebaseConfig';

// Event names as constants for consistency
export const ANALYTICS_EVENTS = {
  // User authentication events
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  LOGOUT: 'logout',

  // Concert-related events
  CONCERT_LOGGED: 'concert_logged',
  CONCERT_VIEWED: 'concert_viewed',

  // Review and social events
  REVIEW_POSTED: 'review_posted',
  REVIEW_LIKED: 'review_liked',
  COMMENT_POSTED: 'comment_posted',

  // Social features
  USER_FOLLOWED: 'user_followed',
  USER_UNFOLLOWED: 'user_unfollowed',

  // Search and discovery
  SEARCH_PERFORMED: 'search_performed',
  EXPLORE_VIEWED: 'explore_viewed',
  TRENDING_VIEWED: 'trending_viewed',

  // Navigation events
  SCREEN_VIEW: 'screen_view',
  TAB_CHANGED: 'tab_changed',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
} as const;

// Log analytics event
export const logAnalyticsEvent = async (
  eventName: string,
  parameters?: Record<string, any>
): Promise<void> => {
  try {
    if (analytics) {
      await logEvent(analytics, eventName, parameters);
    }
  } catch (error) {
    // Silently fail in development or if analytics is not available
    console.warn('Analytics event logging failed:', error);
  }
};

// Log screen view
export const logScreenView = async (screenName: string): Promise<void> => {
  try {
    await logAnalyticsEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.warn('Screen view logging failed:', error);
  }
};

// Set user properties
export const setUserProperty = async (
  property: string,
  value: string | number | boolean | null
): Promise<void> => {
  try {
    if (analytics) {
      await setUserProperties(analytics, { [property]: value?.toString() || null });
    }
  } catch (error) {
    console.warn('User property setting failed:', error);
  }
};

// Set user ID
export const setUserId = async (userId: string | null): Promise<void> => {
  try {
    if (analytics) {
      await setAnalyticsUserId(analytics, userId);
    }
  } catch (error) {
    console.warn('User ID setting failed:', error);
  }
};

// Predefined analytics functions for common events
export const logUserLogin = async (method: string = 'email') => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.LOGIN, { method });
};

export const logUserSignUp = async (method: string = 'email') => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.SIGN_UP, { method });
};

export const logConcertLogged = async (concertId: string, artistName: string, venueName: string) => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.CONCERT_LOGGED, {
    concert_id: concertId,
    artist_name: artistName,
    venue_name: venueName,
  });
};

export const logReviewPosted = async (concertId: string, rating: number) => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.REVIEW_POSTED, {
    concert_id: concertId,
    rating,
  });
};

export const logReviewLiked = async (reviewId: string) => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.REVIEW_LIKED, {
    review_id: reviewId,
  });
};

export const logCommentPosted = async (reviewId: string) => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.COMMENT_POSTED, {
    review_id: reviewId,
  });
};

export const logSearchPerformed = async (searchTerm: string, resultsCount: number) => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

export const logExploreViewed = async () => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.EXPLORE_VIEWED);
};

export const logErrorOccurred = async (
  errorType: string,
  errorMessage: string,
  screen?: string
) => {
  await logAnalyticsEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
    error_type: errorType,
    error_message: errorMessage,
    screen: screen || 'unknown',
  });
};
