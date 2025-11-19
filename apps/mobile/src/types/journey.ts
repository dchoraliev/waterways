// types/journey.ts
import { Observation } from '../components/ObservationCard'; // Assuming path to Observation type

/**
 * Defines the structure of a Journey (Trip) stored locally as a draft.
 */
export interface Journey {
  id: string;
  createdAt: number;
  status: 'draft' | 'submitted';
  observations: Observation[];
  projectId: string | null; 
}