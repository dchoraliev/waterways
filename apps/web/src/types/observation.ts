export interface Observation {
  id: string;
  projectName: string;
  journeyStartLocation: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  timestamp: string;
  date: string;
  observation: string;
  observerName: string;
  userId: string;
  photos: string[];
  videos: string[];
  type: string;
  keywords: string[];
}
