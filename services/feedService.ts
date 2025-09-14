import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  collectionGroup,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { executeWithRetry } from './firebaseConnection';

interface FeedItem {
  id: string;
  type: 'concert_logged' | 'review_posted';
  userId: string;
  userDisplayName: string;
  concertId: string;
  concertName: string;
  artistName: string;
  venueName: string;
  reviewId?: string;
  timestamp: Date;
}

// Get users that the current user follows
export const getFollowingUsers = async (userId: string): Promise<string[]> => {
  return executeWithRetry(async () => {
    const followingRef = collection(db, 'users', userId, 'following');
    const querySnapshot = await getDocs(followingRef);

    const followingUserIds: string[] = [];
    querySnapshot.forEach((doc) => {
      followingUserIds.push(doc.id);
    });

    return followingUserIds;
  }, 'getFollowingUsers').catch((error) => {
    console.error('Error getting following users:', error);
    return [];
  });
};

// Get feed activities from followed users
export const getFeedActivities = async (userId: string): Promise<FeedItem[]> => {
  return executeWithRetry(async () => {
    const followingUserIds = await getFollowingUsers(userId);

    if (followingUserIds.length === 0) {
      return [];
    }

    const activities: FeedItem[] = [];

    // Get recent concerts from followed users
    const concertsQuery = query(
      collection(db, 'concerts'),
      where('userRef', 'in', followingUserIds.map(id => doc(db, 'users', id).path)),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const concertsSnapshot = await getDocs(concertsQuery);
    for (const concertDoc of concertsSnapshot.docs) {
      const concertData = concertDoc.data();

      // Get user display name
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('__name__', '==', doc(db, concertData.userRef))
      ));

      let userDisplayName = 'Unknown User';
      if (!userDoc.empty) {
        userDisplayName = userDoc.docs[0].data().displayName || 'Unknown User';
      }

      activities.push({
        id: `concert_${concertDoc.id}`,
        type: 'concert_logged',
        userId: concertData.userRef.split('/').pop() || '',
        userDisplayName,
        concertId: concertDoc.id,
        concertName: `${concertData.artistName} at ${concertData.venueName}`,
        artistName: concertData.artistName || 'Unknown Artist',
        venueName: concertData.venueName || 'Unknown Venue',
        timestamp: concertData.createdAt.toDate(),
      });
    }

    // Get recent reviews from followed users
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('userRef', 'in', followingUserIds.map(id => doc(db, 'users', id).path)),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const reviewsSnapshot = await getDocs(reviewsQuery);
    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data();

      // Get user display name
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('__name__', '==', doc(db, reviewData.userRef))
      ));

      let userDisplayName = 'Unknown User';
      if (!userDoc.empty) {
        userDisplayName = userDoc.docs[0].data().displayName || 'Unknown User';
      }

      // Get concert details
      const concertDoc = await getDocs(query(
        collection(db, 'concerts'),
        where('__name__', '==', doc(db, reviewData.concertRef))
      ));

      let artistName = 'Unknown Artist';
      let venueName = 'Unknown Venue';
      if (!concertDoc.empty) {
        const concertData = concertDoc.docs[0].data();
        artistName = concertData.artistName || 'Unknown Artist';
        venueName = concertData.venueName || 'Unknown Venue';
      }

      activities.push({
        id: `review_${reviewDoc.id}`,
        type: 'review_posted',
        userId: reviewData.userRef.split('/').pop() || '',
        userDisplayName,
        concertId: reviewData.concertRef.split('/').pop() || '',
        concertName: `${artistName} at ${venueName}`,
        artistName,
        venueName,
        reviewId: reviewDoc.id,
        timestamp: reviewData.createdAt.toDate(),
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Return only the most recent 30 activities
    return activities.slice(0, 30);
  }, 'getFeedActivities').catch((error) => {
    console.error('Error getting feed activities:', error);
    return [];
  });
};

// Follow a user
export const followUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  return executeWithRetry(async () => {
    // Add to following subcollection
    await setDoc(doc(db, 'users', currentUserId, 'following', targetUserId), {
      followedAt: new Date(),
    });

    return true;
  }, 'followUser').catch((error) => {
    console.error('Error following user:', error);
    return false;
  });
};

// Unfollow a user
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  return executeWithRetry(async () => {
    // Remove from following subcollection
    await deleteDoc(doc(db, 'users', currentUserId, 'following', targetUserId));

    return true;
  }, 'unfollowUser').catch((error) => {
    console.error('Error unfollowing user:', error);
    return false;
  });
};

// Check if user is following another user
export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  return executeWithRetry(async () => {
    const followingDoc = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
    return followingDoc.exists();
  }, 'isFollowing').catch((error) => {
    console.error('Error checking follow status:', error);
    return false;
  });
};

