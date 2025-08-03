const OAuth2 = require("discord-oauth2");
const oauth = new OAuth2();

async function getUserGuilds(accessToken) {
    try {
        const guilds = await oauth.getUserGuilds(accessToken);
        return guilds;
    } catch (err) {
        console.error("❌ Error fetching guilds with OAuth2:", err.message);
        return [];
    }
}

module.exports = { getUserGuilds };
