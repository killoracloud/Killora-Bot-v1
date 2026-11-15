const mongoose=require('mongoose');
module.exports=mongoose.model('Warning',new mongoose.Schema({guildId:{type:String,index:true},userId:{type:String,index:true},moderatorId:String,reason:String},{timestamps:true}));
