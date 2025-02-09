
import { CloudSun } from "lucide-react";
import { FishCamera } from "../FishCamera";
import { FishAnalysis } from "@/types/map";

interface MapControlsProps {
  onFishAnalysis: (analysis: FishAnalysis) => void;
  onWeatherClick: () => void;
  isLoadingWeather: boolean;
}

export const MapControls = ({ onFishAnalysis, onWeatherClick, isLoadingWeather }: MapControlsProps) => {
  return (
    <div className="absolute top-20 right-4 flex flex-col gap-2">
      <FishCamera onAnalysisComplete={onFishAnalysis} />
      
      <button
        onClick={onWeatherClick}
        className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
        disabled={isLoadingWeather}
      >
        <CloudSun className="w-6 h-6 text-gray-700" />
      </button>
    </div>
  );
};
