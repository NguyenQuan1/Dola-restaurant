import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export type ChatSessionStatus = 'ai' | 'waiting_staff' | 'staff' | 'closed';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'guest_name', type: 'varchar', length: 100, nullable: true })
  guestName: string | null;

  @Column({ name: 'guest_phone', type: 'varchar', length: 20, nullable: true })
  guestPhone: string | null;

  @Index()
  @Column({ type: 'enum', enum: ['ai', 'waiting_staff', 'staff', 'closed'], default: 'ai' })
  status: ChatSessionStatus;

  @Column({ name: 'assigned_staff_id', type: 'int', nullable: true })
  assignedStaffId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_staff_id' })
  assignedStaff: User | null;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_message_at' })
  lastMessageAt: Date;
}