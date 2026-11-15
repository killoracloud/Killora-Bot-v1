const mongoose=require('mongoose');
const schema=new mongoose.Schema({guildId:{type:String,index:true},userId:{type:String,index:true},answers:[{question:String,answer:String}],status:{type:String,enum:['pending','approved','denied'],default:'pending'},reviewedBy:String,reason:String,reviewedAt:Date,reviewMessageId:String,reviewChannelId:String},{timestamps:true});
schema.index({guildId:1,userId:1,status:1});
module.exports=mongoose.model('StaffApplication',schema);
