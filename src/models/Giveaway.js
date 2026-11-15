const mongoose=require('mongoose');
module.exports=mongoose.model('Giveaway',new mongoose.Schema({guildId:{type:String,index:true},channelId:String,messageId:String,hostId:String,prize:String,winners:{type:Number,default:1},endsAt:Date, entrants:[String],ended:{type:Boolean,default:false}},{timestamps:true}));
