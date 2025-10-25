import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface AuthScreenProps {
  isLogin: boolean;
  email: string;
  password: string;
  username: string;
  setIsLogin: (value: boolean) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
  handleAuth: () => void;
}

export default function AuthScreen({
  isLogin,
  email,
  password,
  username,
  setIsLogin,
  setEmail,
  setPassword,
  setUsername,
  handleAuth
}: AuthScreenProps) {
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
