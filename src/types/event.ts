export interface IEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    date: string; // ISO string
    created_by: string; // user id
    created_at: string;
    updated_at: string;
}

export type RSVPStatus = 'going' | 'interested' | 'not going';

export interface IRSVP {
    id: string;
    user_id: string;
    event_id: string;
    status: RSVPStatus;
    created_at: string;
}