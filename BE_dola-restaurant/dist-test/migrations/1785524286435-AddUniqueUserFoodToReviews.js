"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUniqueUserFoodToReviews1785524286435 = void 0;
class AddUniqueUserFoodToReviews1785524286435 {
    async up(queryRunner) {
        await queryRunner.query(`

      ALTER TABLE reviews

        ADD UNIQUE INDEX UQ_reviews_user_id_food_id (user_id, food_id);

    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`

      ALTER TABLE reviews

        DROP INDEX UQ_reviews_user_id_food_id;

    `);
    }
}
exports.AddUniqueUserFoodToReviews1785524286435 = AddUniqueUserFoodToReviews1785524286435;
//# sourceMappingURL=1785524286435-AddUniqueUserFoodToReviews.js.map