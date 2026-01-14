@echo off
echo Stopping containers...
docker-compose down

echo Building and starting containers...
docker-compose up --build -d

echo Project restarted with Excel export functionality!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo Swagger: http://localhost:5000/swagger

pause