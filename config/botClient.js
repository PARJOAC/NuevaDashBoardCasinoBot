// 📌 botClient.js
// Este archivo inicializa el cliente de Discord.js y lo exporta para usarlo en todo el proyecto

const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Creamos el cliente con permisos para obtener información de los servidores
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel],
    shards: "auto",
});

// Iniciamos sesión con el token del bot desde .env
client.login(process.env.DISCORD_BOT_TOKEN);

// Evento cuando el bot está listo
client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

module.exports = client;
