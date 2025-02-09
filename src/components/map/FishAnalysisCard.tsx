
import { Card } from "../ui/card";
import { Fish, X } from "lucide-react";
import { FishAnalysis } from "@/types/map";

interface FishAnalysisCardProps {
  fishAnalysis: FishAnalysis;
  onClose: () => void;
}

export const FishAnalysisCard = ({ fishAnalysis, onClose }: FishAnalysisCardProps) => {
  return (
    <Card className="absolute top-20 left-8 p-4 w-80 bg-white/90 backdrop-blur-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-lg">{fishAnalysis.species}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Confidence: {Math.round(fishAnalysis.confidence * 100)}%
        </p>
        <p className="text-sm text-gray-700">{fishAnalysis.description}</p>
      </div>
    </Card>
  );
};
