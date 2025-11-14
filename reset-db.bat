@echo off
echo Resetting database...
docker-compose down -v
echo Database reset. Starting system...
docker-compose up --build -d
echo.
echo System started with fresh database!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5024/swagger