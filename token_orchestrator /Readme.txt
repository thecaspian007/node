npm init -y     
npm install express redis uuid

Redis:
if needed: (If Redis is already listening on port 6379)
sudo lsof -i :6379
sudo kill -9 <PID>

healthy scenario:
redis-server

check in other terminal: 
redis-cli ping

Create API Key: O(log n)
Retrieve API Key: O(k) (where k is the number of keys in the score range)
Unblock API Key: O(1)
Keep Alive API Key: O(log n)
Delete API Key: O(log n)

listening port: http://127.0.0.1:5000

