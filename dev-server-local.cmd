@echo off
cd /d C:\Users\jovan\jmind
call "C:\Program Files\nodejs\npm.cmd" run dev -- --hostname 127.0.0.1 --port 3000 > "C:\Users\jovan\jmind\dev-server.out.log" 2> "C:\Users\jovan\jmind\dev-server.err.log"
