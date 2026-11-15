const mongoose = require('mongoose');
const schema = new mongoose.Schema({
 guildId:{type:String,unique:true,index:true},
 leave:{enabled:{type:Boolean,default:false},channelId:String,content:String,useEmbed:Boolean,embedTitle:String,embedDescription:String,embedColor:String},
 boost:{enabled:{type:Boolean,default:false},channelId:String,content:String,useEmbed:Boolean,embedTitle:String,embedDescription:String,embedColor:String,removeEnabled:{type:Boolean,default:false},removeContent:String},
 messageSender:{},
 welcome:{enabled:{type:Boolean,default:false},channelId:String,content:String,useEmbed:Boolean,embedTitle:String,embedDescription:String,embedColor:String},
 inviteMessage:{enabled:{type:Boolean,default:false},channelId:String,content:{type:String,default:'🎉 {user} joined! Invited by {inviter}.'},useEmbed:Boolean,embedTitle:String,embedDescription:String,embedColor:String},
 autoresponders:[{trigger:String,response:String,matchType:{type:String,default:'contains'},enabled:{type:Boolean,default:true},caseSensitive:{type:Boolean,default:false},embedEnabled:{type:Boolean,default:false},embedTitle:String,embedDescription:String,embedColor:{type:String,default:'#39ff14'},embedImage:String,imageUrl:String,channelId:String,roleId:String,cooldownSeconds:{type:Number,default:0}}],
 sticky:[{channelId:String,content:String,messageId:String,useEmbed:Boolean,embedTitle:String,embedDescription:String,embedColor:String,trigger:String,matchType:{type:String,default:'everyMessage'},caseSensitive:{type:Boolean,default:false},enabled:{type:Boolean,default:true}}],
 ticketTranscriptChannelId:String,
 ticketPanels:[{name:String,channelId:String,messageId:String,title:String,description:String,color:{type:String,default:'#39ff14'},buttons:[{id:String,label:String,emoji:String,style:{type:Number,default:3},categoryId:String,staffRoleId:String,welcomeMessage:String}],selectOptions:[{id:String,label:String,description:String,emoji:String,categoryId:String,staffRoleId:String,welcomeMessage:String}]}],
 logsChannelId:String,
 suggestions:{channelId:String,enabled:Boolean},
 staffApply:{applyChannelId:String,approvedChannelId:String,deniedChannelId:String,categoryId:String,enabled:Boolean,questions:[String]},
 joinToCreate:{channelId:String,categoryId:String,enabled:Boolean},
 ai:{enabled:{type:Boolean,default:false},channelId:String,systemPrompt:String},
 music:{enabled:{type:Boolean,default:true},voiceChannelId:String,textChannelId:String,djRoleId:String,alwaysOn:{type:Boolean,default:false},queueLimit:{type:Number,default:100},defaultVolume:{type:Number,default:80},allowExternalUrls:{type:Boolean,default:true}},
 automod:{enabled:Boolean,antiSpam:Boolean,antiLinks:Boolean,badWords:[String]},
 security:{antiWebhook:Boolean,antiChannelDelete:Boolean,antiRoleDelete:Boolean,antiMassBan:Boolean,antiMassKick:Boolean,antiBotJoin:Boolean},
 antiRaid:{enabled:{type:Boolean,default:false},threshold:{type:Number,default:8},windowMs:{type:Number,default:10000},lockdownMinutes:{type:Number,default:5},logChannelId:String},
 leveling:{enabled:Boolean}, economy:{enabled:Boolean},
 settings:{prefix:{type:String,default:'-'},locale:{type:String,default:'en'},theme:{type:String,default:'hacker'}}
},{timestamps:true});
module.exports=mongoose.model('GuildConfig',schema);
