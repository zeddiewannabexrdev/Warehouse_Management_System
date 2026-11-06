@echo off
chcp 65001 >nul
echo ==========================================================
echo  [1/4] Khoi tao Replica Set cho Config Server...
echo ==========================================================
echo rs.initiate({ _id: "configReplSet", configsvr: true, members: [{ _id: 0, host: "configsvr:27019" }] }) | docker exec -i vattu-configsvr mongosh --port 27019

timeout /t 3 /nobreak >nul

echo ==========================================================
echo  [2/4] Khoi tao Replica Set cho Shard 1 (HN)...
echo ==========================================================
echo rs.initiate({ _id: "shard1ReplSet", members: [{ _id: 0, host: "shard1:27018" }] }) | docker exec -i vattu-shard1 mongosh --port 27018

timeout /t 3 /nobreak >nul

echo ==========================================================
echo  [3/4] Khoi tao Replica Set cho Shard 2 (HCM)...
echo ==========================================================
echo rs.initiate({ _id: "shard2ReplSet", members: [{ _id: 0, host: "shard2:27020" }] }) | docker exec -i vattu-shard2 mongosh --port 27020

timeout /t 5 /nobreak >nul

echo ==========================================================
echo  [3.5] Khoi dong lai Router vattu-mongos...
echo ==========================================================
docker restart vattu-mongos
timeout /t 6 /nobreak >nul

echo ==========================================================
echo  [4/4] Them Shard vao Router mongos...
echo ==========================================================
echo sh.addShard("shard1ReplSet/shard1:27018"); sh.addShard("shard2ReplSet/shard2:27020"); sh.status(); | docker exec -i vattu-mongos mongosh --port 27017

echo ==========================================================
echo  CUM SHARDED CLUSTER DA SAN SANG!
echo ==========================================================
pause
