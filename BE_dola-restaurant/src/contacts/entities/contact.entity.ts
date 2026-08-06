import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ length: 150 })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  // tinyint(1) ở DB, TypeORM tự map sang boolean.
  @Column({ name: 'is_resolved', type: 'tinyint', default: 0 })
  isResolved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}