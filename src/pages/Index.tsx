import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AuthScreen from '@/components/messenger/AuthScreen';
import ChatSidebar from '@/components/messenger/ChatSidebar';
import ChatWindow from '@/components/messenger/ChatWindow';

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

  const handleUpdateProfile = async (username: string, avatarUrl: string) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user_id: currentUser.id,
          username,
          avatar_url: avatarUrl
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({ title: 'Профиль обновлен' });
      }
    } catch (error) {
      toast({ title: 'Ошибка обновления', variant: 'destructive' });
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

  if (!isAuthenticated) {
    return (
      <AuthScreen
        isLogin={isLogin}
        email={email}
        password={password}
        username={username}
        setIsLogin={setIsLogin}
        setEmail={setEmail}
        setPassword={setPassword}
        setUsername={setUsername}
        handleAuth={handleAuth}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ChatSidebar
        currentUser={currentUser!}
        chats={chats}
        selectedChat={selectedChat}
        allUsers={allUsers}
        searchQuery={searchQuery}
        showSearchUsers={showSearchUsers}
        showCreateGroup={showCreateGroup}
        groupName={groupName}
        selectedMembers={selectedMembers}
        setSelectedChat={setSelectedChat}
        setSearchQuery={setSearchQuery}
        setShowSearchUsers={setShowSearchUsers}
        setShowCreateGroup={setShowCreateGroup}
        setGroupName={setGroupName}
        setSelectedMembers={setSelectedMembers}
        createChat={createChat}
        createGroup={createGroup}
        onUpdateProfile={handleUpdateProfile}
        setCurrentUser={setCurrentUser}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatWindow
          selectedChat={selectedChat}
          currentUser={currentUser}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          apiUrl={API_CHATS}
          onUpdate={loadChats}
        />
      </div>
    </div>
  );
}