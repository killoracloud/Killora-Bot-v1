const mongoose=require('mongoose');
module.exports=mongoose.model('Suggestion',new mongoose.Schema({guildId:{type:String,index:true},channelId:String,messageId:String,userId:String,text:String,status:{type:String,default:'pending'}},{timestamps:true}));
