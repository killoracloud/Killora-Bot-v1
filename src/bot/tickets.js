const {ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder,ChannelType,PermissionsBitField,StringSelectMenuBuilder,AttachmentBuilder}=require('discord.js');
const GuildConfig=require('../models/GuildConfig');
const styleMap={1:ButtonStyle.Primary,2:ButtonStyle.Secondary,3:ButtonStyle.Success,4:ButtonStyle.Danger};
const refreshLocks=new Map();
function panelPayload(guildId,panelIndex,panel){
 const embed=new EmbedBuilder().setTitle(panel.title||'Support Tickets').setDescription(panel.description||'Choose an option to open a ticket.').setColor(panel.color||'#39ff14').setFooter({text:'Killora Bot • Discord community bot'});
 const rows=[];
 for(let i=0;i<(panel.buttons||[]).length;i+=5) rows.push(new ActionRowBuilder().addComponents(panel.buttons.slice(i,i+5).map(b=>new ButtonBuilder().setCustomId(`kt:${guildId}:${panelIndex}:${b.id}`).setLabel(b.label).setStyle(styleMap[b.style]||ButtonStyle.Success).setEmoji(b.emoji||undefined))));
 if(panel.selectOptions?.length){const menu=new StringSelectMenuBuilder().setCustomId(`kts:${guildId}:${panelIndex}`).setPlaceholder(panel.selectPlaceholder||'Choose a ticket category').addOptions(panel.selectOptions.filter(o=>o.enabled!==false).slice(0,25).map(o=>({label:o.label.slice(0,100),value:o.id,description:(o.description||'').slice(0,100)||undefined,emoji:o.emoji||undefined})));rows.push(new ActionRowBuilder().addComponents(menu));}
 return {embeds:[embed],components:rows};
}
async function publishPanel(client,guildId,panelIndex){
 const cfg=await GuildConfig.findOne({guildId});const panel=cfg?.ticketPanels?.[panelIndex];if(!panel)throw new Error('Ticket panel not found');
 const channel=await client.channels.fetch(panel.channelId);let sent=null;
 if(panel.messageId){const old=await channel.messages.fetch(panel.messageId).catch(()=>null);if(old)sent=await old.edit(panelPayload(guildId,panelIndex,panel)).catch(()=>null);}
 if(!sent)sent=await channel.send(panelPayload(guildId,panelIndex,panel));
 panel.messageId=sent.id;await cfg.save();return sent;
}
async function refreshPanel(interaction,guildId,panelIndex){
 const key=`${guildId}:${panelIndex}`;
 const previous=refreshLocks.get(key)||Promise.resolve();
 let release;const current=new Promise(r=>release=r);const queued=previous.then(()=>current);refreshLocks.set(key,queued);
 await previous;
 try{
  const cfg=await GuildConfig.findOne({guildId});const panel=cfg?.ticketPanels?.[panelIndex];if(!panel)return;
  const channel=await interaction.guild.channels.fetch(panel.channelId).catch(()=>null);if(!channel?.isTextBased())return;
  // Send the replacement first; only delete the old panel after Discord confirms the new one.
  const fresh=await channel.send(panelPayload(guildId,panelIndex,panel));
  const oldId=panel.messageId||interaction.message?.id;
  panel.messageId=fresh.id;await cfg.save();
  if(oldId&&oldId!==fresh.id)await channel.messages.delete(oldId).catch(()=>{});
 } finally {release();if(refreshLocks.get(key)===queued)refreshLocks.delete(key);}
}
async function handleTicketInteraction(interaction){
 const isButton=interaction.isButton()&&interaction.customId.startsWith('kt:');
 const isSelect=interaction.isStringSelectMenu()&&interaction.customId.startsWith('kts:');
 if(!isButton&&!isSelect)return false;
 const parts=interaction.customId.split(':');const guildId=parts[1],pIndex=Number(parts[2]),optionId=isSelect?interaction.values[0]:parts[3];
 const cfg=await GuildConfig.findOne({guildId});const panel=cfg?.ticketPanels?.[pIndex];
 const option=isSelect?panel?.selectOptions?.find(x=>x.id===optionId&&x.enabled!==false):panel?.buttons?.find(x=>x.id===optionId);
 if(!option)return interaction.reply({content:'This ticket option is no longer configured.',ephemeral:true});
 const guild=interaction.guild;
 if(option.categoryId){await guild.channels.fetch().catch(()=>null);const existing=guild.channels.cache.find(c=>c.type===ChannelType.GuildText&&c.topic?.includes(`kc-owner=${interaction.user.id};kc-category=${option.categoryId}`));if(existing)return interaction.reply({content:`You already have an open ticket in this category: ${existing}`,ephemeral:true});}
 await interaction.deferReply({ephemeral:true});
 const overwrites=[{id:guild.roles.everyone.id,deny:[PermissionsBitField.Flags.ViewChannel]},{id:interaction.user.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ReadMessageHistory]}];
 if(option.staffRoleId)overwrites.push({id:option.staffRoleId,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ReadMessageHistory]});
 let channel;
 try{
  channel=await guild.channels.create({name:`ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,90),type:ChannelType.GuildText,parent:option.categoryId||undefined,topic:`kc-owner=${interaction.user.id};kc-category=${option.categoryId||'none'};kc-panel=${pIndex};kc-option=${optionId}`,permissionOverwrites:overwrites});
  const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ktclose:${interaction.user.id}`).setLabel('Close Ticket').setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId('ktclaim').setLabel('Claim Ticket').setStyle(ButtonStyle.Primary));
  const content=(option.welcomeMessage||'Thanks for contacting support. A team member will be with you shortly.').replaceAll('{user}',`<@${interaction.user.id}>`).replaceAll('{server}',guild.name);
  await channel.send({content:`<@${interaction.user.id}>${option.staffRoleId?` <@&${option.staffRoleId}>`:''}\n${content}`,components:[row]});
  await interaction.editReply({content:`Your ticket has been created: ${channel}`});
  try{await refreshPanel(interaction,guildId,pIndex);}catch(refreshError){console.error('Ticket panel refresh failed; keeping the created ticket and old panel:',refreshError);}
 }catch(error){console.error('Ticket creation failed:',error);if(channel)await channel.delete('Ticket setup failed').catch(()=>{});await interaction.editReply({content:'Ticket creation failed. Please try again or contact staff.'}).catch(()=>{});}
 return true;
}
async function handleTicketControls(interaction){
 if(!interaction.isButton())return false;
 if(interaction.customId.startsWith('ktclose:')){const owner=interaction.customId.split(':')[1];if(interaction.user.id!==owner&&!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageChannels))return interaction.reply({content:'Only the ticket creator or a moderator can close this ticket.',ephemeral:true});await interaction.deferReply({ephemeral:true});try{const ch=interaction.channel;const msgs=await ch.messages.fetch({limit:100});const ordered=[...msgs.values()].sort((a,b)=>a.createdTimestamp-b.createdTimestamp);const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));const html='<!doctype html><html><head><meta charset=\"utf-8\"><title>Ticket Transcript</title><style>body{font:14px Arial;background:#202225;color:#eee;padding:24px}.msg{padding:12px;border-bottom:1px solid #444}.time{color:#aaa;font-size:12px}.author{font-weight:bold}.body{white-space:pre-wrap;margin-top:6px}a{color:#7ab8ff}</style></head><body><h1>'+esc(ch.name)+' transcript</h1><p>Server: '+esc(interaction.guild.name)+' · Closed by: '+esc(interaction.user.tag)+'</p>'+ordered.map(m=>'<div class=\"msg\"><div class=\"time\">'+new Date(m.createdTimestamp).toISOString()+'</div><div class=\"author\">'+esc(m.author?.tag||'Unknown')+'</div><div class=\"body\">'+esc(m.content)+'</div>'+m.attachments.map(a=>'<p><a href=\"'+esc(a.url)+'\">Attachment: '+esc(a.name||'file')+'</a></p>').join('')+'</div>').join('')+'</body></html>';const cfg=await GuildConfig.findOne({guildId:interaction.guildId});const logId=cfg?.ticketTranscriptChannelId||cfg?.logsChannelId;let saved=false;if(logId){const log=await interaction.guild.channels.fetch(logId).catch(()=>null);if(log?.isTextBased()){await log.send({content:'📄 Ticket transcript: **'+ch.name+'**',files:[new AttachmentBuilder(Buffer.from(html,'utf8'),{name:ch.name+'-transcript.html'})]});saved=true;}}await interaction.editReply({content:saved?'Transcript uploaded. Ticket will be deleted in 5 seconds.':'No transcript log channel is configured. Set the server Logs Channel in dashboard; ticket will remain open for safety.'});if(saved)setTimeout(()=>ch.delete('Ticket closed; transcript saved').catch(()=>{}),5000);}catch(e){console.error('Transcript generation failed:',e);await interaction.editReply({content:'Transcript could not be saved. Ticket has been kept safe.'}).catch(()=>{});}return true;}
 if(interaction.customId==='ktclaim'){await interaction.reply({content:`Ticket claimed by ${interaction.user}.`,allowedMentions:{users:[]}});return true;}
 return false;
}
module.exports={publishPanel,handleTicketInteraction,handleTicketControls};
