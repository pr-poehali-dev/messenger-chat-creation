import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_AUTH = 'https://functions.poehali.dev/6d45d081-2ee5-442f-8415-38fb021edbc0';
const API_CHATS = 'https://functions.poehali.dev/312f12c2-edd9-47cc-81bf-e80cc80aba7c';

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

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSearchUsers, setShowSearchUsers] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  
  const { toast } = useToast();

  const handleAuth = async () => {
    try {
      const action = isLogin ? 'login' : 'register';
      const body = isLogin 
        ? { action, email, password }
        : { action, email, password, username };
      
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({ title: isLogin ? 'Добро пожаловать!' : 'Регистрация успешна!' });
      } else {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка подключения', variant: 'destructive' });
    }
  };

  const loadChats = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_CHATS}?user_id=${currentUser.id}`);
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`${API_CHATS}?chat_id=${chatId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !currentUser || !newMessage.trim()) return;
    
    try {
      await fetch(API_CHATS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: selectedChat.id,
          user_id: currentUser.id,
          content: newMessage
        })
      });
      
      setNewMessage('');
      loadMessages(selectedChat.id);
      loadChats();
    } catch (error) {
      toast({ title: 'Ошибка отправки', variant: 'destructive' });
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(API_AUTH);
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error('Failed to load users', error);
    }
  };

  const createChat = async (targetUserId: number, targetUsername: string) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(API_CHATS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_chat',
          name: targetUsername,
          is_group: false,
          members: [currentUser.id, targetUserId]
        })
      });
      
      if (response.ok) {
        toast({ title: 'Чат создан' });
        loadChats();
      }
    } catch (error) {
      toast({ title: 'Ошибка создания чата', variant: 'destructive' });
    }
  };

  const createGroup = async () => {
    if (!currentUser || !groupName.trim() || selectedMembers.length === 0) return;
    
    try {
      const response = await fetch(API_CHATS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_chat',
          name: groupName,
          is_group: true,
          members: [currentUser.id, ...selectedMembers]
        })
      });
      
      if (response.ok) {
        toast({ title: 'Группа создана' });
        setShowCreateGroup(false);
        setGroupName('');
        setSelectedMembers([]);
        loadChats();
      }
    } catch (error) {
      toast({ title: 'Ошибка создания группы', variant: 'destructive' });
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadChats();
      loadAllUsers();
      const interval = setInterval(() => {
        loadChats();
        if (selectedChat) loadMessages(selectedChat.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser?.id && 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
              <Icon name="MessageCircle" size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messenger</h1>
            <p className="text-gray-600">Общайтесь с друзьями и коллегами</p>
          </div>
          
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <Label>Имя пользователя</Label>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя"
                />
              </div>
            )}
            
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
              />
            </div>
            
            <div>
              <Label>Пароль</Label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <Button onClick={handleAuth} className="w-full bg-blue-500 hover:bg-blue-600">
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
      
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Выберите чат для начала общения</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}