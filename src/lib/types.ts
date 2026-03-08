export interface Profile {
  id: string;
  name: string | null;
  bio: string | null;
  year: string | null;
  department: string | null;
  phone: string | null;
  profile_image: string | null;
  plan: string | null;
  role: string | null;
  created_at: string | null;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string | null;
}

export interface POTW {
  id: string;
  image_url: string;
  title: string | null;
  photographer: string | null;
  description: string | null;
  week_date: string | null;
  created_at: string | null;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  location: string | null;
  event_date: string | null;
  created_at: string | null;
}

export interface Magazine {
  id: string;
  title: string | null;
  issue: string | null;
  cover_image: string | null;
  pdf_url: string | null;
  published_at: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  pdf_url: string | null;
  author: string | null;
  created_at: string | null;
}
