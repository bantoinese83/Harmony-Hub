import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  startAfter,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { db } from '../firebaseConfig';
import { Concert, Artist, Venue } from '../types';

const functions = getFunctions();

// Debounce utility function
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Search for concerts in Firestore
export const searchConcerts = async (searchTerm: string): Promise<Concert[]> => {
  try {
    const concertsRef = collection(db, 'concerts');
    const q = query(
      concertsRef,
      where('artistName', '>=', searchTerm),
      where('artistName', '<=', searchTerm + '\uf8ff'),
      orderBy('artistName'),
      limit(10)
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

    // Also search venue names
    const venueQ = query(
      concertsRef,
      where('venueName', '>=', searchTerm),
      where('venueName', '<=', searchTerm + '\uf8ff'),
      orderBy('venueName'),
      limit(10)
    );

    const venueSnapshot = await getDocs(venueQ);
    venueSnapshot.forEach((doc) => {
      const data = doc.data();
      const concert = {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Concert;

      // Avoid duplicates
      if (!concerts.find(c => c.id === concert.id)) {
        concerts.push(concert);
      }
    });

    return concerts.slice(0, 10); // Limit to 10 total results
  } catch (error) {
    console.error('Error searching concerts:', error);
    return [];
  }
};

// Search for artists in Firestore
export const searchArtists = async (searchTerm: string): Promise<Artist[]> => {
  try {
    const artistsRef = collection(db, 'artists');
    const q = query(
      artistsRef,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const artists: Artist[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      artists.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Artist);
    });

    return artists;
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
};

// Search for venues in Firestore
export const searchVenues = async (searchTerm: string): Promise<Venue[]> => {
  try {
    const venuesRef = collection(db, 'venues');
    const q = query(
      venuesRef,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const venues: Venue[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      venues.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Venue);
    });

    // Also search by city
    const cityQ = query(
      venuesRef,
      where('city', '>=', searchTerm),
      where('city', '<=', searchTerm + '\uf8ff'),
      orderBy('city'),
      limit(10)
    );

    const citySnapshot = await getDocs(cityQ);
    citySnapshot.forEach((doc) => {
      const data = doc.data();
      const venue = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Venue;

      // Avoid duplicates
      if (!venues.find(v => v.id === venue.id)) {
        venues.push(venue);
      }
    });

    return venues.slice(0, 10); // Limit to 10 total results
  } catch (error) {
    console.error('Error searching venues:', error);
    return [];
  }
};

// Get trending concerts (most recently logged)
export const getTrendingConcerts = async (): Promise<Concert[]> => {
  try {
    const concertsRef = collection(db, 'concerts');
    const q = query(
      concertsRef,
      orderBy('createdAt', 'desc'),
      limit(5)
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

    return concerts;
  } catch (error) {
    console.error('Error getting trending concerts:', error);
    return [];
  }
};

// Get popular artists (by number of logged concerts)
export const getPopularArtists = async (): Promise<Artist[]> => {
  try {
    // This is a simplified approach - in a real app, you'd aggregate ratings
    const artistsRef = collection(db, 'artists');
    const q = query(
      artistsRef,
      orderBy('createdAt', 'desc'), // Most recently added artists
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    const artists: Artist[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      artists.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Artist);
    });

    return artists;
  } catch (error) {
    console.error('Error getting popular artists:', error);
    return [];
  }
};

// Search external APIs using Cloud Functions
export const searchExternalAPIs = async (searchTerm: string, type: 'events' | 'artists' | 'venues') => {
  try {
    let functionName = '';
    switch (type) {
      case 'events':
        functionName = 'searchTicketmasterEvents';
        break;
      case 'artists':
        functionName = 'searchMusicbrainzArtists';
        break;
      case 'venues':
        functionName = 'searchGooglePlacesVenues';
        break;
    }

    if (functionName) {
      const searchFunction = httpsCallable(functions, functionName);
      const result = await searchFunction({ query: searchTerm });
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Error searching external APIs:', error);
    return [];
  }
};
