import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, Index,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

export type ChatSenderType = 'customer' | 'ai' | 'staff';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @Column({ name: 'sender_type', type: 'enum', enum: ['customer', 'ai', 'staff'] })
  senderType: ChatSenderType;

  @Column({ name: 'sender_id', type: 'int', nullable: true })
  senderId: number | null;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}