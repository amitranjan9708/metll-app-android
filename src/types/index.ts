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
  location: string;
  city: string;
  state: string;
  class?: string;
  section?: string;
}

export interface CollegeDetails {
  name: string;
  department: string;
  location: string;
}

export interface OfficeDetails {
  name: string;
  location: string;
  department: string;
  designation: string;
}

export interface LocationDetails {
  current?: {
    address: string;
    city: string;
    state: string;
  };
  past?: {
    address: string;
    city: string;
    state: string;
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

