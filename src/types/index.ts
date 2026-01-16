export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  additionalPhotos?: string[];
  verificationVideo?: string;
  school?: SchoolDetails;
  college?: CollegeDetails;
  office?: OfficeDetails;
  homeLocation?: LocationDetails;
  situationResponses?: SituationResponse[];
  isOnboarded?: boolean; // Local flag to track onboarding completion
  referralCode?: string;
  totalReferrals?: number;
  rewardsEarned?: number;
  rewardsUsed?: number;
  createdAt: string;
}

export type SituationCategory = 'Dating' | 'Social' | 'Adventure' | 'Life' | 'Entertainment' | 'Ethics';

export interface SituationQuestion {
  id: number;
  category: SituationCategory;
  emoji: string;
  question: string;
  placeholder: string;
}

export interface SituationResponse {
  questionId: number;
  answer: string;
  answeredAt: string;
}

export interface SchoolDetails {
  name: string;
  location?: string;
  city: string;
  state?: string;
  class?: string;
  section?: string;
}

export interface CollegeDetails {
  name: string;
  department?: string;
  location?: string;
}

export interface OfficeDetails {
  name: string;
  location?: string;
  department?: string;
  designation: string;
}

export interface LocationDetails {
  current?: {
    address?: string;
    city?: string;
    state?: string;
  };
  past?: {
    address?: string;
    city?: string;
    state?: string;
  };
}

export interface Confession {
  id: string;
  userId: string;
  type: 'school' | 'college' | 'office' | 'home';
  crushDetails: CrushDetails;
  selectedCrushId?: string;
  status: 'pending' | 'matched';
  createdAt: string;
}

export interface CrushDetails {
  school?: Partial<SchoolDetails>;
  college?: Partial<CollegeDetails>;
  office?: Partial<OfficeDetails>;
  home?: {
    location: string;
    city: string;
    state: string;
  };
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  confession1Id: string;
  confession2Id: string;
  matchedAt: string;
}

// ==========================================
// Swipe & Match Types
// ==========================================

export interface Profile {
  id: number;
  name: string;
  bio?: string;
  age?: number;
  gender?: string;
  images: string[];
  profilePhoto?: string;
  additionalPhotos?: string[];
  isVerified: boolean;
  latitude?: number;
  longitude?: number;
  distance?: string;
  situationResponses?: SituationResponse[];
}

export interface MatchedUser {
  id: number;
  name: string;
  images: string[];
  profilePhoto?: string;
  bio?: string;
  age?: number;
  isVerified: boolean;
}

export interface MatchData {
  id: number;
  matchedUser: MatchedUser;
  matchedAt: string;
  chatRoomId?: number;
  lastMessage?: Message;
  unreadCount?: number;
  // Sponsored Coffee Date
  coffeeTicket?: boolean;
  coffeeTicketCafe?: string;
  coffeeTicketExpiry?: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName?: string;
  content: string | null;
  type?: 'text' | 'image' | 'video' | 'voice_note' | 'gif';
  mediaUrl?: string;

  // Voice Note properties
  duration?: number;       // Duration in seconds
  transcript?: string;     // Optional transcription
  waveformData?: number[]; // Waveform amplitudes for visualization

  // GIF properties
  gifId?: string;          // Giphy GIF ID
  gifWidth?: number;       // GIF width
  gifHeight?: number;      // GIF height

  createdAt: string;
  isRead: boolean;
  isOwn?: boolean;
}

export interface ChatRoom {
  id: number;
  matchId: number;
  messages: Message[];
}

export interface SwipeResponse {
  success: boolean;
  message: string;
  data: {
    direction: 'like' | 'pass';
    isMatch: boolean;
    match?: {
      id: number;
      matchedUser: MatchedUser;
      matchedAt: string;
      chatRoomId?: number;
    };
  };
}

// ==========================================
// Call Types
// ==========================================

export interface Call {
  id: number;
  chatRoomId: number;
  callerId: number;
  receiverId: number;
  channelName: string;
  status: 'pending' | 'active' | 'ended' | 'missed';
  type: 'voice' | 'video';
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  createdAt: string;
}

export interface CallInitiateResponse {
  callId: number;
  channelName: string;
  token: string;
  appId: string;
  receiver: {
    id: number;
    name: string;
    photo?: string;
  };
}

export interface IncomingCallData {
  callId: number;
  channelName: string;
  callerId: number;
  callerName: string;
  callerPhoto?: string;
  type: 'voice' | 'video';
  token: string;
  appId: string;
}

// ==========================================
// AI Host Types
// ==========================================

export interface ChatHostSession {
  id: number;
  chatRoomId: number;
  matchId: number;
  status: 'pending' | 'active' | 'completed' | 'declined' | 'exited';
  currentStage?: string;
  user1OptIn: boolean;
  user2OptIn: boolean;
  stageData?: any;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatHostMessage[];
  currentUserId?: number;
  isUser1?: boolean;
}

export interface ChatHostMessage {
  id: number;
  sessionId: number;
  senderType: 'host' | 'user1' | 'user2';
  senderId?: number;
  content: string;
  messageType: 'text' | 'question' | 'button' | 'game_prompt';
  metadata?: {
    stage?: string;
    question?: string;
    questionType?: string;
    options?: string[];
    gameType?: string;
    isHandoff?: boolean;
    [key: string]: any;
  };
  createdAt: string;
}

// ==========================================
// GIF Types
// ==========================================

export interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  originalUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
}

// ==========================================
// Voice Note Types
// ==========================================

export interface VoiceNoteUploadResult {
  url: string;
  duration: number;
  publicId: string;
  waveformData?: number[];
  type: 'voice_note';
}
