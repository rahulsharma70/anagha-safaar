import { useState } from "react";
 import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
 import { MessageCircle, X, Send, Plane, Hotel, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { toast } from "sonner";
 
 type Message = {
   role: "user" | "assistant";
   content: string;
 };
 
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-assistant`;
 
 const QUICK_ACTIONS = [
   { icon: Plane, label: "Flights", message: "Help me find flights" },
   { icon: Hotel, label: "Hotels", message: "I need hotel recommendations" },
   { icon: MapPin, label: "Tours", message: "Suggest tour packages" },
 ];

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
   const [messages, setMessages] = useState<Message[]>([
     { role: "assistant", content: "Hi! 👋 I'm Anagha, your travel assistant. How can I help you plan your perfect trip today?" }
   ]);
   const [isLoading, setIsLoading] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
 
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages]);
 
   useEffect(() => {
     if (isOpen && inputRef.current) {
       inputRef.current.focus();
     }
   }, [isOpen]);
 
   const streamChat = async (userMessage: string) => {
     const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
     setMessages(newMessages);
     setIsLoading(true);
     setMessage("");
 
     let assistantContent = "";
 
     try {
       const resp = await fetch(CHAT_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({ messages: newMessages }),
       });
 
       if (!resp.ok) {
         const errorData = await resp.json().catch(() => ({}));
         throw new Error(errorData.error || "Failed to get response");
       }
 
       if (!resp.body) throw new Error("No response body");
 
       const reader = resp.body.getReader();
       const decoder = new TextDecoder();
       let buffer = "";
 
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
 
         buffer += decoder.decode(value, { stream: true });
 
         let newlineIndex: number;
         while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
           let line = buffer.slice(0, newlineIndex);
           buffer = buffer.slice(newlineIndex + 1);
 
           if (line.endsWith("\r")) line = line.slice(0, -1);
           if (line.startsWith(":") || line.trim() === "") continue;
           if (!line.startsWith("data: ")) continue;
 
           const jsonStr = line.slice(6).trim();
           if (jsonStr === "[DONE]") break;
 
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content;
             if (content) {
               assistantContent += content;
               setMessages(prev => {
                 const last = prev[prev.length - 1];
                 if (last?.role === "assistant" && prev.length > newMessages.length) {
                   return prev.map((m, i) => 
                     i === prev.length - 1 ? { ...m, content: assistantContent } : m
                   );
                 }
                 return [...prev, { role: "assistant", content: assistantContent }];
               });
             }
           } catch {
             buffer = line + "\n" + buffer;
             break;
           }
         }
       }
     } catch (error) {
       console.error("Chat error:", error);
       toast.error(error instanceof Error ? error.message : "Failed to send message");
       setMessages(prev => prev.slice(0, -1)); // Remove user message on error
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleSend = () => {
     if (!message.trim() || isLoading) return;
     streamChat(message.trim());
   };
 
   const handleQuickAction = (actionMessage: string) => {
     if (isLoading) return;
     streamChat(actionMessage);
   };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
        {!isOpen && (
             <motion.span 
               className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500"
               animate={{ scale: [1, 1.2, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
             />
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
           className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
           <Card className="shadow-2xl border-primary/20 overflow-hidden">
             <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
                <div className="flex items-center gap-3">
                 <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                   <Plane className="h-6 w-6" />
                  </div>
                  <div>
                   <h3 className="font-semibold text-lg">Anagha AI Assistant</h3>
                   <p className="text-xs opacity-90 flex items-center gap-1.5">
                     <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                     Online • Instant replies
                    </p>
                  </div>
                </div>
              </div>
             
             {/* Quick Actions */}
             <div className="px-4 pt-3 pb-2 border-b border-border/50">
               <div className="flex gap-2">
                 {QUICK_ACTIONS.map((action) => (
                   <button
                     key={action.label}
                     onClick={() => handleQuickAction(action.message)}
                     disabled={isLoading}
                     className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors disabled:opacity-50"
                   >
                     <action.icon className="h-3 w-3" />
                     {action.label}
                   </button>
                 ))}
               </div>
             </div>
 
             <CardContent className="p-0">
               <ScrollArea className="h-72 p-4" ref={scrollRef}>
                 <div className="space-y-4">
                   {messages.map((msg, idx) => (
                     <motion.div
                       key={idx}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                     >
                       <div
                         className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                           msg.role === "user"
                             ? "bg-primary text-primary-foreground rounded-br-md"
                             : "bg-muted text-foreground rounded-bl-md"
                         }`}
                       >
                         <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                       </div>
                     </motion.div>
                   ))}
                   {isLoading && messages[messages.length - 1]?.role === "user" && (
                     <motion.div
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="flex justify-start"
                     >
                       <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
                         <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                       </div>
                     </motion.div>
                   )}
                 </div>
               </ScrollArea>
               
               <div className="p-4 border-t border-border/50 bg-card">
                <div className="flex gap-2">
                  <Input
                     ref={inputRef}
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1"
                     disabled={isLoading}
                  />
                   <Button 
                     size="icon" 
                     className="shrink-0"
                     onClick={handleSend}
                     disabled={!message.trim() || isLoading}
                   >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
               </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveChatWidget;
