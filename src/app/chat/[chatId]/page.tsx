import { ChatWindow } from "../../components/chat-window";


export default function ChatPage({ params }: { params: { chatId: string } }) {
  return <ChatWindow chatId={params.chatId} />
}

