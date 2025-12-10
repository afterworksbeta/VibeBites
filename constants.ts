import { Friend, CardStatus, Message, MessageType } from './types';

export const COLORS = {
  RED: '#FF5252',
  YELLOW: '#FFD740',
  PURPLE: '#9C27B0',
  BLUE: '#2196F3',
  PINK: '#FF4081',
  GREEN: '#00E676',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
};

export const MOCK_FRIENDS: Friend[] = [
  {
    id: 1,
    name: 'SARAH C.',
    status: CardStatus.NEW_VIBE,
    statusIcon: '🔥',
    time: '3M',
    color: COLORS.RED,
    avatarSeed: 'sarah_c_pixel_v1',
  },
  {
    id: 2,
    name: 'MIKE R.',
    status: CardStatus.SOLVED,
    statusIcon: '✓',
    time: '15M',
    color: COLORS.YELLOW,
    avatarSeed: 'mike_r_retro_90s',
  },
  {
    id: 3,
    name: 'JEN P.',
    status: CardStatus.NEW_VIBE,
    statusIcon: '🔥',
    time: '1H',
    color: COLORS.PURPLE,
    avatarSeed: 'jen_p_arcade_gamer',
  },
  {
    id: 4,
    name: 'TOM K.',
    status: CardStatus.SOLVED,
    statusIcon: '✓',
    time: '2H',
    color: COLORS.PINK,
    avatarSeed: 'tom_k_monster_pixel',
  },
  {
    id: 5,
    name: 'EMILY L.',
    status: CardStatus.NEW_VIBE,
    statusIcon: '🔥',
    time: '4H',
    color: COLORS.GREEN,
    avatarSeed: 'emily_l_space_cadet',
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 101,
    type: MessageType.INCOMING_UNSOLVED,
    text: "TAP 2 SOLVE!",
    emojis: ["🏃", "🏁", "⏰"],
    time: "10:30",
  },
  {
    id: 102,
    type: MessageType.INCOMING_SOLVED,
    text: "PIZZA PARTY!",
    emojis: ["🍕", "🎉"],
    time: "10:31",
    score: "95%"
  },
  {
    id: 103,
    type: MessageType.OUTGOING,
    emojis: ["😎"],
    time: "10:32",
    status: "READ"
  },
  {
    id: 104,
    type: MessageType.INCOMING_UNSOLVED,
    text: "TAP 2 SOLVE!",
    emojis: ["❓", "🎮", "👾"],
    time: "10:34",
  }
];
