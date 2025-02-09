
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

  if (!data?.fishAnalysis) {
    console.error('No fish analysis data received');
    throw new Error('No fish analysis data received');
  }

  console.log('Generated analysis for:', location.name, data.fishAnalysis);
  return data.fishAnalysis;
};
