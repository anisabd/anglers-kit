
import { Card } from "@/components/ui/card";
import { Fish } from "lucide-react";
import { Location } from "@/types/map";

interface LocationCardProps {
  location: Location;
  fishSpecies?: Location['fishSpecies'];
}

export const LocationCard = ({ location, fishSpecies }: LocationCardProps) => {
  return (
    <Card className="absolute bottom-8 left-8 p-4 w-96 bg-white/90 backdrop-blur-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-water-100">
          <Fish className="w-5 h-5 text-water-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{location.name}</h3>
          {location.rating && (
            <p className="text-sm text-gray-600">Rating: {location.rating} ★</p>
          )}
        </div>
      </div>
      {location.photo && (
        <img
          src={location.photo}
          alt={location.name}
          className="mt-3 w-full h-40 object-cover rounded-lg"
        />
      )}
      <div className="mt-4">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Common Fish Species:</h4>
        {fishSpecies ? (
          <div className="space-y-2">
            {fishSpecies.map((fish, index) => (
              <div key={index} className="p-2 bg-white/80 rounded-lg">
                <p className="font-medium text-water-800">{fish.name}</p>
                <p className="text-sm text-gray-600">{fish.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-water-600"></div>
          </div>
        )}
      </div>
    </Card>
  );
};
