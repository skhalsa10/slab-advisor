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

export type ObjectItem = {
  name: string;
  id: string;
  bound_box: [number, number, number, number];
  prob: number;
  area?: number;
  "Top Category"?: CategoryItem[];
  _tags?: {
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
  _tags_simple?: string[];
  _identification?: {
    error?: string;
  };
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
