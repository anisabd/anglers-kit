
import { Card } from "../ui/card";
import { CloudSun, X } from "lucide-react";
import { WeatherAnalysis } from "@/types/map";

interface WeatherAnalysisCardProps {
  weatherAnalysis: WeatherAnalysis;
  onClose: () => void;
}

export const WeatherAnalysisCard = ({ weatherAnalysis, onClose }: WeatherAnalysisCardProps) => {
  return (
    <Card className="absolute top-20 left-8 p-4 w-80 bg-white/90 backdrop-blur-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-lg">Weather Conditions</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          {weatherAnalysis.weather} • {Math.round(weatherAnalysis.temperature)}°C
        </p>
        <p className="text-sm text-gray-700">{weatherAnalysis.fishingConditions}</p>
      </div>
    </Card>
  );
};
