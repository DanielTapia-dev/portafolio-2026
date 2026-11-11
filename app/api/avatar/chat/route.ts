import {defaultChatDeps, handleChat} from '@/lib/avatar/chat-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = (request: Request) => handleChat(request, defaultChatDeps());
