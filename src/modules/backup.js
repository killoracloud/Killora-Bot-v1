const GuildConfig=require('../models/GuildConfig');
async function createBackup(guildId){const cfg=await GuildConfig.findOne({guildId}).lean();return {schema:1,createdAt:new Date().toISOString(),guildId,config:cfg||{guildId}};}
async function restoreBackup(data,guildId){if(!data||data.schema!==1||data.guildId!==guildId||!data.config)throw new Error('Invalid or mismatched backup');const safe={...data.config,guildId};delete safe._id;delete safe.__v;return GuildConfig.findOneAndUpdate({guildId},{$set:safe},{upsert:true,new:true});}
module.exports={createBackup,restoreBackup};
