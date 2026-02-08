/*
  Warnings:

  - The values [LikedPost,LikedComment,CommentedPost,CommentedComment] on the enum `NotifcationKind` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotifcationKind_new" AS ENUM ('NewFollow', 'NewFriend', 'Welcome');
ALTER TABLE "Notification" ALTER COLUMN "kind" TYPE "NotifcationKind_new" USING ("kind"::text::"NotifcationKind_new");
ALTER TYPE "NotifcationKind" RENAME TO "NotifcationKind_old";
ALTER TYPE "NotifcationKind_new" RENAME TO "NotifcationKind";
DROP TYPE "public"."NotifcationKind_old";
COMMIT;
