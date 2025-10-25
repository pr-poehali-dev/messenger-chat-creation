import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

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

interface ChatSidebarProps {
  currentUser: User;
  chats: Chat[];
  selectedChat: Chat | null;
  allUsers: User[];
  searchQuery: string;
  showSearchUsers: boolean;
  showCreateGroup: boolean;
  groupName: string;
  selectedMembers: number[];
  setSelectedChat: (chat: Chat) => void;
  setSearchQuery: (value: string) => void;
  setShowSearchUsers: (value: boolean) => void;
  setShowCreateGroup: (value: boolean) => void;
  setGroupName: (value: string) => void;
  setSelectedMembers: (value: number[] | ((prev: number[]) => number[])) => void;
  createChat: (userId: number, username: string) => void;
  createGroup: () => void;
}

export default function ChatSidebar({
  currentUser,
  chats,
  selectedChat,
  allUsers,
  searchQuery,
  showSearchUsers,
  showCreateGroup,
  groupName,
  selectedMembers,
  setSelectedChat,
  setSearchQuery,
  setShowSearchUsers,
  setShowCreateGroup,
  setGroupName,
  setSelectedMembers,
  createChat,
  createGroup
}: ChatSidebarProps) {
  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser?.id && 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarFallback className="bg-blue-500 text-white">
              {currentUser?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{currentUser?.username}</h2>
            <p className="text-xs text-gray-500">В сети</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showSearchUsers} onOpenChange={setShowSearchUsers}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1" size="sm">
                <Icon name="MessageCircle" size={16} className="mr-2" />
                Новый чат
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать чат</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Поиск пользователя</Label>
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Введите имя..."
                  />
                </div>
                <ScrollArea className="h-64 border rounded-md p-2">
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => {
                        createChat(user.id, user.username);
                        setShowSearchUsers(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-indigo-500 text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1" size="sm">
                <Icon name="Users" size={16} className="mr-2" />
                Новая группа
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать группу</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Название группы</Label>
                  <Input 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Введите название"
                  />
                </div>
                <div>
                  <Label>Участники</Label>
                  <ScrollArea className="h-48 border rounded-md p-2">
                    {allUsers.filter(u => u.id !== currentUser?.id).map(user => (
                      <div 
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => {
                          setSelectedMembers(prev => 
                            prev.includes(user.id) 
                              ? prev.filter(id => id !== user.id)
                              : [...prev, user.id]
                          );
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedMembers.includes(user.id)}
                          readOnly
                        />
                        <span>{user.username}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <Button onClick={createGroup} className="w-full">
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="border-b border-gray-200 p-3">
        <h3 className="text-sm font-semibold text-gray-700 px-2">Мои чаты</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedChat?.id === chat.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {chat.is_group ? <Icon name="Users" size={20} /> : chat.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-gray-900 truncate">{chat.name}</p>
                <p className="text-sm text-gray-500 truncate">{chat.last_message || 'Нет сообщений'}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
