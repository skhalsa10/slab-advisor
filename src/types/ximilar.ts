export type XimilarApiResponse = {
  records: CardRecord[];
  pricing?: boolean;
  status: Status;
  statistics: Statistics;
};

export type CardRecord = {
  _url: string;
  _status: Status;
  _id: string;
  _width: number;
  _height: number;
  _objects: ObjectItem[];
  _points?: [number, number][];
  corners?: CornerItem[];
  edges?: EdgeItem[];
  card?: GradedCardItem[];
  "Graded Slab"?: GradedSlabItem[];
  grades?: Grades;
  _full_url_card?: string;
  _exact_url_card?: string;
  side?: string;
};

export type Status = {
  code: number;
  text: string;
  request_id: string;
  proc_id?: string;
};

export type Match = {
  set?: string;
  rarity?: string;
  full_name?: string;
  out_of?: string;
  card_number?: string;
  set_series_code?: string;
  set_code?: string;
  series?: string;
  year?: string;
  subcategory?: string;
  links?: string[] | Record<string, string> | null;
};

export type IdentificationData = {
  error?: string;
  best_match?: Match;
  alternatives?: Match[];
};

// Identification API response types
export type XimilarIdentificationResponse = {
  records: IdentificationRecord[];
  status: Status;
  statistics: Statistics;
};

export type IdentificationRecord = {
  _url?: string;
  _base64?: string;
  _status: Status;
  _id: string;
  _width: number;
  _height: number;
  _objects: IdentificationObject[];
};

export type IdentificationObject = {
  name: string;
  id: string;
  bound_box: [number, number, number, number];
  prob: number;
  area?: number;
  "Top Category"?: CategoryItem[];
  _tags?: Tags;
  _tags_simple?: string[];
  _identification?: IdentificationData;
};

// Simplified result for our frontend
export type CardIdentificationResult = {
  success: boolean;
  bestMatch?: {
    ximilarMatch: Match;
    databaseCard?: DatabaseCardMatch;
    confidence: number;
  };
  alternatives?: Array<{
    ximilarMatch: Match;
    databaseCard?: DatabaseCardMatch;
    confidence: number;
  }>;
  capturedImage: string; // base64 of the photo they took
  error?: string;
};

export type DatabaseCardMatch = {
  id: string;
  name: string;
  local_id: string | null;
  image: string | null;
  tcgplayer_image_url: string | null;
  rarity: string | null;
  set_name: string;
  set_id: string;
  price_data: unknown;
  card_type: 'pokemon';
};

export type Tags = {
    Category?: TagItem[];
    Side?: TagItem[];
    Subcategory?: TagItem[];
    "Foil/Holo"?: TagItem[];
    Rotation?: TagItem[];
    Alphabet?: TagItem[];
    Graded?: TagItem[];
    Damaged?: TagItem[];
    Autograph?: TagItem[];
  };

export type ObjectItem = {
  name: string;
  id: string;
  bound_box: [number, number, number, number];
  prob: number;
  area?: number;
  "Top Category"?: CategoryItem[];
  _tags?: Tags;
  _tags_simple?: string[];
  _identification?: IdentificationData;
};

export type CategoryItem = {
  id: string;
  name: string;
  prob: number;
};

export type TagItem = {
  prob: number;
  name: string;
  id: string;
};

export type GradedSlabItem = {
  prob: number;
  name: string;
  id: string;
};

export type CornerItem = {
  name: string;
  bound_box: [number, number, number, number];
  point: [number, number];
  grade: number;
};

export type EdgeItem = {
  name: string;
  polygon: [number, number][];
  grade: number;
};

export type GradedCardItem = {
  name: string;
  polygon: [number, number][];
  bound_box: [number, number, number, number];
  _tags: {
    Category?: TagItem[];
    Damaged?: TagItem[];
    Autograph?: TagItem[];
    Side?: TagItem[];
  };
  surface?: {
    grade: number;
  };
  centering?: {
    "left/right": string;
    "top/bottom": string;
    bound_box: [number, number, number, number];
    pixels: [number, number, number, number];
    offsets: [number, number, number, number];
    grade: number;
  };
};

export type Versions = {
  detection: string;
  points: string;
  corners: string;
  edges: string;
  surface: string;
  centering: string;
  final: string;
};

export type Grades = {
  corners: number;
  edges: number;
  surface: number;
  centering: number;
  final: number;
  condition: string;
};

export type Statistics = {
  "processing time": number;
};
