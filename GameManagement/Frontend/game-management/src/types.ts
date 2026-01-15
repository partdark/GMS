export interface Person {
  id: number;
  gameName: string;
  phoneNumber?: string;
  name?: string;
  password?: string;
  role: string;
}

export interface Season {
  id: number;
  startDate: string;
  isActive: boolean;
}

export interface Event {
  id: number;
  name: string;
  seasonId: number;
  payment: number;
  dateTime: string;
  season?: Season;
}

export interface EventParticipant {
  id: number;
  name?: string;
  gameName: string;
  phoneNumber?: string;
  payment: number;
}

export interface SeasonReport {
  person: Person;
  eventsCount: number;
  totalPayment: number;
  hasPayment: boolean;
}