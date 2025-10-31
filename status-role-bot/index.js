const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const SetupSettings = require("./models/statusSchema");
const config = require("./config.js");

// Discord Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences],
    partials: [Partials.User, Partials.GuildMember]
});

// MongoDB Bağlantısı
mongoose
    .connect(config.mongoURI)
    .then(() => console.log("✅ [DATABASE] MongoDB bağlantısı başarılı"))
    .catch((err) => console.error("❌ [DATABASE] Bağlantı hatası:", err));

// Bot Hazır
client.once("clientReady", async () => {
    console.log(`🤖 ${client.user.tag} aktif!`);
    console.log("📡 Status tarama sistemi başlatıldı...");
    const INTERVAL = config.interval || 5000;

    setInterval(async () => {
        try {
            for (const guild of client.guilds.cache.values()) {
                const data = await SetupSettings.findOne({ guildID: guild.id }).lean();
                if (!data || !data.statusMode) continue;
                if (!data.statusRole || !data.statusKeywords?.length) continue;
                const role = guild.roles.cache.get(data.statusRole);
                if (!role) continue;
                const keywords = data.statusKeywords.map(k => k.toLowerCase());

                guild.members.cache.forEach(async (member) => {
                    if (!member.presence || member.user.bot) return;

                    const customStatus = member.presence.activities?.find(a => a.type === 4);
                    const statusText = (customStatus?.state || "").toLowerCase();
                    const matched = keywords.some(keyword => statusText.includes(keyword));
                    const hasRole = member.roles.cache.has(role.id);

                    if (matched && !hasRole) {
                        await member.roles.add(role, "Durumda keyword bulundu.");
                        sendLog(guild, member, role, "eklendi", statusText);
                    } else if (!matched && hasRole) {
                        await member.roles.remove(role, "Durumdan keyword kaldırıldı.");
                        sendLog(guild, member, role, "kaldırıldı", statusText);
                    }
                });
            }
        } catch (err) {
            console.error("[STATUS-SCANNER] Hata:", err);
        }
    }, INTERVAL);
});

async function sendLog(guild, member, role, action, statusText) {
    const logChannel =
        guild.channels.cache.find(ch => ch.name === "status-log") ||
        guild.channels.cache.find(ch => ch.name.includes("statuslog"));
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(action === "eklendi" ? 0x00ff00 : 0xff0000)
        .setTitle(`💠 Status Rol ${action.toUpperCase()}`)
        .setDescription(
            `👤 **Kullanıcı:** ${member.user.tag}\n` +
            `🎭 **Rol:** ${role.name}\n` +
            `💬 **Durum:** ${statusText || "Yok"}`
        )
        .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => { });
}

client.login(config.token);