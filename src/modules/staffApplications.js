const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ModalBuilder,TextInputBuilder,TextInputStyle}=require('discord.js');
const GuildConfig=require('../models/GuildConfig');
const StaffApplication=require('../models/StaffApplication');
const pendingDM=new Map();
const safe=(s,n=1000)=>String(s||'').slice(0,n);
async function startApplication(interaction){
 const cfg=await GuildConfig.findOne({guildId:interaction.guildId});const settings=cfg?.staffApply;
 if(!settings?.enabled||!settings.applyChannelId)return interaction.reply({content:'Staff applications are currently closed.',ephemeral:true});
 const questions=(settings.questions||[]).map(x=>safe(x,180)).filter(Boolean);
 if(!questions.length)return interaction.reply({content:'Staff application questions are not configured yet. Please contact a server administrator.',ephemeral:true});
 const existing=await StaffApplication.findOne({guildId:interaction.guildId,userId:interaction.user.id,status:'pending'});
 if(existing)return interaction.reply({content:'You already have a pending staff application.',ephemeral:true});
 const dm=await interaction.user.createDM().catch(()=>null);if(!dm)return interaction.reply({content:'I could not DM you. Please enable server-member DMs and try again.',ephemeral:true});
 pendingDM.set(interaction.user.id,{guildId:interaction.guildId,questions,answers:[],index:0,dmChannelId:dm.id});
 await dm.send(`**${interaction.guild.name} — Staff Application**\n${questions[0]}\n\nReply to this DM with your answer. Type \`cancel\` to stop.`);
 return interaction.reply({content:'I sent the application questions to your DMs. Answer each question there.',ephemeral:true});
}
async function handleDM(message,client){
 if(message.author.bot||message.guild)return false;const state=pendingDM.get(message.author.id);if(!state||message.channel.id!==state.dmChannelId)return false;
 if(message.content.trim().toLowerCase()==='cancel'){pendingDM.delete(message.author.id);await message.reply('Your staff application was cancelled.');return true;}
 if(!message.content.trim()){await message.reply('Please send a text answer, or type `cancel` to stop.');return true;}state.answers.push({question:state.questions[state.index],answer:safe(message.content,1800)});state.index++;
 if(state.index<state.questions.length){await message.reply(`**Question ${state.index+1}/${state.questions.length}:**\n${state.questions[state.index]}`);return true;}
 pendingDM.delete(message.author.id);
 const cfg=await GuildConfig.findOne({guildId:state.guildId});const guild=client.guilds.cache.get(state.guildId);const channel=await guild?.channels.fetch(cfg?.staffApply?.applyChannelId).catch(()=>null);
 if(!channel){await message.reply('The application channel is unavailable. Please contact server staff.');return true;}
 const app=await StaffApplication.create({guildId:state.guildId,userId:message.author.id,answers:state.answers});
 const embed=new EmbedBuilder().setColor('#f0b232').setTitle('New Staff Application').setDescription(`Applicant: <@${message.author.id}>\nStatus: **PENDING**`).addFields(state.answers.map((a,i)=>({name:`${i+1}. ${safe(a.question,256)}`,value:safe(a.answer,1024)||'—'}))).setTimestamp().setFooter({text:'Killora Bot • Discord community bot'});
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`staffapp:approve:${app.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`staffapp:deny:${app.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger));
 const sent=await channel.send({embeds:[embed],components:[row]});app.reviewMessageId=sent.id;app.reviewChannelId=channel.id;await app.save();await message.reply('Your application has been submitted and is now **Pending**. You will receive a DM when it is reviewed.');return true;
}
async function handleInteraction(i){
 if(i.isChatInputCommand()&&i.commandName==='apply')return startApplication(i);
 if(i.isButton()&&i.customId.startsWith('staffapp:')){
  if(!i.memberPermissions?.has('ManageGuild'))return i.reply({content:'Manage Server permission required.',ephemeral:true});
  const [,decision,id]=i.customId.split(':');const app=await StaffApplication.findById(id);if(!app||app.status!=='pending')return i.reply({content:'This application has already been reviewed or no longer exists.',ephemeral:true});
  const modal=new ModalBuilder().setCustomId(`staffappreview:${decision}:${id}`).setTitle(decision==='approve'?'Approve application':'Deny application');
  const reason=new TextInputBuilder().setCustomId('reason').setLabel(decision==='approve'?'Approval note (optional)':'Reason for denial').setStyle(TextInputStyle.Paragraph).setRequired(decision==='deny').setMaxLength(800);
  modal.addComponents(new ActionRowBuilder().addComponents(reason));return i.showModal(modal);
 }
 if(i.isModalSubmit()&&i.customId.startsWith('staffappreview:')){
  if(!i.memberPermissions?.has('ManageGuild'))return i.reply({content:'Manage Server permission required.',ephemeral:true});
  const [,decision,id]=i.customId.split(':');const app=await StaffApplication.findById(id);if(!app||app.status!=='pending')return i.reply({content:'This application has already been reviewed.',ephemeral:true});
  const reason=safe(i.fields.getTextInputValue('reason'),800).trim();app.status=decision==='approve'?'approved':'denied';app.reviewedBy=i.user.id;app.reason=reason;app.reviewedAt=new Date();await app.save();
  const ch=await i.guild.channels.fetch(app.reviewChannelId).catch(()=>null);const msg=await ch?.messages.fetch(app.reviewMessageId).catch(()=>null);
  const embed=msg?.embeds[0];if(msg&&embed){const updated=EmbedBuilder.from(embed).setColor(decision==='approve'?'#36c275':'#e34b4b').setDescription(`Applicant: <@${app.userId}>\nStatus: **${app.status.toUpperCase()}**\nReviewed by: ${i.user}${reason?`\n${decision==='approve'?'Approval note':'Reason'}: ${reason}`:''}`);await msg.edit({embeds:[updated],components:[]}).catch(()=>{});}
  const user=await i.client.users.fetch(app.userId).catch(()=>null);await user?.send(`Your staff application for **${i.guild.name}** was **${app.status.toUpperCase()}** by ${i.user.tag}.${reason?`\n${decision==='approve'?'Approval note':'Reason'}: ${reason}`:''}`).catch(()=>{});
  return i.reply({content:`Application ${app.status}. ${reason?'Review note saved.':''}`,ephemeral:true});
 }
 return false;
}
module.exports={handleInteraction,handleDM};
