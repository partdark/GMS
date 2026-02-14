# Система управления игровыми событиями

## Описание
Веб-приложение для управления участниками игровых событий с отчетностью по сезонам.

## Технологии
- **Backend**: ASP.NET Core Web API, Entity Framework Core, PostgreSQL
- **Frontend**: React с TypeScript
- **База данных**: PostgreSQL

## Структура базы данных

### Таблицы:
1. **People** (Люди)
   - Id, GameName, PhoneNumber, Name

2. **Seasons** (Сезоны) 
   - Id, StartDate

3. **Events** (События)
   - Id, SeasonId, Payment

4. **EventParticipants** (Участники событий)
   - EventId, PersonId (связь многие-ко-многим)

## Установка и запуск

### Предварительные требования:
- .NET 8 SDK
- Node.js 18+
- PostgreSQL

### Docker:
1. Запустите контейнеры:
   ```bash
   docker-compose up -d
   ```

2. **Если пропали данные:**
   ```bash
   # Проверить volumes
   docker volume ls
   
   # Подключиться к PostgreSQL
   docker exec -it project-postgres-1 psql -U postgres -d gamemanagement
   ```
   
   В PostgreSQL:
   ```sql
   -- Проверить данные
   SELECT 'People' as table_name, COUNT(*) FROM "People"
   UNION ALL SELECT 'Seasons', COUNT(*) FROM "Seasons"
   UNION ALL SELECT 'Events', COUNT(*) FROM "Events";
   
   -- Если данные есть, активировать пользователей
   UPDATE "People" SET "IsActive" = true;
   
   -- Если данных нет, проверить другие базы
   \l
   ```

3. **Если данные в другом volume:**
   ```bash
   # Остановить контейнеры
   docker-compose down
   
   # Найти старые volumes
   docker volume ls | grep postgres
   
   # Использовать старый volume в docker-compose.yml
   ```

4. Откройте приложение: http://localhost:3000
4. API доступно на: http://localhost:5024

### Backend:
1. Установите PostgreSQL и создайте базу данных `gamemanagement`
2. Обновите строку подключения в `appsettings.json`
3. Выполните миграции:
   ```powershell
   cd GameManagement\Backend\GameManagementAPI
   dotnet ef database update
   ```
4. Запустите API:
   ```powershell
   dotnet run
   ```
5. Откройте Swagger UI: `https://localhost:7101/swagger`

### Frontend:
1. Установите зависимости:
   ```powershell
   cd GameManagement\Frontend\game-management
   npm install
   ```
2. Запустите приложение:
   ```powershell
   npm start
   ```

## Функциональность

### Основные возможности:
- ✅ Добавление новых участников
- ✅ Отключение/активация участников (мягкое удаление)
- ✅ Создание сезонов и событий
- ✅ Отчеты по сезонам для всех участников
- ✅ Фильтрация участников с оплатой/без оплаты
- ✅ Управление списком участников событий
- ✅ Только активные участники отображаются при добавлении в события
- ✅ **Автодополнение при поиске участников** - начните вводить имя или игровое имя участника для быстрого поиска

### API Endpoints:
- `GET/POST /api/people` - управление участниками
- `DELETE /api/people/{id}` - отключение участника (мягкое удаление)
- `POST /api/people/{id}/activate` - активация участника
- `GET /api/events/available-participants` - получение активных участников
- `GET/POST /api/seasons` - управление сезонами
- `GET /api/seasons/{id}/report` - отчеты по сезону
- `GET/POST /api/events` - управление событиями
- `POST/DELETE /api/events/{eventId}/participants/{personId}` - участники событий

## Использование

### Веб-интерфейс:
1. Откройте http://localhost:3000
2. Добавьте участников через форму
3. Создайте сезоны и события
4. Просматривайте отчеты с фильтрацией по оплате

### Swagger API тестирование:
1. Откройте https://localhost:7101/swagger
2. Тестируйте все API endpoints напрямую
3. Просматривайте схемы данных и параметры