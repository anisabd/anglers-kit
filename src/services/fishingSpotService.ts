
import { Location } from "@/types/map";
import { supabase } from "@/integrations/supabase/client";

export const analyzeFishingSpot = async (location: Location) => {
  try {
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
      throw new Error('No fish analysis data returned');
    }

    // Parse the fish analysis if it's a string
    const parsedAnalysis = typeof data.fishAnalysis === 'string' 
      ? JSON.parse(data.fishAnalysis) 
      : data.fishAnalysis;

    return parsedAnalysis;
  } catch (error) {
    console.error('Error in analyzeFishingSpot:', error);
    throw error;
  }
};
