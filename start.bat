@echo off
echo Starting Game Management System...
docker-compose up -d
echo.
echo Services starting...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5024/swagger
echo.
echo Waiting for services to start...
timeout /t 3 /nobreak >nul
echo Opening frontend in browser...
start http://localhost:3000
echo.
echo Press any key to view logs or Ctrl+C to exit
