import { MigrationInterface, QueryRunner } from 'typeorm';



export class AddUniqueUserFoodToReviews1785524286435 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`

      ALTER TABLE reviews

        ADD UNIQUE INDEX UQ_reviews_user_id_food_id (user_id, food_id);

    `);

  }



  public async down(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`

      ALTER TABLE reviews

        DROP INDEX UQ_reviews_user_id_food_id;

    `);

  }

}