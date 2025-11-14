-- Создание базы данных (выполнить от имени postgres)
CREATE DATABASE gamemanagement;

-- Подключиться к базе gamemanagement и выполнить следующие команды:

-- Создание таблиц (альтернатива миграциям EF Core)
CREATE TABLE IF NOT EXISTS "Seasons" (
    "Id" SERIAL PRIMARY KEY,
    "StartDate" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "People" (
    "Id" SERIAL PRIMARY KEY,
    "GameName" VARCHAR(100) NOT NULL,
    "PhoneNumber" VARCHAR(50),
    "Name" VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Events" (
    "Id" SERIAL PRIMARY KEY,
    "SeasonId" INTEGER NOT NULL REFERENCES "Seasons"("Id"),
    "Payment" DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "EventParticipants" (
    "EventId" INTEGER NOT NULL REFERENCES "Events"("Id"),
    "PersonId" INTEGER NOT NULL REFERENCES "People"("Id"),
    PRIMARY KEY ("EventId", "PersonId")
);

-- Тестовые данные
INSERT INTO "Seasons" ("StartDate") VALUES 
('2024-01-01'),
('2024-06-01');

INSERT INTO "People" ("GameName", "PhoneNumber", "Name") VALUES 
('Player1', '+7-900-123-45-67', 'Иван Иванов'),
('Player2', '+7-900-234-56-78', 'Петр Петров'),
('Player3', '+7-900-345-67-89', 'Сидор Сидоров');

INSERT INTO "Events" ("SeasonId", "Payment") VALUES 
(1, 1000.00),
(1, 1500.00),
(2, 2000.00);

INSERT INTO "EventParticipants" ("EventId", "PersonId") VALUES 
(1, 1),
(1, 2),
(2, 1),
(3, 2),
(3, 3);