@echo off
title MudurPro Launcher
cls

:menu
echo ===================================================
echo             MudurPro Launcher
echo ===================================================
echo.
echo Please select run mode:
echo.
echo [1] Full Docker Mode (All services in Docker)
echo [2] Local Dev Mode (DB in Docker, App/Web Local)
echo [3] Start DB Only (Docker)
echo [4] Seed Database (Creates default admin user)
echo [5] Exit
echo.
echo ===================================================
set /p choice="Choice (1-5): "

if "%choice%"=="1" goto tam_docker
if "%choice%"=="2" goto yerel_dev
if "%choice%"=="3" goto sadece_db
if "%choice%"=="4" goto seed_db
if "%choice%"=="5" goto cikis
goto gecersiz

:tam_docker
echo.
echo Starting all services in Docker...
docker-compose -f docker/docker-compose.yml up --build
goto bitir

:yerel_dev
echo.
echo Starting Database and pgAdmin in Docker...
docker-compose -f docker/docker-compose.yml up -d db pgadmin
echo.
echo Waiting for Database to be ready...
timeout /t 5 > nul

echo Starting Backend (NestJS) in a new window...
start cmd /k "cd backend && npm run start:dev"

echo Starting Frontend (Vite) in a new window...
start cmd /k "cd frontend && npm run dev"

echo.
echo MudurPro started in local development mode!
echo Backend API: http://localhost:3000
echo Frontend Web: http://localhost:5173
echo.
pause
goto bitir

:sadece_db
echo.
echo Starting Database and pgAdmin...
docker-compose -f docker/docker-compose.yml up -d db pgadmin
echo.
echo Done. To stop, run: docker-compose -f docker/docker-compose.yml down
echo.
pause
:seed_db
echo.
echo Seeding database with default admin user...
cd backend && npm run seed && cd ..
echo.
echo Database seeded successfully!
pause
goto bitir

:gecersiz
echo.
echo Invalid choice.
timeout /t 3 > nul
cls
goto menu

:cikis
exit

:bitir
