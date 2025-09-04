import { model } from "@/models";
import { ChatWindow } from "./components/chat-window";


export default function Home() {
  model();
  return (
    <div className="font-sans items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">      
      <ChatWindow />
    </div>
  );
}
