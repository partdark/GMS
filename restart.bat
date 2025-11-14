@echo off
echo Restarting Game Management System...
docker-compose down
docker-compose up --build -d
echo.
echo System restarted!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5024/swagger