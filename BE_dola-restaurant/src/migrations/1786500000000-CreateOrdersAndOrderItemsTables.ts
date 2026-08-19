import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrdersAndOrderItemsTables1786500000000 implements MigrationInterface {
  name = 'CreateOrdersAndOrderItemsTables1786500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tạo bảng orders
    const hasOrders = await queryRunner.hasTable('orders');
    if (!hasOrders) {
      await queryRunner.createTable(
        new Table({
          name: 'orders',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'code',
              type: 'varchar',
              length: '30',
              isUnique: true,
            },
            {
              name: 'table_id',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'user_id',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'customer_name',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'customer_phone',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'type',
              type: 'enum',
              enum: ['dine_in', 'takeaway', 'delivery'],
              default: `'dine_in'`,
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled'],
              default: `'pending'`,
            },
            {
              name: 'payment_status',
              type: 'enum',
              enum: ['unpaid', 'paid', 'refunded'],
              default: `'unpaid'`,
            },
            {
              name: 'payment_method',
              type: 'varchar',
              length: '30',
              isNullable: true,
            },
            {
              name: 'total_amount',
              type: 'decimal',
              precision: 12,
              scale: 2,
              default: 0,
            },
            {
              name: 'note',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              name: 'FK_orders_table',
              columnNames: ['table_id'],
              referencedTableName: 'tables',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
            {
              name: 'FK_orders_user',
              columnNames: ['user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
          ],
        }),
        true,
      );
    }

    // 2. Tạo bảng order_items
    const hasOrderItems = await queryRunner.hasTable('order_items');
    if (!hasOrderItems) {
      await queryRunner.createTable(
        new Table({
          name: 'order_items',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'order_id',
              type: 'int',
            },
            {
              name: 'food_id',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'quantity',
              type: 'int',
              default: 1,
            },
            {
              name: 'price',
              type: 'decimal',
              precision: 12,
              scale: 2,
              default: 0,
            },
            {
              name: 'note',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['pending', 'cooking', 'served', 'cancelled'],
              default: `'pending'`,
            },
            {
              name: 'created_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              name: 'FK_order_items_order',
              columnNames: ['order_id'],
              referencedTableName: 'orders',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              name: 'FK_order_items_food',
              columnNames: ['food_id'],
              referencedTableName: 'foods',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasOrderItems = await queryRunner.hasTable('order_items');
    if (hasOrderItems) {
      await queryRunner.dropTable('order_items');
    }

    const hasOrders = await queryRunner.hasTable('orders');
    if (hasOrders) {
      await queryRunner.dropTable('orders');
    }
  }
}
