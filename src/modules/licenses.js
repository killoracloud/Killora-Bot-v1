const crypto=require('crypto');const License=require('../models/License');
async function activate(key,ownerId){const license=await License.findOne({key:String(key||'').trim(),active:true});if(!license)throw new Error('Invalid or inactive license key');if(license.expiresAt&&license.expiresAt<Date.now())throw new Error('License has expired');if(license.ownerId&&license.ownerId!==ownerId)throw new Error('License is already assigned');license.ownerId=ownerId;await license.save();return license;}
async function create(plan='premium',days=30,features=['*']){const key='KILLORA-'+crypto.randomBytes(18).toString('hex').toUpperCase();return License.create({key,plan,features,expiresAt:days>0?new Date(Date.now()+days*86400000):null});}
module.exports={activate,create};
