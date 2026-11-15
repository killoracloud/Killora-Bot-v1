const Analytics=require('../models/Analytics');
async function track(guildId,kind,userId,channelId){try{await Analytics.create({guildId,kind,userId,channelId})}catch(e){console.error('analytics:',e.message)}}
async function summary(guildId,days=7){const since=new Date(Date.now()-days*86400000);const rows=await Analytics.aggregate([{$match:{guildId,at:{$gte:since}}},{$group:{_id:'$kind',count:{$sum:1}}}]);const out={messages:0,joins:0,leaves:0,tickets:0};for(const r of rows)out[r._id]=r.count;return out}
module.exports={track,summary};
