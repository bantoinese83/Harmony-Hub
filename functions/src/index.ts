import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// Callable function to like a review (atomic operation)
export const likeReview = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { reviewId, userId } = data;

  if (!reviewId || !userId) {
    throw new functions.https.HttpsError('invalid-argument', 'Review ID and User ID are required');
  }

  // Verify the user ID matches the authenticated user
  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot like reviews for other users');
  }

  const reviewRef = db.collection('reviews').doc(reviewId);
  const likedByRef = reviewRef.collection('likedBy').doc(userId);

  try {
    // Check if user has already liked this review
    const likedByDoc = await likedByRef.get();

    if (likedByDoc.exists) {
      // User has already liked, so unlike (decrement)
      await db.runTransaction(async (transaction) => {
        const reviewDoc = await transaction.get(reviewRef);

        if (!reviewDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Review not found');
        }

        const currentLikes = reviewDoc.data()?.likesCount || 0;
        transaction.update(reviewRef, { likesCount: Math.max(0, currentLikes - 1) });
        transaction.delete(likedByRef);
      });

      return { action: 'unliked', likesCount: await getLikesCount(reviewRef) };
    } else {
      // User hasn't liked, so like (increment)
      await db.runTransaction(async (transaction) => {
        const reviewDoc = await transaction.get(reviewRef);

        if (!reviewDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Review not found');
        }

        const currentLikes = reviewDoc.data()?.likesCount || 0;
        transaction.update(reviewRef, { likesCount: currentLikes + 1 });
        transaction.set(likedByRef, { likedAt: admin.firestore.FieldValue.serverTimestamp() });
      });

      return { action: 'liked', likesCount: await getLikesCount(reviewRef) };
    }
  } catch (error) {
    console.error('Error in likeReview:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process like operation');
  }
});

// Callable function to add a comment (atomic operation)
export const addComment = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { reviewId, userId, commentText } = data;

  if (!reviewId || !userId || !commentText || commentText.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Review ID, User ID, and comment text are required');
  }

  // Verify the user ID matches the authenticated user
  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot comment for other users');
  }

  const reviewRef = db.collection('reviews').doc(reviewId);

  try {
    // Add comment to subcollection and increment comments count atomically
    await db.runTransaction(async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);

      if (!reviewDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Review not found');
      }

      // Add comment to subcollection
      const commentRef = reviewRef.collection('comments').doc();
      transaction.set(commentRef, {
        userRef: db.collection('users').doc(userId).path,
        text: commentText.trim(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Increment comments count on parent review
      const currentComments = reviewDoc.data()?.commentsCount || 0;
      transaction.update(reviewRef, { commentsCount: currentComments + 1 });
    });

    return { success: true };
  } catch (error) {
    console.error('Error in addComment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add comment');
  }
});

// Helper function to get current likes count
async function getLikesCount(reviewRef: admin.firestore.DocumentReference): Promise<number> {
  const reviewDoc = await reviewRef.get();
  return reviewDoc.data()?.likesCount || 0;
}

// API Proxy Functions for third-party integrations

// Search Ticketmaster events
export const searchTicketmasterEvents = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { query } = data;

  if (!query || query.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Search query is required');
  }

  try {
    // Note: In a real implementation, you would:
    // 1. Get your Ticketmaster API key from Firebase config or environment variables
    // 2. Make HTTP request to Ticketmaster API
    // 3. Transform the response data
    // 4. Return formatted results

    // For this demo, we'll return mock data
    const mockResults = [
      {
        id: 'mock_event_1',
        name: `${query} Live Concert`,
        date: new Date().toISOString(),
        venue: 'Mock Venue',
        city: 'Mock City',
        imageUrl: 'https://via.placeholder.com/300x200',
        ticketUrl: 'https://example.com/tickets',
      },
      {
        id: 'mock_event_2',
        name: `${query} Festival`,
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        venue: 'Festival Grounds',
        city: 'Mock City',
        imageUrl: 'https://via.placeholder.com/300x200',
        ticketUrl: 'https://example.com/tickets',
      },
    ];

    return { results: mockResults };
  } catch (error) {
    console.error('Error searching Ticketmaster:', error);
    throw new functions.https.HttpsError('internal', 'Failed to search events');
  }
});

// Search MusicBrainz artists
export const searchMusicbrainzArtists = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { query } = data;

  if (!query || query.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Search query is required');
  }

  try {
    // Note: In a real implementation, you would:
    // 1. Make HTTP request to MusicBrainz API
    // 2. Transform the response data
    // 3. Return formatted artist information

    // For this demo, we'll return mock data
    const mockResults = [
      {
        id: 'mock_artist_1',
        name: query,
        genres: ['Rock', 'Pop'],
        imageUrl: 'https://via.placeholder.com/200x200',
        bio: `Mock biography for ${query}. This artist is known for their amazing performances.`,
      },
      {
        id: 'mock_artist_2',
        name: `${query} Band`,
        genres: ['Alternative', 'Indie'],
        imageUrl: 'https://via.placeholder.com/200x200',
        bio: `Mock biography for ${query} Band. They have been making music since 2010.`,
      },
    ];

    return { results: mockResults };
  } catch (error) {
    console.error('Error searching MusicBrainz:', error);
    throw new functions.https.HttpsError('internal', 'Failed to search artists');
  }
});

// Search Google Places venues
export const searchGooglePlacesVenues = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { query } = data;

  if (!query || query.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Search query is required');
  }

  try {
    // Note: In a real implementation, you would:
    // 1. Get your Google Places API key from Firebase config
    // 2. Make HTTP request to Google Places API
    // 3. Transform the response data
    // 4. Return formatted venue information

    // For this demo, we'll return mock data
    const mockResults = [
      {
        id: 'mock_venue_1',
        name: `${query} Arena`,
        address: '123 Main St, City, State 12345',
        city: 'Mock City',
        state: 'Mock State',
        country: 'USA',
        imageUrl: 'https://via.placeholder.com/300x200',
        rating: 4.5,
        capacity: 15000,
      },
      {
        id: 'mock_venue_2',
        name: `${query} Theater`,
        address: '456 Oak Ave, City, State 12345',
        city: 'Mock City',
        state: 'Mock State',
        country: 'USA',
        imageUrl: 'https://via.placeholder.com/300x200',
        rating: 4.2,
        capacity: 2500,
      },
    ];

    return { results: mockResults };
  } catch (error) {
    console.error('Error searching Google Places:', error);
    throw new functions.https.HttpsError('internal', 'Failed to search venues');
  }
});
