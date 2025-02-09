
export interface Location {
  id: string;
  name: string;
  position: google.maps.LatLng;
  photo?: string;
  rating?: number;
  fishSpecies?: Array<{
    name: string;
    description: string;
  }>;
}

export interface FishAnalysis {
  species: string;
  confidence: number;
  description: string;
  conservationStatus: string;
}

export interface WeatherAnalysis {
  weather: string;
  temperature: number;
  fishingConditions: string;
}
