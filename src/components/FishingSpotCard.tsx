
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Clock, MapPin } from "lucide-react";

interface FishingSpotCardProps {
  name: string;
  bestTimeStart: string;
  bestTimeEnd: string;
  species: string[];
  conditions: string;
}

export const FishingSpotCard = ({
  name,
  bestTimeStart,
  bestTimeEnd,
  species,
  conditions
}: FishingSpotCardProps) => {
  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-water-600" />
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Best time: {bestTimeStart} - {bestTimeEnd}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Fish className="w-4 h-4 mt-1" />
          <div>
            <p className="font-medium">Species:</p>
            <p>{species.join(", ")}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{conditions}</p>
      </CardContent>
    </Card>
  );
};
