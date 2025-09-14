export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency: string;
  isPublic: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
  days?: Day[];
}

export interface Day {
  id: string;
  tripId: string;
  date: string;
  title?: string;
  notes?: string;
  dayNumber: number;
  stops?: Stop[];
}

export interface Stop {
  id: string;
  dayId: string;
  title: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  stopType: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'shopping' | 'other';
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  cost?: number;
  notes?: string;
  orderIndex: number;
}

export interface PackingItem {
  id: string;
  templateId?: string;
  tripId?: string;
  name: string;
  category?: string;
  quantity: number;
  isEssential: boolean;
  isPacked: boolean;
  notes?: string;
}

export interface PackingTemplate {
  id: string;
  name: string;
  description?: string;
  tripType?: string;
  climate?: string;
  durationDays?: number;
  isPublic: boolean;
  createdBy?: string;
  items?: PackingItem[];
}

export interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  coordinates: {
    lat: number;
    lon: number;
  };
  timestamp: string;
}

export interface FlightData {
  id: string;
  tripId: string;
  flightNumber: string;
  airline?: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture?: string;
  actualDeparture?: string;
  scheduledArrival?: string;
  actualArrival?: string;
  status?: string;
  gate?: string;
  terminal?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateTripRequest {
  title: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
}

export interface CreateStopRequest {
  dayId: string;
  title: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  stopType?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  cost?: number;
  notes?: string;
}

export interface AIItineraryRequest {
  destination: string;
  duration: number;
  budget?: number;
  interests?: string[];
  travelStyle?: string;
  groupSize?: number;
}