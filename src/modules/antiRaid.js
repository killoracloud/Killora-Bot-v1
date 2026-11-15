const GuildConfig=require('../models/GuildConfig');
const joins=new Map();
const windows=new Map();
async function handleMemberJoin(member){
 if(!member?.guild||member.user?.bot)return;
 const cfg=await GuildConfig.findOne({guildId:member.guild.id}).lean();
 const settings=cfg?.antiRaid||{};
 if(!settings.enabled)return;
 const now=Date.now(),key=member.guild.id,windowMs=Math.max(5000,Math.min(60000,Number(settings.windowMs)||10000));
 const recent=(joins.get(key)||[]).filter(t=>now-t<windowMs);recent.push(now);joins.set(key,recent);
 const threshold=Math.max(3,Math.min(30,Number(settings.threshold)||8));
 if(recent.length<threshold)return;
 const until=windows.get(key)||0;if(now-until<windowMs)return;windows.set(key,now);
 const duration=Math.max(1,Math.min(30,Number(settings.lockdownMinutes)||5));
 const everyone=member.guild.roles.everyone;
 const channels=member.guild.channels.cache.filter(c=>c.isTextBased?.()&&c.permissionOverwrites?.cache?.has(everyone.id));
 for(const channel of channels){await channel.permissionOverwrites.edit(everyone,{SendMessages:false,SendMessagesInThreads:false},{reason:`Killora anti-raid: ${recent.length} joins in ${windowMs}ms`}).catch(()=>{});}
 const log=member.guild.channels.cache.get(settings.logChannelId);if(log?.isTextBased())await log.send({content:`🚨 **Anti-Raid lockdown enabled** — ${recent.length} joins detected in ${Math.round(windowMs/1000)} seconds. Chat permissions restricted for ${duration} minutes.`}).catch(()=>{});
 setTimeout(async()=>{for(const channel of channels){await channel.permissionOverwrites.edit(everyone,{SendMessages:null,SendMessagesInThreads:null},{reason:'Killora anti-raid lockdown expired'}).catch(()=>{});}windows.delete(key);},duration*60000).unref?.();
}
module.exports={handleMemberJoin};
