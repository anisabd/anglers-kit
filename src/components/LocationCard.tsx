
import { Card } from "@/components/ui/card";
import { Fish, X } from "lucide-react";
import { Location } from "@/types/map";

interface LocationCardProps {
  location: Location;
  fishSpecies?: Location['fishSpecies'];
  onClose: () => void;
}

export const LocationCard = ({ location, fishSpecies, onClose }: LocationCardProps) => {
  const fishArray = Array.isArray(fishSpecies) ? fishSpecies : [];

  return (
    <Card className="absolute bottom-8 left-8 p-4 w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-water-100 dark:bg-water-900">
            <Fish className="w-5 h-5 text-water-600 dark:text-water-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{location.name}</h3>
            {location.rating && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Rating: {location.rating} ★</p>
            )}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      {location.photo && (
        <img
          src={location.photo}
          alt={location.name}
          className="mt-3 w-full h-40 object-cover rounded-lg"
        />
      )}
      <div className="mt-4">
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-200 mb-2">Common Fish Species:</h4>
        {fishSpecies ? (
          <div className="space-y-2">
            {fishArray.map((fish, index) => (
              <div key={index} className="p-2 bg-white/80 dark:bg-gray-700/80 rounded-lg">
                <p className="font-medium text-water-800 dark:text-water-200">{fish.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{fish.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-water-600 dark:border-water-400"></div>
          </div>
        )}
      </div>
    </Card>
  );
};
