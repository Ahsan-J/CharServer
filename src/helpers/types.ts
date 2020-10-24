export interface IChatMessageRecord {
  id?: string;
  senderId?: string;
  receiverId: string;
  message?: string;
  time?: string;
  status?: number;
}

export interface IChatConversationRecord {
  senderId: string;
  receiverId: string;
  message?: string;
  time?: string;
  messageId?: string;
  status?: number;
}

export interface IUserSocketRecord {
  type?: string;
  userId: string;
  socketId?: string;
  status?: number;
  time?: string;
}

export interface IApiResponse<type = any> {
  status: number;
  data: type;
  message: string;
  code: string;
}