import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface GroupMember {
  id: number;
  username: string;
  avatar_url?: string;
  role: string;
  can_write: boolean;
}

interface Chat {
  id: number;
  name: string;
  is_group: boolean;
  settings?: {
    members_can_write: boolean;
  };
}

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat | null;
  currentUserId: number;
  apiUrl: string;
  onUpdate: () => void;
}

export default function GroupSettingsDialog({ 
  open, 
  onOpenChange, 
  chat, 
  currentUserId,
  apiUrl,
  onUpdate
}: GroupSettingsDialogProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    if (open && chat) {
      loadMembers();
    }
  }, [open, chat]);

  const loadMembers = async () => {
    if (!chat) return;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_chat_members',
          chat_id: chat.id
        })
      });
      const data = await response.json();
      setMembers(data);
      
      const current = data.find((m: GroupMember) => m.id === currentUserId);
      if (current) setCurrentUserRole(current.role);
    } catch (error) {
      console.error('Failed to load members', error);
    }
  };

  const toggleMemberWrite = async (memberId: number, currentCanWrite: boolean) => {
    if (!chat || currentUserRole !== 'admin') return;
    
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_member_role',
          chat_id: chat.id,
          user_id: currentUserId,
          target_user_id: memberId,
          role: members.find(m => m.id === memberId)?.role || 'member',
          can_write: !currentCanWrite
        })
      });
      
      loadMembers();
      onUpdate();
    } catch (error) {
      console.error('Failed to update member', error);
    }
  };

  const toggleMemberRole = async (memberId: number, currentRole: string) => {
    if (!chat || currentUserRole !== 'admin') return;
    
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_member_role',
          chat_id: chat.id,
          user_id: currentUserId,
          target_user_id: memberId,
          role: newRole,
          can_write: members.find(m => m.id === memberId)?.can_write ?? true
        })
      });
      
      loadMembers();
      onUpdate();
    } catch (error) {
      console.error('Failed to update role', error);
    }
  };

  if (!chat || !chat.is_group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Настройки группы: {chat.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Участники группы</Label>
            <ScrollArea className="h-64 border rounded-md">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                  <Avatar>
                    <AvatarFallback className="bg-indigo-500 text-white">
                      {member.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.username}</p>
                    <p className="text-xs text-gray-500">
                      {member.role === 'admin' ? '👑 Админ' : 'Участник'}
                    </p>
                  </div>
                  
                  {currentUserRole === 'admin' && member.id !== currentUserId && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMemberRole(member.id, member.role)}
                        title={member.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                      >
                        <Icon name="Crown" size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMemberWrite(member.id, member.can_write)}
                        title={member.can_write ? 'Запретить писать' : 'Разрешить писать'}
                      >
                        <Icon name={member.can_write ? "MessageCircle" : "MessageCircleOff"} size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
          
          {currentUserRole !== 'admin' && (
            <p className="text-sm text-gray-500 text-center">
              Только администраторы могут управлять участниками
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
