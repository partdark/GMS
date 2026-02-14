-- Проверить состояние данных
SELECT 'People' as table_name, COUNT(*) as count FROM "People"
UNION ALL
SELECT 'Seasons' as table_name, COUNT(*) as count FROM "Seasons"  
UNION ALL
SELECT 'Events' as table_name, COUNT(*) as count FROM "Events"
UNION ALL
SELECT 'EventParticipants' as table_name, COUNT(*) as count FROM "EventParticipants";

-- Проверить активность пользователей
SELECT "IsActive", COUNT(*) as count FROM "People" GROUP BY "IsActive";

-- Если данные есть, но пользователи неактивны, активировать их:
UPDATE "People" SET "IsActive" = true WHERE "IsActive" = false;