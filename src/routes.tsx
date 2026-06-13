import ChatPage from './pages/ChatPage';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Chat Multimodal',
    path: '/',
    element: <ChatPage />,
    public: true,
  },
];
