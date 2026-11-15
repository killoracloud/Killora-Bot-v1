
💚 Killora Bot

￼ 

KILLORA BOT

✨ All-in-One Discord Community Bot

Powerful • Customizable • Reliable

￼ ￼ ￼ ￼ ￼

Killora Bot is an all-in-one Discord community management bot featuring advanced moderation, automation, music, ticket management, invite tracking, leveling, economy and a password-protected web dashboard.

🌟 Features

📊 Web Dashboard

🔐 Password-protected admin login

🎨 Modern dark-themed interface

📈 Bot statistics

⚙️ Server configuration

👀 Live Discord message preview

📨 Custom Embed Builder

🛡️ Moderation & Protection

🚫 Anti-Spam

⚔️ Anti-Raid

🔨 Ban & Kick

🔇 Mute & Timeout

⚠️ Warning System

📝 Moderation Logs

🎉 Community Management

👋 Welcome & Goodbye

🎟️ Invite Tracker

🎭 Auto Roles

🌈 Reaction Roles

🏆 Leveling & XP

💰 Economy System

🎫 Ticket System

🎫 Multiple Ticket Panels

👨‍💼 Staff Claim System

📝 Ticket Transcripts

⚙️ Custom Ticket Messages

🔒 Ticket Management

📂 Ticket Categories

🎵 Music System

🎧 Lavalink Music Backend

📃 Queue Management

🔊 Volume Control

🎼 Music Playback

🎛️ DJ Controls

🌐 Music Dashboard Controls

🤖 Automation & Extras

💬 Auto Responder

⚡ Custom Commands

📢 Custom Embeds

💾 Backup & Restore

📊 Activity Monitoring

🔄 Automation Tools

📋 Requirements

Before installing Killora Bot, make sure you have:

Node.js 20 or newer

MongoDB database

Discord Bot Token

Discord Application

Lavalink server (for Lavalink music)

Required Discord Gateway Intents

Required Discord Bot Permissions

🚀 Installation – Wispbyte Hosting

Killora Bot is designed to run on Wispbyte Node.js hosting.

1️⃣ Create Your Server

Open your Wispbyte dashboard.

Create a Node.js server.

Select Node.js 20 or newer.

2️⃣ Upload Bot Files

Download the Killora Bot ZIP.

Open your Wispbyte File Manager.

Upload the ZIP file.

Extract all project files into the server directory.

Make sure package.json and the src folder are in the main server directory.

3️⃣ Configure Environment File

Find the .env.example file in your project.

Rename .env.example to .env.

Open .env and configure your credentials:

# Discord Configuration DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN # MongoDB Configuration MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING # Dashboard Configuration ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD SESSION_SECRET=YOUR_RANDOM_SESSION_SECRET # Lavalink Configuration LAVALINK_HOST=YOUR_LAVALINK_HOST LAVALINK_PORT=2333 LAVALINK_PASSWORD=YOUR_LAVALINK_PASSWORD 

Replace the example values with your actual credentials.

4️⃣ Configure Startup Settings

Set the following main startup file:

src/index.js 

Wispbyte Startup Command:

if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/node /home/container/src/index.js 

Paste this command into your Wispbyte Startup Configuration.

5️⃣ Start Your Bot

Save your configuration.

Start your Wispbyte server.

Wait for dependencies to install.

Check the console for startup messages.

🎉 Congratulations! Killora Bot is now running.

🔑 Dashboard Login

Killora Bot includes a password-protected web dashboard.

Discord OAuth login is not required.

Configure your administrator password in .env:

ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD 

After starting the bot:

Open your dashboard URL.

Enter your administrator password.

Click Login.

Access your Killora Bot dashboard.

🤖 Discord Bot Setup

Visit the Discord Developer Portal.

Create or select your Discord Application.

Open the Bot section.

Copy your Bot Token.

Enable the required Gateway Intents.

Configure the required bot permissions.

Generate your OAuth2 invite URL.

Invite Killora Bot to your Discord server.

Required Gateway Intents

Enable the intents required by your enabled features:

Server Members Intent

Message Content Intent

Presence Intent (if required by enabled features)

Common Bot Permissions

View Channels

Send Messages

Embed Links

Read Message History

Manage Messages

Manage Roles

Manage Channels

Manage Server

Kick Members

Ban Members

Moderate Members

Connect

Speak

Only grant the permissions required by your configuration.

🎵 Lavalink Configuration

For music functionality, configure a working Lavalink server.

Example:

LAVALINK_HOST=YOUR_LAVALINK_HOST LAVALINK_PORT=2333 LAVALINK_PASSWORD=YOUR_LAVALINK_PASSWORD 

Make sure your Lavalink server is online and accessible from your hosting environment.

Music availability depends on your Lavalink server, audio source plugins and network connection.

🗂️ Project Structure

Killora-Bot/ │ ├── src/ │ └── index.js │ ├── views/ │ └── Dashboard Templates │ ├── public/ │ ├── css/ │ ├── js/ │ └── assets/ │ ├── package.json ├── package-lock.json ├── .env.example └── README.md 

Additional folders and modules may be present in the project.

🔧 Troubleshooting

❌ Bot is not starting 

Check your Node.js version.

Verify package.json.

Check the Wispbyte console.

Make sure dependencies are installed.

🗄️ MongoDB connection error 

Verify your MongoDB URI.

Check database access permissions.

Ensure your MongoDB service is online.

🔐 Dashboard login not working 

Verify ADMIN_PASSWORD.

Make sure .env is correctly configured.

Check SESSION_SECRET.

Restart your server after changing environment settings.

🎵 Music is not working 

Check Lavalink host and port.

Verify Lavalink password.

Check Lavalink server status.

Verify audio source plugin availability.

📢 Bot cannot send messages 

Check bot channel permissions.

Verify Embed Links permission.

Make sure the bot can view the selected channel.

🔒 Security

Never share your Discord Bot Token.

Never publish your .env file.

Use a strong administrator password.

Keep your SESSION_SECRET private.

Restrict dashboard access to trusted administrators.

Back up your MongoDB database regularly.

Never upload private credentials to GitHub.

💚 Killora Bot Information

InformationDetailsBot NameKillora BotVersion1.0.0RuntimeNode.js 20+Main Filesrc/index.jsDatabaseMongoDBMusic BackendLavalinkHostingWispbyteDashboardPassword ProtectedLogin MethodAdmin Password 

💚 Thank You for Using Killora Bot!

Made for Discord Communities

🎉 Manage • Protect • Automate • Enjoy 🎉

￼

KILLORA BOT v1.0.0

