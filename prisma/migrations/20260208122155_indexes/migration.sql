-- DropIndex
DROP INDEX "Post_id_authorId_idx";

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt" DESC);
