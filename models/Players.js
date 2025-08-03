const mongoose = require("mongoose");
const { getInfoSchema } = require("../config/getInfoSchema");

/**
 * Retrieves or creates a Mongoose model for a player's guild based on the provided guild ID.
 *
 * @param {string} guildId - The unique identifier of the guild.
 * @returns {Promise<mongoose.Model>} - A promise that resolves to the Mongoose model for the player's guild.
 */
async function playerGuild(guildId) {
    const modelName = `PlayerGuild_${guildId}`;

    if (mongoose.models[modelName]) {
        return mongoose.models[modelName];
    }

    const PlayerGuildSchema = getInfoSchema();

    const PlayerGuild = mongoose.model(modelName, PlayerGuildSchema);
    return PlayerGuild;
}

module.exports = { playerGuild };
