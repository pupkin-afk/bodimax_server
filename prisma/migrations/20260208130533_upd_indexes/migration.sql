-- DropIndex
DROP INDEX "FollowShip_followedId_followedToInt_idx";

-- DropIndex
DROP INDEX "FriendShip_user1Id_user2Id_idx";

-- DropIndex
DROP INDEX "Notification_userId_id_kind_idx";

-- CreateIndex
CREATE INDEX "FollowShip_followedId_followedToInt_createdAt_idx" ON "FollowShip"("followedId", "followedToInt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FriendShip_user1Id_user2Id_createdAt_idx" ON "FriendShip"("user1Id", "user2Id", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_id_kind_date_idx" ON "Notification"("userId", "id", "kind", "date" DESC);
