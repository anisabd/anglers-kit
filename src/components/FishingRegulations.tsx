
import { useState } from "react";
import { Card } from "./ui/card";
import { Calendar, Info, List, MessageSquare, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocationStore } from "@/hooks/useGlobalLocation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface FishingRegulations {
  catchLimits: string[];
  seasonDates: string[];
  region: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const FishingRegulations = () => {
  const [regulations, setRegulations] = useState<FishingRegulations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegulations, setShowRegulations] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
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

  const sendMessage = async () => {
    if (!message.trim() || !regulations) return;

    setIsSending(true);
    const userMessage = { role: 'user' as const, content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-fishing-expert', {
        body: {
          message,
          region: regulations.region
        }
      });

      if (error) throw error;

      const assistantMessage = { role: 'assistant' as const, content: data.reply };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Could not send message to fishing expert.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={getRegulations}
        className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        disabled={isLoading}
      >
        <Info className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {regulations && showRegulations && (
        <Card className={`
          fixed top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2
          p-4 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
          animate-[slide-in-right_0.3s_ease-out,fade-in_0.3s_ease-out]
          z-50
        `}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Fishing Regulations</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChat(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  title="Chat with fishing expert"
                >
                  <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </button>
                <button 
                  onClick={() => setShowRegulations(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Fishing Seasons</h4>
                  <ul className="mt-1 space-y-1">
                    {regulations.seasonDates.map((season, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-300">{season}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <List className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Daily Catch Limits</h4>
                  <ul className="mt-1 space-y-1">
                    {regulations.catchLimits.map((limit, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-300">{limit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Region: {regulations.region}
            </p>
          </div>
        </Card>
      )}

      {regulations && showChat && (
        <Card className="fixed bottom-4 right-4 w-80 h-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg z-50">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Chat with Fishing Expert</h3>
              <button 
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t dark:border-gray-700">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about fishing regulations..."
                  className="flex-1 bg-transparent"
                  disabled={isSending}
                />
                <Button 
                  type="submit"
                  size="icon"
                  disabled={isSending || !message.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
