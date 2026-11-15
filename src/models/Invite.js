const mongoose = require('mongoose');
const schema = new mongoose.Schema({ guildId:{type:String,index:true}, userId:{type:String,index:true}, inviterId:String, code:String, joinedAt:{type:Date,default:Date.now}, leftAt:Date, fake:{type:Boolean,default:false}, bonus:{type:Number,default:0} });
schema.index({guildId:1,userId:1},{unique:true});
module.exports = mongoose.model('Invite', schema);
