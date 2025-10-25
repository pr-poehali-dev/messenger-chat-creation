import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import GroupSettingsDialog from './GroupSettingsDialog';

interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
}

interface Chat {
  id: number;
  name: string;
  is_group: boolean;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  avatar_url?: string;
}

interface ChatWindowProps {
  selectedChat: Chat | null;
  currentUser: User | null;
  messages: Message[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  sendMessage: () => void;
  apiUrl: string;
  onUpdate: () => void;
}

export default function ChatWindow({
  selectedChat,
  currentUser,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  apiUrl,
  onUpdate
}: ChatWindowProps) {
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Выберите чат для начала общения</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between">
        <div className="flex items-center">
          <Avatar className="mr-3">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
              {selectedChat.is_group ? <Icon name="Users" size={20} /> : selectedChat.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
            <p className="text-xs text-gray-500">
              {selectedChat.is_group ? 'Группа' : 'В сети'}
            </p>
          </div>
        </div>
        
        {selectedChat.is_group && (
          <Button variant="ghost" size="sm" onClick={() => setShowGroupSettings(true)}>
            <Icon name="Settings" size={18} />
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.user_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-md ${msg.user_id === currentUser?.id ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">
                    {msg.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {msg.user_id !== currentUser?.id && (
                    <p className="text-xs text-gray-600 mb-1">{msg.username}</p>
                  )}
                  <div 
                    className={`rounded-2xl px-4 py-2 animate-fade-in ${
                      msg.user_id === currentUser?.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.user_id === currentUser?.id ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Введите сообщение..."
            className="flex-1"
          />
          <Button onClick={sendMessage} className="bg-blue-500 hover:bg-blue-600">
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </div>
      
      <GroupSettingsDialog
        open={showGroupSettings}
        onOpenChange={setShowGroupSettings}
        chat={selectedChat}
        currentUserId={currentUser?.id || 0}
        apiUrl={apiUrl}
        onUpdate={onUpdate}
      />
    </>
  );
}