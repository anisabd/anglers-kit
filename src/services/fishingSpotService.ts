import { Location } from "@/types/map";
import { supabase } from "@/integrations/supabase/client";

export const analyzeFishingSpot = async (location: Location) => {
  // First try to get existing analysis from database
  const { data: existingSpot, error: fetchError } = await supabase
    .from('fishing_spots')
    .select('fish_analysis')
    .eq('google_place_id', location.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching fishing spot:', fetchError);
    throw new Error('Failed to fetch fishing spot data');
  }

  // If we found existing analysis, return it
  if (existingSpot?.fish_analysis) {
    console.log('Found existing analysis for:', location.name);
    return existingSpot.fish_analysis;
  }

  // Otherwise generate new analysis
  const { data, error } = await supabase.functions.invoke('analyze-fishing-spot', {
    body: {
      location: location.name,
      placeId: location.id
    }
  });

  if (error) {
    console.error('Error analyzing fishing spot:', error);
    throw new Error('Failed to analyze fishing spot');
  }

  return data.fishAnalysis;
};
