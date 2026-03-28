export interface EventType {
  id: string;
  name: string;
  duration: number;
  slug: string;
  description?: string;
  location?: string;
  color: string;
  userId: string;
  order?: number;
  isActive?: boolean;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  enabled: boolean;
  slots: AvailabilitySlot[];
}

export interface Availability {
  userId: string;
  timezone: string;
  days: {
    [key: string]: DayAvailability;
  };
}

export interface Meeting {
  id: string;
  eventTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  inviteeName: string;
  inviteeEmail: string;
  status: 'upcoming' | 'past' | 'cancelled';
  userId: string;
}

export interface SingleUseLink {
  id: string;
  name: string;
  duration: number;
  slug: string;
  expiresAt: string;
  isUsed: boolean;
  userId: string;
}

export interface MeetingPoll {
  id: string;
  name: string;
  duration: number;
  options: {
    date: string;
    startTime: string;
    endTime: string;
    votes: number;
  }[];
  userId: string;
  status: 'open' | 'closed';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
}
