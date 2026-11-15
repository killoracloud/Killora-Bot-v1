const mongoose=require('mongoose');
module.exports=mongoose.model('Economy',new mongoose.Schema({guildId:{type:String,index:true},userId:{type:String,index:true},wallet:{type:Number,default:0,min:0},bank:{type:Number,default:0,min:0},lastDaily:Date},{timestamps:true},{versionKey:false}));
