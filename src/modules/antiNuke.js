const {AuditLogEvent,PermissionsBitField}=require('discord.js');
const GuildConfig=require('../models/GuildConfig');
const SecurityLog=require('../models/SecurityLog');
const recent=new Map();
async function guard(guild,type,targetId){const cfg=await GuildConfig.findOne({guildId:guild.id}).lean();const key={webhookCreate:'antiWebhook',channelDelete:'antiChannelDelete',roleDelete:'antiRoleDelete',memberBan:'antiMassBan',memberKick:'antiMassKick',botAdd:'antiBotJoin'}[type];if(!cfg?.security?.[key])return;
let event;try{event=({webhookCreate:AuditLogEvent.WebhookCreate,channelDelete:AuditLogEvent.ChannelDelete,roleDelete:AuditLogEvent.RoleDelete,memberBan:AuditLogEvent.MemberBanAdd,memberKick:AuditLogEvent.MemberKick,botAdd:AuditLogEvent.BotAdd})[type];const logs=await guild.fetchAuditLogs({type:event,limit:1});const entry=logs.entries.first();if(!entry?.executor||entry.executor.id===guild.ownerId||entry.executor.bot)return;const now=Date.now(),bucket=recent.get(`${guild.id}:${entry.executor.id}`)||[];const hits=bucket.filter(t=>now-t<10000);hits.push(now);recent.set(`${guild.id}:${entry.executor.id}`,hits);await SecurityLog.create({guildId:guild.id,executorId:entry.executor.id,action:type,targetId});if(hits.length>=3){const member=await guild.members.fetch(entry.executor.id).catch(()=>null);if(member?.bannable)await member.ban({reason:`Killora Bot anti-nuke: repeated ${type} actions`});}}
catch(e){console.error('Anti-nuke guard:',e.message)}}
module.exports={guard};
