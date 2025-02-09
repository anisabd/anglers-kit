import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FishAnalysis } from "@/types/map";

// Note: In a production environment, this should be handled securely
const GOOGLE_CLOUD_API_KEY = "AIzaSyDZJ55KH2ooldWSmVzNPb52Cx_YqXhiZTo";
const OPENAI_API_KEY = "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";

export const FishCamera = ({ onAnalysisComplete }: { onAnalysisComplete: (analysis: FishAnalysis) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setShowCamera(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      if (videoRef.current.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      videoRef.current.srcObject = stream;

      await new Promise((resolve, reject) => {
        if (!videoRef.current) return reject("Video element not found");
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            toast({
              title: "Camera started",
              description: "Your camera is now active",
            });
            resolve(true);
          } catch (err) {
            console.error("Error playing video:", err);
            toast({
              variant: "destructive",
              title: "Playback Error",
              description: "Could not start video playback. Please try again.",
            });
            reject(err);
          }
        };
      });
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
      });
      setShowCamera(false);
      
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(videoRef.current, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      toast({
        title: "Processing",
        description: "Analyzing image with Google Cloud Vision...",
      });

      const base64Image = imageDataUrl.split(',')[1];
      
      if (!base64Image) {
        throw new Error("Failed to process image data");
      }

      const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_API_KEY}`;
      const visionResponse = await fetch(visionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
              { type: 'LABEL_DETECTION', maxResults: 10 }
            ]
          }]
        })
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        throw new Error(`Google Vision API error (${visionResponse.status}): ${errorText}`);
      }

      const visionData = await visionResponse.json();
      const detectedObjects = visionData.responses?.[0]?.localizedObjectAnnotations;
      const labels = visionData.responses?.[0]?.labelAnnotations;

      if (!detectedObjects || detectedObjects.length === 0) {
        throw new Error("No objects detected in the image");
      }

      const fishObjects = detectedObjects.filter((obj: any) => 
        obj.name.toLowerCase().includes('fish') || 
        obj.name.toLowerCase().includes('marine') ||
        obj.name.toLowerCase().includes('aquatic')
      );

      if (fishObjects.length === 0) {
        throw new Error("No fish detected in the image");
      }

      const highestConfidenceFish = fishObjects[0];
      const relevantLabels = labels
        ?.filter((label: any) => 
          label.description.toLowerCase().includes('fish') ||
          label.description.toLowerCase().includes('marine') ||
          label.description.toLowerCase().includes('aquatic')
        )
        .map((label: any) => label.description)
        .join(', ');

      const prompt = `Based on the detected fish (${highestConfidenceFish.name}) and these visual labels: ${relevantLabels}, 
      analyze the fish and return a JSON object in the following exact format without any additional text or formatting:
      {
        "species": "Common name of the fish species",
        "description": "2-3 sentences about habitat and behavior",
        "conservationStatus": "Conservation status (e.g. Least Concern, Near Threatened, etc.)"
      }`;

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: "You are a marine biology expert. Respond only with valid JSON matching the exact format specified, with no additional text."
          }, {
            role: "user",
            content: prompt
          }]
        })
      });

      if (!openAIResponse.ok) {
        throw new Error("Failed to analyze fish species");
      }

      const openAIData = await openAIResponse.json();
      const jsonResponse = openAIData.choices[0].message.content.trim();
      console.log('OpenAI response:', jsonResponse); // Add this for debugging
      const analysisResult = JSON.parse(jsonResponse);
      
      const analysis: FishAnalysis = {
        species: analysisResult.species,
        confidence: highestConfidenceFish.score,
        description: analysisResult.description,
        conservationStatus: analysisResult.conservationStatus
      };

      onAnalysisComplete(analysis);

      toast({
        title: "Analysis Complete",
        description: `Identified ${analysis.species} with ${Math.round(highestConfidenceFish.score * 100)}% confidence`,
      });

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      console.error('Error details:', error.message); // Add this for debugging
      
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: error.message || "Failed to analyze the image. Please try again.",
      });

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    }
  };

  return (
    <>
      <button
        onClick={startCamera}
        className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Camera className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {showCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="relative w-full h-[480px] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => {
                  if (videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                  }
                  setShowCamera(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={captureAndAnalyze}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Capture & Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
