-- Проверить все таблицы
SELECT 'People' as table_name, COUNT(*) as count FROM "People"
UNION ALL
SELECT 'Seasons' as table_name, COUNT(*) as count FROM "Seasons"  
UNION ALL
SELECT 'Events' as table_name, COUNT(*) as count FROM "Events"
UNION ALL
SELECT 'EventParticipants' as table_name, COUNT(*) as count FROM "EventParticipants";

-- Проверить структуру таблиц
\d "People"
\d "Seasons"
\d "Events"
\d "EventParticipants"

-- Если данных нет, проверить другие схемы/базы
\l
\dn