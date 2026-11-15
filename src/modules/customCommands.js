const CustomCommand=require('../models/CustomCommand');
const cooldowns=new Map();
async function handleCustomCommand(message){
 const prefix='-';if(!message.guild||message.author.bot||!message.content.startsWith(prefix))return false;
 const [name]=message.content.slice(prefix.length).trim().split(/\s+/);if(!name)return false;
 const command=await CustomCommand.findOne({guildId:message.guild.id,name:name.toLowerCase(),enabled:true}).lean();if(!command)return false;
 const key=`${message.guild.id}:${message.author.id}:${name.toLowerCase()}`,now=Date.now(),last=cooldowns.get(key)||0;
 if(now-last<command.cooldownSeconds*1000)return true;cooldowns.set(key,now);
 const content=String(command.response).replaceAll('{user}',message.author.toString()).replaceAll('{username}',message.author.username).replaceAll('{server}',message.guild.name).slice(0,1900);
 await message.reply({content,allowedMentions:{users:[message.author.id],roles:[],parse:[]}});return true;
}
module.exports={handleCustomCommand};
