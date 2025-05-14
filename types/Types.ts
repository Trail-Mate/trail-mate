import { Timestamp } from '@react-native-firebase/firestore';

export interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

export interface Plan {
  id?: string;
  createdAt: Timestamp; // Using Firestore Timestamp instead of number
  imageUrl?: string;
  preferences: {
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    difficultyPreference?: string;
    experienceLevel?: string;
    groupComposition?: {
      adults: number;
      olderKids: number;
      pets: number;
      toddlers: number;
      youngKids: number;
    };
    hikeDuration?: string;
    location?: string;
    mustHaves?: string[];
    radius?: number;
    sceneryPreferences?: string[];
    terrainPreference?: string;
    timeOfDay?: string;
    tripFeatures?: string[];
  };
  summary: string;
  tripIds: string[]; // references to trip documents
  userId: string;
}

export interface Trip {
  id?: string;
  createdAt: Timestamp; // Using Firestore Timestamp
  imageUrl?: string;
  planId: string; // reference to the plan this trip belongs to
  bookmarked?: boolean;
  userId: string;
  name: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  description?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  groupSize?: number;
  difficultyLevel?: string;
  amenities?: string[];
  highlights?: string[];
  parkWebsite?: string;
  cellService?: string;
  parkContact?: string;

  schedule: {
    day: number;
    date: string;
    activities: {
      startTime: string;
      endTime: string;
      activity: string;
    }[];
  }[];

  packingChecklist: {
    item: string;
    checked: boolean;
  }[];
  missions: {
    task: string;
    completed: boolean;
  }[];
  warnings?: string[];
  thingsToKnow?: string[];

  // Add chat history
  chatHistory?: {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Timestamp;
  }[];
}
