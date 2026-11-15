const mongoose=require('mongoose');
module.exports=mongoose.model('Level',new mongoose.Schema({guildId:{type:String,index:true},userId:{type:String,index:true},xp:{type:Number,default:0},level:{type:Number,default:0}},{timestamps:true}));
