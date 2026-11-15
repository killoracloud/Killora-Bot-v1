const mongoose=require('mongoose');
module.exports=mongoose.model('License',new mongoose.Schema({key:{type:String,unique:true,index:true},ownerId:String,plan:{type:String,default:'premium'},active:{type:Boolean,default:true},expiresAt:Date,features:[String]},{timestamps:true}));
