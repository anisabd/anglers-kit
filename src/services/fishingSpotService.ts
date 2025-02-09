
import { Location } from "@/types/map";
import { supabase } from "@/integrations/supabase/client";

export const analyzeFishingSpot = async (location: Location) => {
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

  return JSON.parse(data.fishAnalysis);
};
