// Shared template variables for all message modules.
// `mentionMode: 'name'` is important for embeds: Discord does not resolve
// user mentions inside embed titles/descriptions, so show a readable name.
function applyVariables(input, context = {}, options = {}) {
  const { user, guild, member, inviter, inviteCode, inviteUses, inviterName, channel, role, message, client } = context;
  const displayName = member?.displayName || user?.globalName || user?.username || '';
  const userName = user?.username || member?.user?.username || '';
  const userTag = user?.tag || (userName ? `${userName}` : '');
  const userMention = user?.id ? `<@${user.id}>` : '';
  const inviterMention = inviter?.id ? `<@${inviter.id}>` : (inviterName || 'Unknown');
  const joinedAt = member?.joinedAt || null;
  const createdAt = user?.createdAt || null;
  const serverCreatedAt = guild?.createdAt || null;
  const avatar = user?.displayAvatarURL?.({ size: 1024, extension: 'png' }) || '';
  const memberAvatar = member?.displayAvatarURL?.({ size: 1024, extension: 'png' }) || avatar;
  const serverIcon = guild?.iconURL?.({ size: 1024, extension: 'png' }) || '';
  const ownerId = guild?.ownerId || '';
  const ownerMention = ownerId ? `<@${ownerId}>` : '';
  const values = {
    // User identity
    '{user}': options.mentionMode === 'name' ? displayName : userMention,
    '{mention}': options.mentionMode === 'name' ? displayName : userMention,
    '{userMention}': options.mentionMode === 'name' ? displayName : userMention,
    '{username}': userName, '{displayName}': displayName, '{globalName}': user?.globalName || '',
    '{userid}': user?.id || '', '{userId}': user?.id || '', '{usertag}': userTag,
    '{discriminator}': user?.discriminator && user.discriminator !== '0' ? user.discriminator : '',
    '{userAvatar}': avatar, '{userAvatarURL}': avatar, '{useravatarurl}': avatar,
    '{memberAvatar}': memberAvatar, '{serverAvatar}': memberAvatar,
    '{userCreatedAt}': createdAt?.toISOString?.() || '', '{userCreatedTimestamp}': createdAt ? String(Math.floor(createdAt.getTime()/1000)) : '', '{accountAge}': createdAt ? ageText(createdAt) : '',
    '{joinedAt}': joinedAt?.toISOString?.() || '', '{joinedTimestamp}': joinedAt ? String(Math.floor(joinedAt.getTime()/1000)) : '', '{joinDate}': joinedAt?.toLocaleDateString?.() || '',
    '{joinTime}': joinedAt?.toLocaleString?.() || '', '{memberCountOrdinal}': ordinal(guild?.memberCount || 0),
    // Server / guild
    '{server}': guild?.name || '', '{serverName}': guild?.name || '', '{guildName}': guild?.name || '',
    '{serverId}': guild?.id || '', '{guildId}': guild?.id || '', '{memberCount}': String(guild?.memberCount ?? ''),
    '{guildMemberCount}': String(guild?.memberCount ?? ''), '{serverIcon}': serverIcon, '{serverIconURL}': serverIcon,
    '{serverOwnerId}': ownerId, '{serverOwner}': options.mentionMode === 'name' ? (guild?.members?.cache?.get(ownerId)?.displayName || 'Server Owner') : ownerMention,
    '{serverCreatedAt}': serverCreatedAt?.toISOString?.() || '', '{serverCreatedTimestamp}': serverCreatedAt ? String(Math.floor(serverCreatedAt.getTime()/1000)) : '',
    '{serverBoostCount}': String(guild?.premiumSubscriptionCount ?? 0), '{serverBoostLevel}': String(guild?.premiumTier ?? 0),
    '{timestamp}': `<t:${Math.floor(Date.now()/1000)}:F>`, '{unix}': String(Math.floor(Date.now()/1000)), '{date}': new Date().toLocaleDateString(), '{time}': new Date().toLocaleTimeString(),
    // Channel / role / message context
    '{channel}': channel?.name || message?.channel?.name || '', '{channelName}': channel?.name || message?.channel?.name || '',
    '{channelId}': channel?.id || message?.channelId || '', '{channelMention}': channel?.id ? `<#${channel.id}>` : '',
    '{role}': role?.name || '', '{roleName}': role?.name || '', '{roleId}': role?.id || '',
    '{message}': message?.content || '', '{messageId}': message?.id || '',
    '{bot}': client?.user?.username || '', '{botName}': client?.user?.username || '', '{botId}': client?.user?.id || '',
    // Invite tracker
    '{inviter}': options.mentionMode === 'name' ? (inviter?.username || inviterName || 'Unknown') : inviterMention,
    '{inviterName}': inviter?.username || inviterName || 'Unknown', '{inviterId}': inviter?.id || '',
    '{inviteCode}': inviteCode || '', '{inviteUses}': String(inviteUses ?? ''),
    // Legacy dollar-style aliases (kept compatible)
    '${userid}': user?.id || '', '${username}': userName, '${usertag}': userTag,
    '${usermention}': options.mentionMode === 'name' ? displayName : userMention,
    '${useravatarurl}': avatar, '${userserveravatarurl}': memberAvatar,
    '${guildmembercount}': String(guild?.memberCount ?? ''), '${guildname}': guild?.name || '',
    '${guildid}': guild?.id || '', '${channelname}': channel?.name || message?.channel?.name || ''
  };
  let output = String(input ?? '');
  // Longest-first avoids shorter aliases partially consuming longer tokens.
  for (const key of Object.keys(values).sort((a, b) => b.length - a.length)) {
    output = output.split(key).join(String(values[key] ?? ''));
  }
  return output;
}
function ageText(date) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  if (days < 1) return 'less than a day';
  const years = Math.floor(days / 365), months = Math.floor((days % 365) / 30), remaining = days % 30;
  return [years && `${years}y`, months && `${months}mo`, remaining && `${remaining}d`].filter(Boolean).join(' ') || '0d';
}
function ordinal(n) { const v = Number(n) || 0; const s = ['th','st','nd','rd']; const x = v % 100; return `${v}${s[(x-20)%10] || s[x] || s[0]}`; }
const VARIABLE_LIST = [
  '{user}','{mention}','{userMention}','{username}','{displayName}','{globalName}','{userid}','{userId}','{usertag}','{discriminator}',
  '{userAvatar}','{userAvatarURL}','{memberAvatar}','{serverAvatar}','{userCreatedAt}','{userCreatedTimestamp}','{accountAge}','{joinedAt}','{joinedTimestamp}','{joinDate}','{joinTime}','{memberCountOrdinal}',
  '{server}','{serverName}','{guildName}','{serverId}','{guildId}','{memberCount}','{guildMemberCount}','{serverIcon}','{serverIconURL}','{serverOwner}','{serverOwnerId}','{serverCreatedAt}','{serverCreatedTimestamp}','{serverBoostCount}','{serverBoostLevel}','{timestamp}','{unix}','{date}','{time}',
  '{channel}','{channelName}','{channelId}','{channelMention}','{role}','{roleName}','{roleId}','{message}','{messageId}','{bot}','{botName}','{botId}',
  '{inviter}','{inviterName}','{inviterId}','{inviteCode}','{inviteUses}',
  '${userid}','${username}','${usertag}','${usermention}','${useravatarurl}','${userserveravatarurl}','${guildmembercount}','${guildname}','${guildid}','${channelname}'
];
module.exports = { applyVariables, VARIABLE_LIST };
