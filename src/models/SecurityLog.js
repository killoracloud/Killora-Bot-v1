const mongoose=require('mongoose');
module.exports=mongoose.model('SecurityLog',new mongoose.Schema({guildId:{type:String,index:true},executorId:String,action:String,targetId:String,createdAt:{type:Date,default:Date.now,index:true}},{versionKey:false}));
