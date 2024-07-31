const express = require('express');
const redis = require('redis');
const uuid = require('uuid');
const app = express();

app.use(express.json());

// Configured Redis client to use custom host and port from environment variables
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Ensured the Redis client is connected
(async () => {
    await redisClient.connect();
})();

// unique key generator
function generateUniqueKey() {
    return uuid.v4();
}

// Converts datetime to ISO string format
function toISOString(date) {
    return new Date(date).toISOString();
}

// POST /keys: Generate new keys
app.post('/keys', async (req, res) => {
    const key = generateUniqueKey();
    const createdAt = new Date();
    const expiry = new Date(createdAt.getTime() + 5 * 60 * 1000);  // 5 minutes from creation

    const value = JSON.stringify({
        expiry: toISOString(expiry),
        is_active: true,
        is_blocked: false,
        created_at: toISOString(createdAt)
    });

    await redisClient.set(key, value);
    await redisClient.rPush('available_keys', key);
    await redisClient.zAdd('expiry', { score: expiry.getTime(), value: key });
    res.status(201).json({ key, expiry: toISOString(expiry), is_active: true, is_blocked: false, created_at: toISOString(createdAt) });
});


// GET /keys/:id: Provide information about a specific key
app.get('/keys/:id', async (req, res) => {
    const key = req.params.id;
    // const keyInfo = await redisClient.hGetAll(key);
    const keyInfo = await redisClient.get(key);
    console.log(`keyInfo`, keyInfo);
    const outerParsed = JSON.parse(keyInfo);

    console.log(`outerParsed`, outerParsed);
    console.log(`keyInfo: ${JSON.stringify(keyInfo)}`);

    if (outerParsed !== null && Object.keys(outerParsed).length > 0) {
        res.status(200).json({
            key: key,
            expiry: outerParsed.expiry,
            is_active: outerParsed.is_active,
            is_blocked: outerParsed.is_blocked,
            created_at: outerParsed.created_at,
            updated_at: outerParsed.updated_at,
            blocked_at: outerParsed.blocked_at
        });
    } else {
        res.status(404).json({ error: `Key: ${key} not found` });
    }
});

// GET /keys: Retrieve an available key for client use
app.get('/keys/', async (req, res) => {
    const now = Date.now();
    // console.log('request-time', now)
    try {
        const key = await redisClient.lPop('available_keys');
        console.log('request-key', key)
        if (key) {
        // const availableKeys = await redisClient.zRangeByScore('expiry', now, Infinity);
        const keyInfo = await redisClient.get(key);
        console.log('Available keys', keyInfo);
        if (keyInfo) {
            const outerParsed = JSON.parse(keyInfo);
            const blocked_at = new Date();
            outerParsed.is_blocked = true;
            // outerParsed.blocked_at = toISOString(blocked_at);

            await redisClient.set(key, JSON.stringify(outerParsed));
            await redisClient.setEx(`blocking:${key}`, 30, JSON.stringify({ is_blocked: true }));

            return res.status(200).json({ key });
        } else {
            return res.status(404).json({ error: 'Key information not found' });
        }
    } else {
        return res.status(404).json({ error: 'No available keys found' });
    }
    } catch (error) {
        console.error('Error retrieving or blocking keys:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});





// PUT /keys/:id: Unblock a key for further use
app.put('/keys/:id', async (req, res) => {
    const key = req.params.id;
    const exists = await redisClient.exists(key);

    if (exists) {
        const value = JSON.stringify({
            is_blocked: false
        });

        const val = JSON.stringify({
            key: key,
            is_blocked: false
        });
        await redisClient.set(key, val);
    
        await redisClient.set(`blocking:${key}`, value);
        await redisClient.del(`blocking:${key}`);
        res.status(200).json({ message: `${key} is unblocked` });
    } else {
        res.status(404).json({ error: 'Key not found' });
    }
});

// PUT /keepalive/:id: Signal the server to keep the specified key from being deleted
app.put('/keepalive/:id', async (req, res) => {
    const key = req.params.id;
    const exists = await redisClient.exists(key);
    const updatedAt = new Date();

    if (exists) {
        const expiry = new Date(Date.now() + 5 * 60 * 1000);
        const value = JSON.stringify({
            expiry: toISOString(expiry),
            is_active: true,
            is_blocked: false,
            updated_at: toISOString(updatedAt)
        });
        await redisClient.set(key, value);
        await redisClient.zAdd('expiry', { score: expiry.getTime(), value: key });
        res.status(200).json({ message: 'Timer reset', expiry: toISOString(expiry) });
    } else {
        res.status(404).json({ error: 'Key not found' });
    }
});

// DELETE /keys/:id: Remove a specific key from the system
app.delete('/keys/:id', async (req, res) => {
    const key = req.params.id;
    const deleted = await redisClient.del(key);
    if (deleted) {
        await redisClient.zRem('expiry', key);
        await redisClient.del(`blocking:${key}`);
        res.status(200).json({ message: `key: ${key} is deleted` });
    } else {
        res.status(404).json({ error: 'Key not found' });
    }
});


// Background tasks for cleanup and preventing redis build-up(if exists).
setInterval(async () => {
    const now = Date.now();
    const expiredKeys = await redisClient.zRangeByScore('expiry', 0, now);

    for (const key of expiredKeys) {
        await redisClient.del(key);
        await redisClient.zRem('expiry', key);
        await redisClient.del(`blocking:${key}`);
    }
}, 5000);



const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// const availableKeys = await redisClient.zRangeByScore('expiry', now, Infinity, 'LIMIT', 0, 1);
// if (availableKeys.length === 0) {
//     return res.status(404).json({ error: 'Keys not found or already it is been blocked' });
// }

// const key = availableKeys[0];
// console.log('check-1', key);

// const isBlocked = await redisClient.get(`blocking:${key}`);
// console.log('check-2', isBlocked);

// if (isBlocked === null) {
//     console.log('check-3');
//     const blocked_at = new Date();
//     const value = JSON.stringify({ is_blocked: true });
//     const val = JSON.stringify({
//         key: key,
//         is_blocked: true,
//         blocked_at: blocked_at
//     });

//     await redisClient.set(key, val);
// await redisClient.setEx(`blocking:${key}`, 30, value);
//     return res.status(200).json({ key });
// }

// // Run redis operations concurrently
// await Promise.all([
//     redisClient.set(key, value),
//     redisClient.zAdd('expiry', { score: expiry.getTime(), value: key })
// ]);