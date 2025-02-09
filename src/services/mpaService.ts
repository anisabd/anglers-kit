
import { supabase } from "@/integrations/supabase/client";

export interface MarineProtectedArea {
  id: string;
  mpatlas_id: number;
  name: string;
  designation?: string;
  protection_level?: 'restricted' | 'safe' | 'endangered' | 'unknown';
  boundaries?: any;
  area_km2?: number;
  no_take_area_km2?: number;
  implementation_status?: string;
}

const MPA_API_BASE_URL = "https://www.mpatlas.org/api/v3";

export const fetchMPAsInViewport = async (bounds: google.maps.LatLngBounds) => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  try {
    const response = await fetch(
      `${MPA_API_BASE_URL}/sites/?format=json&bbox=${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch MPAs');
    }

    const data = await response.json();
    
    // Process and store MPAs in Supabase
    const processedMPAs = data.features.map((feature: any) => {
      // Determine protection level based on feature properties
      let protection_level: 'restricted' | 'safe' | 'endangered' | 'unknown' = 'unknown';
      
      if (feature.properties.protection_level) {
        const level = feature.properties.protection_level.toLowerCase();
        if (level.includes('no take') || level.includes('highly')) {
          protection_level = 'restricted';
        } else if (level.includes('low') || level.includes('minimal')) {
          protection_level = 'endangered';
        } else if (level.includes('moderate') || level.includes('partial')) {
          protection_level = 'safe';
        }
      }

      return {
        mpatlas_id: feature.properties.id,
        name: feature.properties.name,
        designation: feature.properties.designation,
        protection_level,
        boundaries: feature.geometry,
        area_km2: feature.properties.area_km2,
        no_take_area_km2: feature.properties.no_take_area_km2,
        implementation_status: feature.properties.implementation_status
      };
    });

    // Upsert MPAs to Supabase
    const { data: savedMPAs, error } = await supabase
      .from('marine_protected_areas')
      .upsert(processedMPAs, {
        onConflict: 'mpatlas_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Error storing MPAs:', error);
      throw error;
    }

    return savedMPAs as MarineProtectedArea[];
  } catch (error) {
    console.error('Error fetching MPAs:', error);
    throw error;
  }
};
