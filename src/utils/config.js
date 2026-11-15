require('dotenv').config();
const required = ['DISCORD_TOKEN','MONGODB_URI','SESSION_SECRET','ADMIN_PASSWORD'];
for (const key of required) if (!process.env[key]) console.warn(`[config] Missing ${key}; check your .env file.`);
module.exports = process.env;
