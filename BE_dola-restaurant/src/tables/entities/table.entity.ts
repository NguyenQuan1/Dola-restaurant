import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

export type TableStatus = 'available' | 'reserved' | 'occupied';
export type TableShape = 'rect' | 'circle';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  code: string;

  @Column({ type: 'int' })
  floor: number;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'varchar', length: 20, default: 'rect' })
  shape: TableShape;

  @Column({ type: 'int', nullable: true })
  x: number | null;

  @Column({ type: 'int', nullable: true })
  y: number | null;

  @Column({ type: 'int', nullable: true })
  col: number | null;

  @Column({ type: 'int', nullable: true })
  row: number | null;

  @Column({ name: 'col_span', type: 'int', default: 1 })
  colSpan: number;

  @Column({
    type: 'enum',
    enum: ['available', 'reserved', 'occupied'],
    default: 'available',
  })
  status: TableStatus;

  @Column({ name: 'current_reservation_id', type: 'int', nullable: true })
  currentReservationId: number | null;

  @ManyToOne(() => Reservation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_reservation_id' })
  currentReservation: Reservation | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
