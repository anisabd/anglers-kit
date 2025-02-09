
import { Location } from "@/types/map";
import { supabase } from "@/integrations/supabase/client";

export const analyzeFishingSpot = async (location: Location) => {
  const response = await fetch('/api/analyze-fishing-spot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      location: location.name,
      placeId: location.id
    })
  });

  if (!response.ok) {
    throw new Error('Failed to analyze fishing spot');
  }

  const data = await response.json();
  return JSON.parse(data.fishAnalysis);
};
