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
- ✅ Создание сезонов и событий
- ✅ Отчеты по сезонам для всех участников
- ✅ Фильтрация участников с оплатой/без оплаты
- ✅ Управление списком участников событий

### API Endpoints:
- `GET/POST /api/people` - управление участниками
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