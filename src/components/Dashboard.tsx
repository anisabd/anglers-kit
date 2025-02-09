
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FishingSpotCard } from "./FishingSpotCard";
import { ResourceCard } from "./ResourceCard";
import { ScrollArea } from "./ui/scroll-area";

export const Dashboard = () => {
  const { data: spots, isLoading: spotsLoading } = useQuery({
    queryKey: ['fishing-spots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishing_recommendations')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['fishing-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishing_resources')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fishing Spots Section */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Top Fishing Spots
            </h2>
            <div className="space-y-4">
              {spotsLoading ? (
                <p className="text-gray-600">Loading spots...</p>
              ) : spots?.length === 0 ? (
                <p className="text-gray-600">No fishing spots available</p>
              ) : (
                spots?.map((spot) => (
                  <FishingSpotCard
                    key={spot.id}
                    name={spot.location_name}
                    bestTimeStart={spot.best_time_start}
                    bestTimeEnd={spot.best_time_end}
                    species={spot.fish_species || []}
                    conditions={spot.current_conditions}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Fishing Resources
            </h2>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {resourcesLoading ? (
                  <p className="text-gray-600">Loading resources...</p>
                ) : resources?.length === 0 ? (
                  <p className="text-gray-600">No resources available</p>
                ) : (
                  resources?.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      name={resource.name}
                      description={resource.description || ''}
                      url={resource.url}
                      type={resource.resource_type}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};
