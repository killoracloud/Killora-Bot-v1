const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { Shoukaku, Connectors } = require('shoukaku');
const BRAND = 'Killora Bot • Discord community bot';
const states = new Map();
const DEFAULTS = { enabled: true, voiceChannelId: '', textChannelId: '', djRoleId: '', alwaysOn: false, queueLimit: 100, defaultVolume: 80, allowExternalUrls: true };
let shoukaku;
function state(id) { if (!states.has(id)) states.set(id, { queue: [], current: null, player: null, textChannel: null, voiceChannel: null, loop: 'off', volume: 80, filter: 'clear', panel: null, ended: false, position: 0, settings: { ...DEFAULTS }, busy: false, generation: 0 }); return states.get(id); }
async function settings(id) { const cfg = await GuildConfig.findOne({ guildId: id }).lean().catch(() => null); return { ...DEFAULTS, ...(cfg?.music || {}) }; }
function fmt(ms = 0) { const n = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; }
function progress(s) { const total = Number(s.current?.info?.length || 0); if (!total) return '🔴 LIVE'; const pos = Number(s.position ?? s.player?.position ?? 0); const p = Math.min(1, pos / total), n = Math.round(p * 18); return `${'▰'.repeat(n)}${'▱'.repeat(18 - n)} ${fmt(pos)} / ${fmt(total)}`; }
function panelEmbed(s, ended = s.ended) { const t = s.current, e = new EmbedBuilder().setColor(ended ? 0xed4245 : 0x39ff14).setTitle(ended ? '⏹ Queue ended' : '🎶 Killora Bot Music').setDescription(ended ? 'There are no more tracks in the queue. Add another song with `/play`.' : t ? `**[${t.info.title}](${t.info.uri || 'https://discord.com'})**\n${progress(s)}\n👤 <@${t.requester}>` : 'Nothing is playing.').addFields({ name: 'Queue', value: `${s.queue.length} track(s)`, inline: true }, { name: 'Volume', value: `${s.volume}%`, inline: true }, { name: 'Loop', value: s.loop, inline: true }, { name: 'Audio Filter', value: s.filter || 'clear', inline: true }).setFooter({ text: BRAND }); if (t?.info?.artworkUrl) e.setThumbnail(t.info.artworkUrl); return e; }
function controls() { const options = Object.keys(FILTER_PRESETS).map(key => ({ label: key === 'clear' ? 'Clear filters' : key.toUpperCase(), value: key, description: key === 'clear' ? 'Turn off every audio effect' : `Apply ${key} audio effect` })); return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('music:pause').setLabel('Pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('music:resume').setLabel('Resume').setEmoji('▶️').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('music:skip').setLabel('Skip').setEmoji('⏭️').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('music:stop').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('music:loop').setLabel('Loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary)), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('music:queue').setLabel('Queue').setEmoji('📜').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('music:shuffle').setLabel('Shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary)), new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('music:filter').setPlaceholder('🎛️ Choose an audio filter').addOptions(options).setMinValues(1).setMaxValues(1))]; }
const FILTER_PRESETS = {
  clear: null,
  '8d': { rotation: { rotationHz: 0.2 } },
  tremolo: { tremolo: { frequency: 4, depth: 0.75 } },
  vibrato: { vibrato: { frequency: 4, depth: 0.75 } },
  bassboost: { equalizer: [{band:0,gain:0.18},{band:1,gain:0.16},{band:2,gain:0.13},{band:3,gain:0.09}] },
  bass2x: { equalizer: [{band:0,gain:0.25},{band:1,gain:0.23},{band:2,gain:0.19},{band:3,gain:0.13}] },
  bass4x: { equalizer: [{band:0,gain:0.38},{band:1,gain:0.34},{band:2,gain:0.28},{band:3,gain:0.20}] },
  nightcore: { timescale: { speed: 1.15, pitch: 1.15, rate: 1 } },
  vaporwave: { timescale: { speed: 0.85, pitch: 0.8, rate: 1 } },
  slowed: { timescale: { speed: 0.88, pitch: 1, rate: 1 } },
  '8d+tremolo': { rotation: { rotationHz: 0.2 }, tremolo: { frequency: 3, depth: 0.45 } },
  karaoke: { karaoke: { level: 1, monoLevel: 1, filterBand: 220, filterWidth: 100 } },
  chipmunk: { timescale: { speed: 1.25, pitch: 1.35, rate: 1 } },
  deep: { equalizer: [{band:0,gain:0.22},{band:1,gain:0.18},{band:2,gain:0.10},{band:8,gain:-0.08},{band:9,gain:-0.10}] },
  treble: { equalizer: [{band:0,gain:-0.10},{band:1,gain:-0.06},{band:10,gain:0.12},{band:11,gain:0.16},{band:12,gain:0.18}] },
  pop: { equalizer: [{band:0,gain:0.08},{band:1,gain:0.05},{band:4,gain:-0.04},{band:7,gain:0.08},{band:10,gain:0.10}] },
  rock: { equalizer: [{band:0,gain:0.12},{band:3,gain:0.08},{band:5,gain:-0.05},{band:8,gain:0.10},{band:11,gain:0.12}] },
  electronic: { equalizer: [{band:0,gain:0.12},{band:1,gain:0.10},{band:5,gain:-0.06},{band:9,gain:0.10},{band:12,gain:0.12}] },
  soft: { equalizer: [{band:0,gain:-0.04},{band:1,gain:-0.02},{band:5,gain:0.06},{band:8,gain:0.05},{band:10,gain:-0.04}] },
  lowpass: { lowPass: { smoothing: 20 } },
  mono: { channelMix: { leftToLeft: 0.5, leftToRight: 0.5, rightToLeft: 0.5, rightToRight: 0.5 } },
  '8d+nightcore': { rotation: { rotationHz: 0.2 }, timescale: { speed: 1.12, pitch: 1.12, rate: 1 } }
};
async function applyMusicFilter(s, preset) {
  if (!Object.prototype.hasOwnProperty.call(FILTER_PRESETS, preset)) throw Error('Unknown filter preset.');
  // Clear first so selecting a new preset never leaves parts of the previous effect active.
  await s.player.clearFilters();
  const config = FILTER_PRESETS[preset];
  if (config) await s.player.setFilters(config);
  s.filter = preset;
}

function initMusic(client) {
  const host = process.env.LAVALINK_HOST, password = process.env.LAVALINK_PASSWORD;
  if (!host || !password) { console.warn('[Lavalink] Missing LAVALINK_HOST or LAVALINK_PASSWORD; music commands will report setup required.'); return null; }
  const port = Number(process.env.LAVALINK_PORT || 2333), secure = String(process.env.LAVALINK_SECURE || 'false').toLowerCase() === 'true';
  shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [{ name: process.env.LAVALINK_NAME || 'Killora-Main', url: `${host}:${port}`, auth: password, secure }], { resume: true, resumeTimeout: 90, reconnectTries: 15, reconnectInterval: 5 });
  shoukaku.on('ready', (name) => console.log(`[Lavalink] Node connected: ${name}`));
  shoukaku.on('error', (name, error) => console.error(`[Lavalink:${name}]`, error));
  shoukaku.on('close', (name, code, reason) => console.warn(`[Lavalink:${name}] closed: ${code} ${reason || ''}`));
  return shoukaku;
}
async function refresh(s) { if (s.panel) await s.panel.edit({ embeds: [panelEmbed(s)], components: s.ended ? [] : controls() }).catch(() => { s.panel = null; }); }
async function playNext(guildId, s) {
  if (s.busy || !s.player) return;
  s.busy = true;
  try {
    if (s.loop === 'track' && s.current) {
      // Keep current track and replay it.
    } else if (s.queue.length) {
      s.current = s.queue.shift();
    } else if (s.loop === 'queue' && s.current) {
      s.queue.push(s.current);
      s.current = s.queue.shift();
    } else {
      s.current = null;
      s.position = 0;
      s.ended = true;
      await refresh(s); // Update the existing player panel; do not post a duplicate.
      return;
    }
    s.ended = false;
    s.position = 0;
    const generation = ++s.generation;
    // Ensure the player is audible and volume is applied before playback starts.
    await s.player.setPaused(false);
    await s.player.setGlobalVolume(Math.max(0, Math.min(100, Number(s.volume) || 0)) * 10);
    await s.player.playTrack({ track: { encoded: s.current.encoded } });
    await refresh(s);
    console.log(`[Music] Track requested in ${guildId}: ${s.current.info.title} (generation ${generation})`);
  } catch (e) {
    console.error('[Lavalink playback]', e);
    if (s.textChannel) await s.textChannel.send(`⚠️ Could not start audio: ${String(e.message || e).slice(0, 250)}\nCheck Lavalink node logs and voice connection.\n-# ${BRAND}`).catch(() => {});
    s.current = null;
    s.position = 0;
    if (s.queue.length) setImmediate(() => playNext(guildId, s));
    else { s.ended = true; await refresh(s); }
  } finally { s.busy = false; }
}
function bindPlayer(guildId, player, s) {
  player.on('start', () => { s.position = 0; s.ended = false; refresh(s).catch(() => {}); console.log(`[Lavalink] TrackStartEvent in ${guildId}`); });
  player.on('update', (event) => { if (Number.isFinite(event?.state?.position)) s.position = event.state.position; });
  player.on('end', (event) => {
    const reason = String(event?.reason || '').toLowerCase();
    console.log(`[Lavalink] TrackEndEvent in ${guildId}: ${reason || 'unknown'}`);
    if (reason === 'replaced' || reason === 'cleanup') return;
    if (s.current) {
      const done = s.current;
      if (s.loop === 'track' && reason === 'finished') s.queue.unshift(done);
      else if (s.loop === 'queue' && reason === 'finished') s.queue.push(done);
      s.current = null;
    }
    s.position = 0;
    playNext(guildId, s);
  });
  player.on('exception', (event) => {
    const detail = event.exception?.message || event.error || 'Unknown playback error';
    console.error('[Lavalink track exception]', event.exception || event);
    if (s.textChannel) s.textChannel.send(`⚠️ Lavalink track error: ${String(detail).slice(0, 300)}\n-# ${BRAND}`).catch(() => {});
    s.current = null; s.position = 0; playNext(guildId, s);
  });
  player.on('stuck', (event) => {
    console.warn(`[Lavalink] Track stuck in ${guildId} after ${event?.thresholdMs || 'unknown'}ms; skipping.`);
    player.stopTrack().catch(() => {});
  });
  player.on('closed', (event) => console.warn(`[Lavalink] Voice websocket closed in ${guildId}:`, event?.code, event?.reason));
}
async function ensurePlayer(i, s) {
  const cfg = await settings(i.guildId); s.settings = cfg;
  if (cfg.enabled === false) throw Error('Music is disabled in this server dashboard.');
  if (!shoukaku) throw Error('Lavalink is not configured. Add LAVALINK_HOST, LAVALINK_PORT and LAVALINK_PASSWORD in WispByte Startup → Variables.');
  if (cfg.textChannelId) { const c = await i.guild.channels.fetch(cfg.textChannelId).catch(() => null); if (c?.isTextBased()) s.textChannel = c; }
  const channel = i.member?.voice?.channel;
  if (!channel) throw Error('Join a voice channel first.');
  if (cfg.voiceChannelId && channel.id !== cfg.voiceChannelId) throw Error(`Join the configured music channel <#${cfg.voiceChannelId}> first.`);
  const target = cfg.voiceChannelId || channel.id;
  const me = i.guild.members.me || await i.guild.members.fetchMe(); const perms = channel.permissionsFor(me);
  if (!perms?.has('Connect') || !perms?.has('Speak')) throw Error('I need Connect and Speak permissions in that voice channel.');
  if (s.player && s.voiceChannel !== target) throw Error('I am already connected to another voice channel. Use /stop first.');
  if (!s.player) {
    s.player = await shoukaku.joinVoiceChannel({ guildId: i.guildId, channelId: target, shardId: i.guild.shardId ?? 0, deaf: false, mute: false });
    s.voiceChannel = target; bindPlayer(i.guildId, s.player, s);
    await s.player.setGlobalVolume(Math.max(0, Math.min(100, Number(cfg.defaultVolume ?? 80))) * 10);
  }
  return channel;
}
async function searchTrack(s, query, requester) {
  const q = String(query || '').trim(); if (!q) throw Error('Enter a song name or URL.');
  if (/^https?:\/\//i.test(q) && !s.settings.allowExternalUrls && !/youtube\.com|youtu\.be/i.test(q)) throw Error('External URLs are disabled in the dashboard.');
  const node = s.player?.node || shoukaku?.options?.nodeResolver(shoukaku.nodes);
  if (!node) throw Error('No Lavalink node is currently connected.');
  const result = await node.rest.resolve(/^https?:\/\//i.test(q) ? q : `ytsearch:${q}`);
  if (!result || ['empty', 'error', 'LOAD_FAILED'].includes(String(result.loadType || '').toLowerCase())) throw Error('No playable result found. Check Lavalink source plugins.');
  const payload = result.data ?? result;
  const tracks = Array.isArray(payload) ? payload : payload.tracks ? payload.tracks : payload.encoded ? [payload] : [];
  const t = tracks.find(x => x?.encoded); if (!t) throw Error('No playable audio track returned by Lavalink.');
  return { encoded: t.encoded, info: t.info, requester };
}
function cleanup(guildId, s) { if (shoukaku && s.player) shoukaku.leaveVoiceChannel(guildId).catch(() => {}); s.player = null; s.voiceChannel = null; s.current = null; s.queue = []; s.position = 0; s.ended = true; s.filter = 'clear'; s.busy = false; s.panel = null; }
function canControl(i, s) { if (!s.settings?.djRoleId) return true; return Boolean(i.member?.roles?.cache?.has(s.settings.djRoleId) || i.memberPermissions?.has('ManageGuild')); }
async function handleMusicCommand(i) {
  const name = i.commandName, s = state(i.guildId); s.textChannel = i.channel;
  try {
    if (name === 'play') {
      await i.deferReply(); await ensurePlayer(i, s);
      const track = await searchTrack(s, i.options.getString('query', true), i.user.id);
      if (s.queue.length >= Math.min(500, Number(s.settings.queueLimit) || 100)) throw Error('Queue is full.');
      s.queue.push(track); s.ended = false; const position = s.queue.length + (s.current ? 1 : 0);
      if (!s.current) await playNext(i.guildId, s);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(0x39ff14).setTitle('➕ Added to queue').setDescription(`**[${track.info.title}](${track.info.uri || 'https://discord.com'})**\nPosition: ${position}`).setThumbnail(track.info.artworkUrl || null).setFooter({ text: BRAND })] });
      if (!s.panel) s.panel = await i.channel.send({ embeds: [panelEmbed(s)], components: controls() }); else await refresh(s); return;
    }
    if (!i.deferred && !i.replied) await i.deferReply({ ephemeral: true });
    if (name === 'stop') { cleanup(i.guildId, s); return i.editReply('⏹️ Playback stopped and queue cleared.'); }
    if (!s.player || !s.current) throw Error('Nothing is playing. Use /play first.');
    if (['pause', 'resume', 'skip', 'loop', 'volume', 'shuffle', 'filter'].includes(name) && !canControl(i, s)) throw Error('Only the configured DJ role or server managers can control music.');
    if (name === 'pause') { await s.player.setPaused(true); return i.editReply('⏸️ Paused.'); }
    if (name === 'resume') { await s.player.setPaused(false); return i.editReply('▶️ Resumed.'); }
    if (name === 'skip') { s.loop = 'off'; await s.player.stopTrack(); return i.editReply('⏭️ Skipped.'); }
    if (name === 'queue') { const rows = s.queue.slice(0, 20).map((t, n) => `${n + 1}. **${t.info.title}**`).join('\n'); return i.editReply({ embeds: [new EmbedBuilder().setColor(0x39ff14).setTitle('🎵 Music Queue').setDescription(`${s.current ? `**Now:** ${s.current.info.title}\n\n` : ''}${rows || 'Queue is empty.'}`).setFooter({ text: BRAND })] }); }
    if (name === 'loop') { s.loop = s.loop === 'off' ? 'track' : s.loop === 'track' ? 'queue' : 'off'; await refresh(s); return i.editReply(`🔁 Loop mode: **${s.loop}**`); }
    if (name === 'volume') { s.volume = i.options.getInteger('amount', true); s.volume = Math.max(0, Math.min(100, s.volume)); await s.player.setGlobalVolume(s.volume * 10); return i.editReply(`🔊 Volume: ${s.volume}%`); }
    if (name === 'shuffle') { for (let n = s.queue.length - 1; n > 0; n--) { const j = Math.floor(Math.random() * (n + 1)); [s.queue[n], s.queue[j]] = [s.queue[j], s.queue[n]]; } return i.editReply('🔀 Queue shuffled.'); }
    if (name === 'filter') { const preset = i.options.getString('preset', true); await applyMusicFilter(s, preset); await refresh(s); return i.editReply(`🎛️ Audio filter set to **${preset}**.`); }
    if (name === 'nowplaying') return i.editReply({ embeds: [panelEmbed(s)] });
  } catch (e) { const msg = `⚠️ ${String(e.message || e).slice(0, 450)}`; if (i.deferred || i.replied) return i.editReply({ content: msg, embeds: [] }).catch(() => {}); return i.reply({ content: msg, ephemeral: true }).catch(() => {}); }
}
async function handleMusicButton(i) {
  if (!i.customId?.startsWith('music:')) return false; const s = state(i.guildId), a = i.customId.split(':')[1];
  try {
    if (['pause', 'resume', 'skip', 'stop', 'loop', 'shuffle', 'filter'].includes(a) && !canControl(i, s)) throw Error('Only the configured DJ role or server managers can control music.');
    if (!s.player) throw Error('Nothing is playing.');
    if (a === 'pause') await s.player.setPaused(true); if (a === 'resume') await s.player.setPaused(false); if (a === 'skip') await s.player.stopTrack(); if (a === 'stop') cleanup(i.guildId, s);
    if (a === 'loop') s.loop = s.loop === 'off' ? 'track' : s.loop === 'track' ? 'queue' : 'off';
    if (a === 'shuffle') for (let n = s.queue.length - 1; n > 0; n--) { const j = Math.floor(Math.random() * (n + 1)); [s.queue[n], s.queue[j]] = [s.queue[j], s.queue[n]]; }
    if (a === 'filter') { if (!canControl(i, s)) throw Error('Only the configured DJ role or server managers can control music.'); const preset = i.values?.[0]; await applyMusicFilter(s, preset); await refresh(s); await i.reply({ content: `🎛️ Audio filter: **${preset}**`, ephemeral: true }); return true; }
    if (a === 'queue') { await i.reply({ content: s.queue.slice(0, 15).map((t, n) => `${n + 1}. ${t.info.title}`).join('\n') || (s.current ? 'No upcoming tracks.' : 'Queue is empty; playback has ended.'), ephemeral: true }); return true; }
    await refresh(s); await i.reply({ content: `Music: ${a}`, ephemeral: true });
  } catch (e) { await i.reply({ content: e.message, ephemeral: true }).catch(() => {}); } return true;
}
function updateMusicPanels() { setInterval(() => { for (const s of states.values()) if (s.panel) refresh(s); }, 10000).unref(); }
module.exports = { handleMusicCommand, handleMusicButton, initMusic, updateMusicPanels, FILTER_PRESETS };
