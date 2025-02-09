
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResourceCardProps {
  name: string;
  description: string;
  url: string;
  type: string;
}

export const ResourceCard = ({
  name,
  description,
  url,
  type
}: ResourceCardProps) => {
  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-water-600" />
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{type}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(url, '_blank')}
          >
            Visit <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
