@echo off
setlocal
set DB=selflogger.db
set TABLE=logs
set PROGRAM=self-logger.bat
echo CREATE TABLE IF NOT EXISTS %TABLE% (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, datetime TEXT); | sqlite3 %DB%
set USERNAME=%USERNAME%
for /f "tokens=* usebackq" %%a in (`powershell -command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"`) do set DATETIME=%%a
echo INSERT INTO %TABLE% (username, datetime) VALUES ('%USERNAME%', '%DATETIME%'); | sqlite3 %DB%
for /f %%a in ('echo SELECT COUNT(*) FROM %TABLE%; ^| sqlite3 %DB%') do set COUNT=%%a
for /f "tokens=* usebackq" %%a in (`echo SELECT datetime FROM %TABLE% ORDER BY id ASC LIMIT 1; ^| sqlite3 %DB%`) do set FIRST_RUN=%%a
echo Имя программы: %PROGRAM%
echo Количество запусков: %COUNT%
echo Первый запуск: %FIRST_RUN%
echo ---------------------------------------------
echo User       ^| Date
echo ---------------------------------------------
echo SELECT username AS User, datetime AS Date FROM %TABLE%; | sqlite3 -header -column %DB%
echo ---------------------------------------------
endlocal
pause