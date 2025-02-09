
import { supabase } from "@/integrations/supabase/client";

export interface MarineProtectedArea {
  id: string;
  mpatlas_id: number;
  name: string;
  designation?: string;
  protection_level?: string;
  boundaries?: any;
  area_km2?: number;
  no_take_area_km2?: number;
  implementation_status?: string;
}

export const fetchMPAsInViewport = async (bounds: google.maps.LatLngBounds) => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  try {
    // First try to fetch from Supabase within the viewport bounds
    const { data: existingMPAs, error: fetchError } = await supabase
      .from('marine_protected_areas')
      .select('*')
      .or(`boundaries->coordinates->0->0->1.gte.${sw.lat()},boundaries->coordinates->0->0->1.lte.${ne.lat()}`)
      .or(`boundaries->coordinates->0->0->0.gte.${sw.lng()},boundaries->coordinates->0->0->0.lte.${ne.lng()}`);

    if (fetchError) {
      console.error('Error fetching MPAs from database:', fetchError);
      return [];
    }

    if (existingMPAs && existingMPAs.length > 0) {
      return existingMPAs as MarineProtectedArea[];
    }

    // If no data in viewport, fetch from API
    const response = await fetch(
      `https://www.mpatlas.org/api/v3/sites/?format=json&bbox=${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MPAs: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('No MPA features found in response');
      return [];
    }

    // Process and store MPAs in Supabase
    const processedMPAs = data.features.map((feature: any) => ({
      mpatlas_id: feature.properties.id,
      name: feature.properties.name,
      designation: feature.properties.designation,
      protection_level: feature.properties.protection_level,
      boundaries: feature.geometry,
      area_km2: feature.properties.area_km2,
      no_take_area_km2: feature.properties.no_take_area_km2,
      implementation_status: feature.properties.implementation_status
    }));

    if (processedMPAs.length > 0) {
      const { error: upsertError } = await supabase
        .from('marine_protected_areas')
        .upsert(processedMPAs, {
          onConflict: 'mpatlas_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error storing MPAs:', upsertError);
      }
    }

    return processedMPAs as MarineProtectedArea[];
  } catch (error) {
    console.error('Error fetching MPAs:', error);
    return [];
  }
};
