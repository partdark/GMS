import axios from 'axios';
import { Person, Season, Event, SeasonReport, EventParticipant } from './types';

const API_BASE = 'http://localhost:5024/api';

export const api = {
  // People
  getPeople: (page: number = 1, pageSize: number = 100, sortBy: string = 'gameName', sortDirection: string = 'asc') => {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      pageSize: pageSize.toString(),
      sortBy: sortBy,
      sortDirection: sortDirection
    });
    return axios.get(`${API_BASE}/people?${params}`);
  },
  createPerson: (person: Omit<Person, 'id'>) => axios.post<Person>(`${API_BASE}/people`, person),
  updatePerson: (id: number, person: Person) => axios.put<Person>(`${API_BASE}/people/${id}`, person),
  getPersonReport: (personId: number, seasonId: number, page: number = 1, pageSize: number = 50, sortBy: string = 'dateTime', sortDirection: string = 'desc') => {
    const params = new URLSearchParams({ 
      seasonId: seasonId.toString(), 
      page: page.toString(), 
      pageSize: pageSize.toString(),
      sortBy: sortBy,
      sortDirection: sortDirection
    });
    return axios.get(`${API_BASE}/people/${personId}/report?${params}`);
  },
  
  // Seasons
  getSeasons: (page: number = 1, pageSize: number = 50) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    return axios.get(`${API_BASE}/seasons?${params}`);
  },
  createSeason: (season: Omit<Season, 'id'>) => axios.post<Season>(`${API_BASE}/seasons`, season),
  updateSeason: (id: number, season: Season) => axios.put<Season>(`${API_BASE}/seasons/${id}`, season),
  getSeasonReport: (seasonId: number, paidOnly: boolean = false, page: number = 1, pageSize: number = 50) => {
    const params = new URLSearchParams({ 
      paidOnly: paidOnly.toString(), 
      page: page.toString(), 
      pageSize: pageSize.toString() 
    });
    return axios.get(`${API_BASE}/seasons/${seasonId}/report?${params}`);
  },
  
  // Events
  getEvents: (page: number = 1, pageSize: number = 50, seasonId?: number, sortBy: string = 'dateTime', sortDirection: string = 'desc') => {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      pageSize: pageSize.toString(),
      sortBy: sortBy,
      sortDirection: sortDirection
    });
    if (seasonId) params.append('seasonId', seasonId.toString());
    return axios.get(`${API_BASE}/events?${params}`);
  },
  getEvent: (id: number) => axios.get<Event>(`${API_BASE}/events/${id}`),
  createEvent: (event: Omit<Event, 'id' | 'season'>) => axios.post<Event>(`${API_BASE}/events`, event),
  updateEvent: (id: number, event: Event) => axios.put<Event>(`${API_BASE}/events/${id}`, event),
  deleteEvent: (id: number) => axios.delete(`${API_BASE}/events/${id}`),
  addParticipant: (eventId: number, personId: number, payment?: number) => 
    axios.post(`${API_BASE}/events/${eventId}/participants/${personId}`, { payment }),
  updateParticipantPayment: (eventId: number, personId: number, payment: number) => 
    axios.put(`${API_BASE}/events/${eventId}/participants/${personId}/payment`, { payment }),
  removeParticipant: (eventId: number, personId: number) => 
    axios.delete(`${API_BASE}/events/${eventId}/participants/${personId}`),
  getEventParticipants: (eventId: number) => 
    axios.get<EventParticipant[]>(`${API_BASE}/events/${eventId}/participants`),
};