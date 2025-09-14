import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { db } from '../firebaseConfig';
import { Concert, Artist, Venue, Review, User } from '../types';
import { logConcertLogged } from './analyticsService';
import { showErrorToast } from '../components/Toast';
import { executeWithRetry } from './firebaseConnection';

const functions = getFunctions();

export const findOrCreateArtist = async (artistName: string): Promise<string> => {
  return executeWithRetry(async () => {
    // Check if artist exists
    const q = query(collection(db, 'artists'), where('name', '==', artistName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Artist exists, return the document reference
      return querySnapshot.docs[0].ref.path;
    } else {
      // Artist doesn't exist, create new one
      const artistData = {
        name: artistName,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'artists'), artistData);
      return docRef.path;
    }
  }, 'findOrCreateArtist');
};

export const findOrCreateVenue = async (venueName: string): Promise<string> => {
  return executeWithRetry(async () => {
    // For now, create a basic venue with minimal info
    // In a real app, you'd want to collect more venue details
    const q = query(collection(db, 'venues'), where('name', '==', venueName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Venue exists, return the document reference
      return querySnapshot.docs[0].ref.path;
    } else {
      // Venue doesn't exist, create new one with minimal info
      const venueData = {
        name: venueName,
        city: 'Unknown', // Placeholder
        state: 'Unknown', // Placeholder
        country: 'Unknown', // Placeholder
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'venues'), venueData);
      return docRef.path;
    }
  }, 'findOrCreateVenue');
};

export const logConcert = async (
  userId: string,
  artistName: string,
  venueName: string,
  date: Date,
  rating: number,
  notes?: string
): Promise<string> => {
  return executeWithRetry(async () => {
    // Find or create artist and venue
    const artistRef = await findOrCreateArtist(artistName);
    const venueRef = await findOrCreateVenue(venueName);

    // Create concert document
    const concertData = {
      artistRef,
      venueRef,
      date: Timestamp.fromDate(date),
      userRef: doc(db, 'users', userId).path,
      rating,
      notes: notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const concertDocRef = await addDoc(collection(db, 'concerts'), concertData);

    // Update user's logged concerts count
    await updateDoc(doc(db, 'users', userId), {
      loggedConcertsCount: increment(1),
    });

    // Log analytics event
    await logConcertLogged(concertDocRef.id, artistName, venueName);

    return concertDocRef.id;
  }, 'logConcert');
};

export const getArtistByRef = async (artistRef: string): Promise<Artist | null> => {
  try {
    const artistDoc = await getDoc(doc(db, artistRef));
    if (artistDoc.exists()) {
      return {
        id: artistDoc.id,
        ...artistDoc.data(),
        createdAt: artistDoc.data().createdAt.toDate(),
      } as Artist;
    }
    return null;
  } catch (error) {
    console.error('Error getting artist:', error);
    return null;
  }
};

export const getVenueByRef = async (venueRef: string): Promise<Venue | null> => {
  try {
    const venueDoc = await getDoc(doc(db, venueRef));
    if (venueDoc.exists()) {
      return {
        id: venueDoc.id,
        ...venueDoc.data(),
        createdAt: venueDoc.data().createdAt.toDate(),
      } as Venue;
    }
    return null;
  } catch (error) {
    console.error('Error getting venue:', error);
    return null;
  }
};

export const getUserConcerts = async (userId: string): Promise<Concert[]> => {
  return executeWithRetry(async () => {
    const q = query(
      collection(db, 'concerts'),
      where('userRef', '==', doc(db, 'users', userId).path)
    );
    const querySnapshot = await getDocs(q);

    const concerts: Concert[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      concerts.push({
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Concert);
    });

    // Sort by date (most recent first)
    return concerts.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, 'getUserConcerts');
};

// Get a specific concert by ID
export const getConcertById = async (concertId: string): Promise<Concert | null> => {
  try {
    const concertDoc = await getDoc(doc(db, 'concerts', concertId));
    if (concertDoc.exists()) {
      const data = concertDoc.data();
      return {
        id: concertDoc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Concert;
    }
    return null;
  } catch (error) {
    console.error('Error getting concert:', error);
    throw error;
  }
};

// Submit a review for a concert
export const submitReview = async (
  concertId: string,
  userId: string,
  rating: number,
  text: string
): Promise<string> => {
  try {
    // First, get the concert to copy the rating if it's the user's own concert
    const concert = await getConcertById(concertId);
    if (!concert) {
      throw new Error('Concert not found');
    }

    // Use the concert's rating if it's the user's own concert, otherwise use provided rating
    const reviewRating = concert.userRef.endsWith(userId) ? concert.rating : rating;

    const reviewData = {
      concertRef: doc(db, 'concerts', concertId).path,
      userRef: doc(db, 'users', userId).path,
      text: text.trim(),
      rating: reviewRating,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      likesCount: 0,
      commentsCount: 0,
    };

    const docRef = await addDoc(collection(db, 'reviews'), reviewData);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

// Get all reviews for a concert
export const getConcertReviews = async (concertId: string): Promise<{ reviews: Review[]; usingFallback: boolean }> => {
  return executeWithRetry(async () => {
    try {
      // Try the optimized query with composite index first
      const q = query(
        collection(db, 'reviews'),
        where('concertRef', '==', doc(db, 'concerts', concertId).path),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Review);
      });

      return { reviews, usingFallback: false };
    } catch (error: any) {
      // Handle index building state
      if (error.message?.includes('currently building')) {
        console.warn('⚠️ Firestore composite index is still building. Using fallback query.');

        // Fallback: Get reviews without ordering (sort in memory)
        const fallbackQuery = query(
          collection(db, 'reviews'),
          where('concertRef', '==', doc(db, 'concerts', concertId).path)
        );

        const querySnapshot = await getDocs(fallbackQuery);
        const reviews: Review[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reviews.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as Review);
        });

        // Sort reviews by creation date (newest first) in memory
        reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(`✅ Loaded ${reviews.length} reviews using fallback query (index building)`);
        return { reviews, usingFallback: true };
      }

      // Handle other index-related errors
      if (error.message?.includes('requires an index')) {
        console.warn('⚠️ Firestore index not found. Using unordered fallback query.');

        // Fallback for missing index
        const fallbackQuery = query(
          collection(db, 'reviews'),
          where('concertRef', '==', doc(db, 'concerts', concertId).path)
        );

        const querySnapshot = await getDocs(fallbackQuery);
        const reviews: Review[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reviews.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as Review);
        });

        // Sort in memory since orderBy isn't available
        reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(`✅ Loaded ${reviews.length} reviews using fallback query`);
        return { reviews, usingFallback: true };
      }

      // Re-throw if it's a different error
      throw error;
    }
  }, 'getConcertReviews');
};

// Get user details by reference
export const getUserByRef = async (userRef: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, userRef));
    if (userDoc.exists()) {
      return {
        uid: userDoc.id,
        ...userDoc.data(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Like or unlike a review (using Cloud Function for atomic operations)
export const toggleReviewLike = async (reviewId: string, userId: string) => {
  try {
    const likeReviewFunction = httpsCallable(functions, 'likeReview');
    const result = await likeReviewFunction({ reviewId, userId });
    return result.data;
  } catch (error) {
    console.error('Error toggling review like:', error);
    throw error;
  }
};

// Add a comment to a review (using Cloud Function for atomic operations)
export const addCommentToReview = async (reviewId: string, userId: string, commentText: string) => {
  try {
    const addCommentFunction = httpsCallable(functions, 'addComment');
    const result = await addCommentFunction({ reviewId, userId, commentText });
    return result.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get comments for a review
export const getReviewComments = async (reviewId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'reviews', reviewId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const comments: any[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const user = await getUserByRef(data.userRef);

      comments.push({
        id: docSnap.id,
        ...data,
        user: user,
        createdAt: data.createdAt.toDate(),
      });
    }

    return comments;
  } catch (error) {
    console.error('Error getting review comments:', error);
    throw error;
  }
};

// Check if user has liked a review
export const hasUserLikedReview = async (reviewId: string, userId: string): Promise<boolean> => {
  try {
    const likedByRef = doc(db, 'reviews', reviewId, 'likedBy', userId);
    const likedByDoc = await getDoc(likedByRef);
    return likedByDoc.exists();
  } catch (error) {
    console.error('Error checking if user liked review:', error);
    return false;
  }
};
