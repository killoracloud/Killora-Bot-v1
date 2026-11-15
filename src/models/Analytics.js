const mongoose=require('mongoose');
module.exports=mongoose.model('Analytics',new mongoose.Schema({guildId:{type:String,index:true},kind:{type:String,index:true},userId:String,channelId:String,at:{type:Date,default:Date.now,index:true}},{timestamps:false}));
