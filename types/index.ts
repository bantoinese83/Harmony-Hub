// Firestore Data Model Types

export interface User {
  uid: string;
  email: string;
  displayName: string;
  bio?: string;
  profilePictureUrl?: string;
  loggedConcertsCount: number;
}

export interface Artist {
  id: string;
  name: string;
  genre?: string[];
  imageUrl?: string;
  createdAt: Date;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address?: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface Concert {
  id: string;
  artistRef: string; // DocumentReference path
  venueRef: string; // DocumentReference path
  date: Date;
  userRef: string; // DocumentReference path
  rating: number; // 1-5
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  concertRef: string; // DocumentReference path
  userRef: string; // DocumentReference path
  text: string;
  rating: number; // 1-5, matching concert's rating
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
}

export interface Comment {
  id: string;
  userRef: string; // DocumentReference path
  text: string;
  createdAt: Date;
}

// Form Types
export interface LogConcertFormData {
  artistName: string;
  venueName: string;
  date: Date;
  rating: number;
  notes: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  LogConcert: undefined;
  UserProfile: { userId?: string };
  ConcertDetail: { concertId: string };
};
