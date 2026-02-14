-- Обновить всех существующих пользователей как активных
UPDATE "People" SET "IsActive" = true WHERE "IsActive" = false;