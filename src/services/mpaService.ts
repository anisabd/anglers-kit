
import { supabase } from "@/integrations/supabase/client";

export interface MarineProtectedArea {
  id: string;
  name: string;
  designation?: string;
  protection_level?: string;
  boundaries?: any;
  area_km2?: number;
  no_take_area_km2?: number;
  implementation_status?: string;
  wdpa_id?: number;
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

    // If no data in viewport, fetch from Protected Planet API
    const response = await fetch(
      `https://api.protectedplanet.net/v3/marine/regions?token=${import.meta.env.VITE_PROTECTED_PLANET_API_KEY}&bbox=${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch MPAs: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.marine_regions || !Array.isArray(data.marine_regions)) {
      console.warn('No MPA regions found in response');
      return [];
    }

    // Process and store MPAs in Supabase
    const processedMPAs = data.marine_regions.map((region: any) => ({
      wdpa_id: region.wdpa_id,
      name: region.name,
      designation: region.designation,
      protection_level: region.iucn_category,
      boundaries: region.geometry,
      area_km2: region.area_km2,
      no_take_area_km2: region.no_take_area,
      implementation_status: region.status
    }));

    if (processedMPAs.length > 0) {
      const { error: upsertError } = await supabase
        .from('marine_protected_areas')
        .upsert(processedMPAs, {
          onConflict: 'wdpa_id',
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
