import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onUpdateProfile: (username: string, avatarUrl: string) => void;
}

export default function ProfileDialog({ open, onOpenChange, currentUser, onUpdateProfile }: ProfileDialogProps) {
  const [username, setUsername] = useState(currentUser.username);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');

  const handleSave = () => {
    onUpdateProfile(username, avatarUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-blue-500 text-white text-3xl">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div>
            <Label>Имя пользователя</Label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя"
            />
          </div>
          
          <div>
            <Label>URL аватара</Label>
            <Input 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          <div>
            <Label>Email</Label>
            <Input value={currentUser.email} disabled />
          </div>
          
          <Button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600">
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
