
import { useState } from "react";
import { Card } from "./ui/card";
import { Calendar, Info, List, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocationStore } from "@/hooks/useGlobalLocation";

interface FishingRegulations {
  catchLimits: string[];
  seasonDates: string[];
  region: string;
}

export const FishingRegulations = () => {
  const [regulations, setRegulations] = useState<FishingRegulations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegulations, setShowRegulations] = useState(false);
  const { toast } = useToast();
  const { getLocation } = useLocationStore();

  const getRegulations = async () => {
    setIsLoading(true);
    try {
      const location = await getLocation();
      const { data, error } = await supabase.functions.invoke('get-fishing-regulations', {
        body: {
          lat: location.lat,
          lng: location.lng
        }
      });

      if (error) throw error;
      
      setRegulations(data);
      setShowRegulations(true);
      toast({
        title: "Regulations Retrieved",
        description: "Fishing regulations have been loaded for your location.",
      });
    } catch (error) {
      console.error('Error getting regulations:', error);
      toast({
        variant: "destructive",
        title: "Regulations Error",
        description: "Could not retrieve fishing regulations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={getRegulations}
        className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
        disabled={isLoading}
      >
        <Info className="w-6 h-6 text-gray-700" />
      </button>

      {regulations && showRegulations && (
        <Card className={`
          fixed top-1/2 left-1/2 transform -translate-y-1/2 
          p-4 w-80 bg-white/90 backdrop-blur-sm
          animate-[slide-in-right_0.3s_ease-out,fade-in_0.3s_ease-out]
          z-50
        `}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Fishing Regulations</h3>
              </div>
              <button 
                onClick={() => setShowRegulations(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <List className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Catch Limits</h4>
                  <ul className="mt-1 space-y-1">
                    {regulations.catchLimits.map((limit, index) => (
                      <li key={index} className="text-sm text-gray-600">{limit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Fishing Seasons</h4>
                  <ul className="mt-1 space-y-1">
                    {regulations.seasonDates.map((season, index) => (
                      <li key={index} className="text-sm text-gray-600">{season}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Region: {regulations.region}
            </p>
          </div>
        </Card>
      )}
    </>
  );
};
