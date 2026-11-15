const env=require('./utils/config');
const mongoose=require('mongoose');
const client=require('./bot/client');
const GuildConfig=require('./models/GuildConfig');
const Invite=require('./models/Invite');
const {inviteCommand,runSlash}=require('./bot/commands');
const {askGemini}=require('./modules/gemini');
const {giveawayInteraction,finishGiveaways}=require('./modules/giveaways');
const {handleTicketInteraction,handleTicketControls}=require('./bot/tickets');
const Level=require('./models/Level');
const {guard}=require('./modules/antiNuke');
const {WebSocket}=require('ws');
const {REST,Routes}=require('discord.js');
const commandDefinitions=require('./deploy-commands');
const {handleMusicCommand,handleMusicButton,initMusic,updateMusicPanels}=require('./modules/music');
const {ModalBuilder,TextInputBuilder,TextInputStyle,ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder}=require('discord.js');
const {applyVariables}=require('./modules/variables');
const staffApplications=require('./modules/staffApplications');
const analytics=require('./modules/analytics');
const automation=require('./modules/automation');
const autoresponderCooldowns=new Map();
const {handleMemberJoin}=require('./modules/antiRaid');
const {handleCustomCommand}=require('./modules/customCommands');
require('./dashboard/app');
(async()=>{await mongoose.connect(env.MONGODB_URI);console.log('MongoDB connected');client.once('clientReady',async()=>{global.killoraClient=client;console.log(`Killora Bot online as ${client.user.tag}`);try{await new REST({version:'10'}).setToken(env.DISCORD_TOKEN).put(Routes.applicationCommands(client.user.id),{body:commandDefinitions});console.log(`Automatically registered ${commandDefinitions.length} slash commands.`)}catch(e){console.error('Automatic slash command registration failed:',e.message)};updateMusicPanels();console.log('Lavalink music engine initialized.');for(const guild of client.guilds.cache.values()){try{client.inviteCache.set(guild.id,await guild.invites.fetch())}catch(e){console.warn(`Cannot cache invites for ${guild.name}: ${e.message}`)}}});
// Serialize invite attribution per guild and retain any extra use increments
// observed in one fetch, so simultaneous joins do not lose attribution.
const inviteJoinQueues = new Map();
const pendingInviteUses = new Map();
async function detectUsedInvite(guild) {
  const previous = client.inviteCache.get(guild.id) || new Map();
  const current = await guild.invites.fetch();
  const pending = pendingInviteUses.get(guild.id) || new Map();
  for (const invite of current.values()) {
    const oldUses = previous.get(invite.code)?.uses || 0;
    const increase = Math.max(0, (invite.uses || 0) - oldUses);
    if (increase) pending.set(invite.code, (pending.get(invite.code) || 0) + increase);
  }
  client.inviteCache.set(guild.id, current);
  let selected = null;
  for (const [code, count] of pending) {
    if (count > 0) {
      selected = current.get(code) || previous.get(code) || null;
      if (count === 1) pending.delete(code); else pending.set(code, count - 1);
      break;
    }
  }
  pendingInviteUses.set(guild.id, pending);
  return selected;
}
function queueGuildJoin(guildId, task) {
  const previous = inviteJoinQueues.get(guildId) || Promise.resolve();
  const next = previous.catch(() => {}).then(task);
  inviteJoinQueues.set(guildId, next);
  return next.finally(() => { if (inviteJoinQueues.get(guildId) === next) inviteJoinQueues.delete(guildId); });
}
client.on('inviteCreate', async invite => {
  try { const invites = await invite.guild.invites.fetch(); client.inviteCache.set(invite.guild.id, invites); }
  catch (e) { console.warn(`Invite cache refresh failed (${invite.guild.id}): ${e.message}`); }
});
client.on('inviteDelete', async invite => {
  try { const invites = await invite.guild.invites.fetch(); client.inviteCache.set(invite.guild.id, invites); }
  catch (e) { console.warn(`Invite cache refresh failed (${invite.guild.id}): ${e.message}`); }
});
client.on('guildMemberAdd', async member => {
  try {
    await handleMemberJoin(member);
    await analytics.track(member.guild.id, 'joins', member.id);
    await automation.run(member.guild, 'memberJoin', { member });
    const used = await queueGuildJoin(member.guild.id, async () => {
      try { return await detectUsedInvite(member.guild); }
      catch (e) { console.warn(`Invite detection failed in ${member.guild.id}: ${e.message}`); return null; }
    });
    let inviterTotalUses = '';
    if (used?.inviter) {
      await Invite.findOneAndUpdate(
        { guildId: member.guild.id, userId: member.id },
        { $set: { inviterId: used.inviter.id, code: used.code, joinedAt: new Date(), leftAt: null } },
        { upsert: true }
      );
      const [count, bonusRows] = await Promise.all([
        Invite.countDocuments({ guildId: member.guild.id, inviterId: used.inviter.id }),
        Invite.find({ guildId: member.guild.id, inviterId: used.inviter.id }).select('bonus').lean()
      ]);
      inviterTotalUses = String(count + bonusRows.reduce((sum, row) => sum + (row.bonus || 0), 0));
    }
    const cfg = await GuildConfig.findOne({ guildId: member.guild.id });
    if (cfg?.inviteMessage?.enabled && cfg.inviteMessage.channelId) {
      const inviteChannel = await member.guild.channels.fetch(cfg.inviteMessage.channelId).catch(() => null);
      if (inviteChannel) {
        const vars = { user: member.user, guild: member.guild, member, inviter: used?.inviter, inviterName: used?.inviter?.username || 'Unknown', inviteCode: used?.code, inviteUses: inviterTotalUses, channel: inviteChannel, client };
        const raw = applyVariables(cfg.inviteMessage.content || '🎉 {user} joined! Invited by {inviter}.', vars);
        if (cfg.inviteMessage.useEmbed) {
          const eb = new EmbedBuilder().setColor(cfg.inviteMessage.embedColor || '#39ff14')
            .setTitle(applyVariables(cfg.inviteMessage.embedTitle || 'New member joined!', vars, { mentionMode: 'name' }).slice(0, 256))
            .setDescription(applyVariables(cfg.inviteMessage.embedDescription || cfg.inviteMessage.content || '🎉 {user} joined! Invited by {inviter}.', vars, { mentionMode: 'name' }).slice(0, 4000))
            .setFooter({ text: 'Killora Bot • Discord community bot' });
          await inviteChannel.send({ embeds: [eb], allowedMentions: { users: [member.id, ...(used?.inviter ? [used.inviter.id] : [])], parse: [] } });
        } else {
          await inviteChannel.send({ content: raw + '\n-# Killora Bot • Discord community bot', allowedMentions: { users: [member.id, ...(used?.inviter ? [used.inviter.id] : [])], parse: [] } });
        }
      }
    }
    if (cfg?.welcome?.enabled && cfg.welcome.channelId) {
      const ch = await member.guild.channels.fetch(cfg.welcome.channelId).catch(() => null);
      if (ch) {
        const vars = { user: member.user, guild: member.guild, member, channel: ch, client };
        const content = applyVariables(cfg.welcome.content || 'Welcome {user} to {server}!', vars);
        if (cfg.welcome.useEmbed) {
          const embed = new EmbedBuilder().setColor(cfg.welcome.embedColor || '#39ff14')
            .setTitle(applyVariables(cfg.welcome.embedTitle || 'Welcome to {server}!', vars, { mentionMode: 'name' }).slice(0, 256))
            .setDescription(applyVariables(cfg.welcome.embedDescription || cfg.welcome.content || 'Welcome {user}!', vars, { mentionMode: 'name' }).slice(0, 4000))
            .setFooter({ text: 'Killora Bot • Discord community bot' });
          await ch.send({ embeds: [embed] });
        } else await ch.send({ content: `${content}\n-# Killora Bot • Discord community bot`, allowedMentions: { users: [member.id] } });
      }
    }
  } catch (e) { console.error('guildMemberAdd:', e.message); }
});
client.on('guildMemberRemove',async member=>{try{await analytics.track(member.guild.id,'leaves',member.id);await automation.run(member.guild,'memberLeave',{member});await Invite.findOneAndUpdate({guildId:member.guild.id,userId:member.id},{$set:{leftAt:new Date()}}).catch(()=>{});const cfg=await GuildConfig.findOne({guildId:member.guild.id});if(cfg?.leave?.enabled&&cfg.leave.channelId){const ch=await member.guild.channels.fetch(cfg.leave.channelId).catch(()=>null);if(ch){const vars={user:member.user,guild:member.guild,member,channel:ch,client};const content=applyVariables(cfg.leave.content||'{username} left {server}.',vars);if(cfg.leave.useEmbed){const eb=new EmbedBuilder().setColor(cfg.leave.embedColor||'#ff5555').setTitle(applyVariables(cfg.leave.embedTitle||'Goodbye!',vars,{mentionMode:'name'}).slice(0,256)).setDescription(applyVariables(cfg.leave.embedDescription||cfg.leave.content||'{username} left {server}.',vars,{mentionMode:'name'}).slice(0,4000)).setFooter({text:'Killora Bot • Discord community bot'});await ch.send({embeds:[eb]});}else await ch.send({content:`${content}\n-# Killora Bot • Discord community bot`});}}}catch(e){console.error('guildMemberRemove:',e.message)}});
client.on('guildMemberUpdate',async(oldMember,newMember)=>{try{const was=!!oldMember.premiumSince,now=!!newMember.premiumSince;if(was===now)return;const cfg=await GuildConfig.findOne({guildId:newMember.guild.id});if(!cfg?.boost?.enabled||!cfg.boost.channelId||(!now&&!cfg.boost.removeEnabled))return;const ch=await newMember.guild.channels.fetch(cfg.boost.channelId).catch(()=>null);if(!ch)return;const vars={user:newMember.user,guild:newMember.guild,member:newMember,channel:ch,client};const raw=now?(cfg.boost.content||'💎 {user} boosted {server}!'):(cfg.boost.removeContent||'A boost from {username} ended.');const content=applyVariables(raw,vars);if(cfg.boost.useEmbed){const eb=new EmbedBuilder().setColor(cfg.boost.embedColor||'#ff73fa').setTitle(applyVariables(cfg.boost.embedTitle||(now?'New Server Boost!':'Boost Ended'),vars,{mentionMode:'name'}).slice(0,256)).setDescription(applyVariables(cfg.boost.embedDescription||(now?cfg.boost.content:cfg.boost.removeContent)||'{username} updated the server boost status.',vars,{mentionMode:'name'}).slice(0,4000)).setFooter({text:'Killora Bot • Discord community bot'});await ch.send({embeds:[eb]});}else await ch.send({content:`${content}\n-# Killora Bot • Discord community bot`});}catch(e){console.error('guildMemberUpdate boost:',e.message)}});
client.on('messageCreate',async message=>{if(message.author.bot)return;try{if(!message.guild){await staffApplications.handleDM(message,client);return;}if(message.content.trim()==='-i'||message.content.trim().startsWith('-i ')){await inviteCommand(message);return;}if(await handleCustomCommand(message))return;await analytics.track(message.guild.id,'messages',message.author.id,message.channelId);await automation.run(message.guild,'messageContains',{message,member:message.member});const cfg=await GuildConfig.findOne({guildId:message.guild.id});if(!cfg)return;const matches=(cfg.autoresponders||[]).filter(x=>{if(x.enabled===false||!x.trigger)return false;if(x.channelId&&x.channelId!==message.channel.id)return false;if(x.roleId&&!message.member?.roles.cache.has(x.roleId))return false;const source=x.caseSensitive?message.content:message.content.toLowerCase();const trigger=x.caseSensitive?x.trigger:x.trigger.toLowerCase();return x.matchType==='exact'?source.trim()===trigger:x.matchType==='startsWith'?source.startsWith(trigger):x.matchType==='endsWith'?source.endsWith(trigger):source.includes(trigger)});for(const match of matches){const cooldownKey=`${message.guild.id}:${message.author.id}:${match.trigger}`;const last=autoresponderCooldowns.get(cooldownKey)||0;if(Date.now()-last>=((match.cooldownSeconds||0)*1000)){autoresponderCooldowns.set(cooldownKey,Date.now());const vars={user:message.author,guild:message.guild,member:message.member,channel:message.channel,message,client};const content=applyVariables(match.response,vars);const embeds=[];const files=[];let uploadedImageUrl='';if(match.imageUrl?.startsWith('/uploads/')){const path=require('path');const filePath=path.join(__dirname,'../public',match.imageUrl.replace(/^\//,''));const filename=path.basename(filePath);if(require('fs').existsSync(filePath)){files.push({attachment:filePath,name:filename});uploadedImageUrl=`attachment://${filename}`}}const externalImage=match.embedImage||(!uploadedImageUrl?match.imageUrl:'');if(match.embedEnabled&&(match.embedTitle||match.embedDescription||externalImage||uploadedImageUrl)){const eb=new EmbedBuilder().setColor(match.embedColor||'#39ff14');if(match.embedTitle)eb.setTitle(applyVariables(match.embedTitle,vars,{mentionMode:'name'}).slice(0,256));if(match.embedDescription)eb.setDescription(applyVariables(match.embedDescription,vars,{mentionMode:'name'}).slice(0,4000));const image=externalImage||uploadedImageUrl;if(image)eb.setImage(applyVariables(image,vars));eb.setFooter({text:'Killora Bot • Discord community bot'});embeds.push(eb)}else if(externalImage||uploadedImageUrl){embeds.push(new EmbedBuilder().setImage(applyVariables(externalImage||uploadedImageUrl,vars)).setFooter({text:'Killora Bot • Discord community bot'}))}if(content||embeds.length||files.length)await message.reply({content:content||undefined,embeds,files,allowedMentions:{users:[message.author.id],roles:[],parse:[]}})}}if(cfg.leveling?.enabled){const xp=5+Math.floor(Math.random()*11);const row=await Level.findOneAndUpdate({guildId:message.guild.id,userId:message.author.id},{$inc:{xp}},{upsert:true,new:true});const level=Math.floor(Math.sqrt(row.xp/100));if(level>row.level){row.level=level;await row.save();await message.channel.send(`🎉 <@${message.author.id}> reached level ${level}!`);}}if(cfg.ai?.enabled&&cfg.ai.channelId===message.channel.id&&client.user&&message.mentions.has(client.user)){const prompt=message.content.replaceAll(`<@${client.user.id}>`,'').replaceAll(`<@!${client.user.id}>`,'').trim();const answer=await askGemini(prompt,{system:cfg.ai.systemPrompt||undefined});await message.reply(answer.slice(0,1900));}}catch(e){console.error('messageCreate:',e.message)}});
client.snipes=new Map();
client.on('messageDelete',m=>{if(m.guild&&!m.author?.bot)client.snipes.set(m.channelId,{author:m.author?.tag||'Unknown',content:m.content||'[No text content]'});});
client.on('messageCreate',async message=>{if(!message.guild||message.author.bot)return;const cfg=await GuildConfig.findOne({guildId:message.guild.id});const stickies=(cfg?.sticky||[]).filter(x=>{if(x.enabled===false||x.channelId!==message.channel.id)return false;if(x.matchType==='everyMessage')return true;if(!x.trigger)return false;const text=x.caseSensitive?message.content:message.content.toLowerCase();const trigger=x.caseSensitive?x.trigger:x.trigger.toLowerCase();return x.matchType==='exact'?text.trim()===trigger:x.matchType==='startsWith'?text.startsWith(trigger):x.matchType==='endsWith'?text.endsWith(trigger):text.includes(trigger);});for(let index=0;index<stickies.length;index++){const sticky=stickies[index];if(sticky.messageId)await message.channel.messages.delete(sticky.messageId).catch(()=>{});let sent;const stickyVars={user:message.author,guild:message.guild,member:message.member,channel:message.channel,message,client};const stickyText=applyVariables(sticky.content||'',stickyVars);if(sticky.useEmbed){const eb=new EmbedBuilder().setColor(sticky.embedColor||'#39ff14').setFooter({text:'Killora Bot • Discord community bot'});if(sticky.embedTitle)eb.setTitle(applyVariables(sticky.embedTitle,stickyVars,{mentionMode:'name'}).slice(0,256));const desc=applyVariables(sticky.embedDescription||sticky.content||'',stickyVars,{mentionMode:'name'});if(desc)eb.setDescription(desc.slice(0,4000));sent=await message.channel.send({content:stickyText||undefined,embeds:[eb]});}else sent=await message.channel.send(stickyText);const originalIndex=cfg.sticky.indexOf(sticky);if(originalIndex>=0)cfg.sticky[originalIndex].messageId=sent.id;}if(stickies.length)await cfg.save().catch(()=>{});});
client.on('interactionCreate',async interaction=>{try{if(await staffApplications.handleInteraction(interaction))return;if(await giveawayInteraction(interaction))return;if(await handleMusicButton(interaction))return;if(interaction.isChatInputCommand()&&['play','pause','resume','skip','stop','queue','loop','volume','shuffle','nowplaying','filter'].includes(interaction.commandName)){await handleMusicCommand(interaction);return;}if(interaction.isChatInputCommand()){await runSlash(interaction);return;}if(await handleTicketControls(interaction))return;if(await handleTicketInteraction(interaction))return;}catch(e){console.error('interaction:',e);if(!interaction.replied&&!interaction.deferred)await interaction.reply({content:'Something went wrong. Please try again.',ephemeral:true}).catch(()=>{});}});
client.on('voiceStateUpdate',async(oldState,newState)=>{try{if(!newState.guild||oldState.channelId===newState.channelId)return;const cfg=await GuildConfig.findOne({guildId:newState.guild.id});if(!cfg?.joinToCreate?.enabled||newState.channelId!==cfg.joinToCreate.channelId)return;const ch=await newState.guild.channels.create({name:`${newState.member.user.username}'s room`.slice(0,95),type:2,parent:cfg.joinToCreate.categoryId||undefined,permissionOverwrites:[{id:newState.guild.roles.everyone.id,deny:['ViewChannel']},{id:newState.member.id,allow:['ViewChannel','Connect','ManageChannels']}]});await newState.member.voice.setChannel(ch);const cleanup=setInterval(async()=>{const live=await newState.guild.channels.fetch(ch.id).catch(()=>null);if(!live){clearInterval(cleanup);return;}if(live.members.size===0){await live.delete('Temporary voice channel is empty').catch(()=>{});clearInterval(cleanup);}},30000);cleanup.unref?.();}catch(e){console.error('Join-to-create:',e.message)}});

// Configurable anti-nuke signals. Actions are logged; automatic punishment only occurs after repeated audited actions.
client.on('webhooksUpdate',channel=>guard(channel.guild,'webhookCreate',channel.id));
client.on('channelDelete',channel=>guard(channel.guild,'channelDelete',channel.id));
client.on('roleDelete',role=>guard(role.guild,'roleDelete',role.id));
client.on('guildMemberAdd',member=>{if(member.user.bot)guard(member.guild,'botAdd',member.id)});
client.on('guildBanAdd',ban=>guard(ban.guild,'memberBan',ban.user.id));
// Brand footer is added at message creation by individual features. Do not edit sent messages globally.
setInterval(()=>finishGiveaways(client).catch(e=>console.error('Giveaway scheduler:',e.message)),15000).unref();
initMusic(client);
await client.login(env.DISCORD_TOKEN);})().catch(e=>{console.error(e);process.exit(1)});
