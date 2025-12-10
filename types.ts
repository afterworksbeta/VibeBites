export enum CardStatus {
  NEW_VIBE = 'NEW VIBE!',
  SOLVED = 'SOLVED'
}

export interface Friend {
  id: string | number; // Updated to support UUID string or legacy number
  name: string;
  status: CardStatus;
  statusIcon: string; // Emoji or symbol
  time: string;
  color: string;
  avatarSeed: string;
}

export enum MessageType {
  INCOMING_UNSOLVED = 'INCOMING_UNSOLVED',
  INCOMING_SOLVED = 'INCOMING_SOLVED',
  OUTGOING = 'OUTGOING'
}

export interface Message {
  id: string | number;
  sender_id?: string | number;
  receiver_id?: string | number;
  type: MessageType;
  text?: string;
  emojis?: string[];
  topic?: string;
  difficulty?: string;
  points?: number;
  time: string;
  score?: string;
  status?: string; // e.g. "READ"
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_seed: string;
  bg_color: string;
}