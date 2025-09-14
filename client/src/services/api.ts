import axios, { AxiosInstance } from 'axios';
import { 
  User, 
  Trip, 
  Day, 
  Stop, 
  PackingItem, 
  PackingTemplate, 
  WeatherData, 
  FlightData,
  AuthResponse,
  CreateTripRequest,
  CreateStopRequest,
  AIItineraryRequest
} from '../types';

class ApiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle token refresh and errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await this.api.post('/auth/refresh');
    return response.data;
  }

  // Trip endpoints
  async getTrips(page = 1, limit = 10): Promise<{ trips: Trip[]; pagination: any }> {
    const response = await this.api.get(`/trips?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getTrip(id: string): Promise<{ trip: Trip }> {
    const response = await this.api.get(`/trips/${id}`);
    return response.data;
  }

  async createTrip(data: CreateTripRequest): Promise<{ trip: Trip }> {
    const response = await this.api.post('/trips', data);
    return response.data;
  }

  async updateTrip(id: string, data: Partial<CreateTripRequest>): Promise<{ trip: Trip }> {
    const response = await this.api.put(`/trips/${id}`, data);
    return response.data;
  }

  async deleteTrip(id: string): Promise<void> {
    await this.api.delete(`/trips/${id}`);
  }

  async shareTrip(id: string): Promise<{ shareToken: string; shareUrl: string }> {
    const response = await this.api.post(`/trips/${id}/share`);
    return response.data;
  }

  async unshareTrip(id: string): Promise<void> {
    await this.api.delete(`/trips/${id}/share`);
  }

  // Day endpoints
  async getDaysByTrip(tripId: string): Promise<{ days: Day[] }> {
    const response = await this.api.get(`/days/trip/${tripId}`);
    return response.data;
  }

  async updateDay(id: string, data: { title?: string; notes?: string }): Promise<{ day: Day }> {
    const response = await this.api.put(`/days/${id}`, data);
    return response.data;
  }

  // Stop endpoints
  async getStopsByDay(dayId: string): Promise<{ stops: Stop[] }> {
    const response = await this.api.get(`/stops/day/${dayId}`);
    return response.data;
  }

  async createStop(data: CreateStopRequest): Promise<{ stop: Stop }> {
    const response = await this.api.post('/stops', data);
    return response.data;
  }

  async updateStop(id: string, data: Partial<CreateStopRequest>): Promise<{ stop: Stop }> {
    const response = await this.api.put(`/stops/${id}`, data);
    return response.data;
  }

  async deleteStop(id: string): Promise<void> {
    await this.api.delete(`/stops/${id}`);
  }

  async reorderStops(dayId: string, stopOrders: { id: string; orderIndex: number }[]): Promise<void> {
    await this.api.put(`/stops/day/${dayId}/reorder`, { stopOrders });
  }

  // AI endpoints
  async generateItinerary(data: AIItineraryRequest): Promise<any> {
    const response = await this.api.post('/ai/generate-itinerary', data);
    return response.data;
  }

  async suggestActivities(location: string, activityType?: string, budget?: string): Promise<any> {
    const response = await this.api.post('/ai/suggest-activities', {
      location,
      activityType,
      budget,
    });
    return response.data;
  }

  // Weather endpoints
  async getCurrentWeather(location: string): Promise<{ weather: WeatherData }> {
    const response = await this.api.get(`/weather/current/${encodeURIComponent(location)}`);
    return response.data;
  }

  async getWeatherForecast(location: string, days = 5): Promise<any> {
    const response = await this.api.get(`/weather/forecast/${encodeURIComponent(location)}?days=${days}`);
    return response.data;
  }

  async getWeatherByCoords(lat: number, lon: number): Promise<{ weather: WeatherData }> {
    const response = await this.api.get(`/weather/coords/${lat}/${lon}`);
    return response.data;
  }

  // Flight endpoints
  async getFlightStatus(flightNumber: string): Promise<any> {
    const response = await this.api.get(`/flights/status/${flightNumber}`);
    return response.data;
  }

  async addFlightToTrip(tripId: string, flightData: any): Promise<{ flight: FlightData }> {
    const response = await this.api.post(`/flights/trip/${tripId}`, flightData);
    return response.data;
  }

  async getTripFlights(tripId: string): Promise<{ flights: FlightData[] }> {
    const response = await this.api.get(`/flights/trip/${tripId}`);
    return response.data;
  }

  // Packing endpoints
  async getPackingTemplates(filters?: any): Promise<{ templates: PackingTemplate[] }> {
    const params = new URLSearchParams(filters);
    const response = await this.api.get(`/packing/templates?${params}`);
    return response.data;
  }

  async getTripPackingList(tripId: string): Promise<{ packingList: PackingItem[] }> {
    const response = await this.api.get(`/packing/trips/${tripId}`);
    return response.data;
  }

  async applyTemplateToTrip(tripId: string, templateId: string): Promise<any> {
    const response = await this.api.post(`/packing/trips/${tripId}/apply-template`, { templateId });
    return response.data;
  }

  async addPackingItem(tripId: string, item: Partial<PackingItem>): Promise<{ item: PackingItem }> {
    const response = await this.api.post(`/packing/trips/${tripId}/items`, item);
    return response.data;
  }

  async updatePackingItem(id: string, data: Partial<PackingItem>): Promise<{ item: PackingItem }> {
    const response = await this.api.put(`/packing/items/${id}`, data);
    return response.data;
  }

  async deletePackingItem(id: string): Promise<void> {
    await this.api.delete(`/packing/items/${id}`);
  }

  // Share endpoints (public)
  async getSharedTrip(token: string): Promise<any> {
    const response = await axios.get(`${this.api.defaults.baseURL}/share/${token}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;