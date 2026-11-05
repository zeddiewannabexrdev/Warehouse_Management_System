# init-cluster.ps1
# Script PowerShell tu dong kich hoat Replica Set va ket noi cac Shard vao Router mongos
# Su dung stdin pipe de tranh loi quote parsing cua Windows PowerShell

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [1/4] Khoi tao Replica Set cho Config Server..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
'rs.initiate({ _id: "configReplSet", configsvr: true, members: [{ _id: 0, host: "configsvr:27019" }] })' | docker exec -i vattu-configsvr mongosh --port 27019

Start-Sleep -Seconds 3

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [2/4] Khoi tao Replica Set cho Shard 1 (Kho Mien Bac - HN)..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
'rs.initiate({ _id: "shard1ReplSet", members: [{ _id: 0, host: "shard1:27018" }] })' | docker exec -i vattu-shard1 mongosh --port 27018

Start-Sleep -Seconds 3

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [3/4] Khoi tao Replica Set cho Shard 2 (Kho Mien Nam - HCM)..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
'rs.initiate({ _id: "shard2ReplSet", members: [{ _id: 0, host: "shard2:27020" }] })' | docker exec -i vattu-shard2 mongosh --port 27020

Start-Sleep -Seconds 5

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [3.5] Khoi dong lai Router mongos de nhan Config Server..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
docker restart vattu-mongos
Start-Sleep -Seconds 6

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [4/4] Them cac Shard vao Router mongos..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
'sh.addShard("shard1ReplSet/shard1:27018"); sh.addShard("shard2ReplSet/shard2:27020"); sh.status();' | docker exec -i vattu-mongos mongosh --port 27017

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " CUM MONGODB SHARDED CLUSTER DA SAN SANG TAI CONG 27017!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
