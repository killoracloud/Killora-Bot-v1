const {Client,GatewayIntentBits,Partials,Collection}=require('discord.js');
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildInvites,GatewayIntentBits.GuildVoiceStates],partials:[Partials.Message,Partials.Channel,Partials.GuildMember]});
client.inviteCache=new Map(); client.commands=new Collection();
module.exports=client;
