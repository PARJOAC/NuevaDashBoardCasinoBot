const mongoose = require("mongoose");
const config = require("../config/schemaGuild.json");

/**
 * GuildSchema defines the structure for storing guild-specific settings in the database.
 *
 * @property {String} guildId - The unique identifier for the guild. This field is required and must be unique.
 * @property {String} lang - The language setting for the guild. Defaults to "en".
 * @property {Boolean} economyType - Indicates whether the economy type is enabled. Defaults to false.
 * @property {String} commandChannel - The ID of the command channel. Defaults to null.
 * @property {String} logChannel - The ID of the log channel. Defaults to null.
 * @property {Number} initBalance - The initial balance for new members. Defaults to the value from environment variables.
 * @property {Number} maxBet - The maximum bet amount. Defaults to the value from environment variables.
 * @property {Number} minBet - The minimum bet amount. Defaults to the value from environment variables.
 * @property {Number} xpLevel - The experience level required for certain actions. Defaults to the value from environment variables.
 * @property {Number} initBalloons - The initial number of balloons for new members. Defaults to the value from environment variables.
 * @property {Number} initMobiles - The initial number of mobiles for new members. Defaults to the value from environment variables.
 * @property {Number} initBikes - The initial number of bikes for new members. Defaults to the value from environment variables.
 * @property {Number} initMultiplier - The initial multiplier for new members. Defaults to the value from environment variables.
 * @property {Number} initLevel - The initial level for new members. Defaults to the value from environment variables.
 * @property {Number} maxBetLvl5 - The maximum bet amount for level 5. Defaults to the value from environment variables.
 * @property {Number} maxBetLvl15 - The maximum bet amount for level 15. Defaults to the value from environment variables.
 * @property {Number} maxBetLvl35 - The maximum bet amount for level 35. Defaults to the value from environment variables.
 * @property {Number} maxBetLvl75 - The maximum bet amount for level 75. Defaults to the value from environment variables.
 * @property {Number} rewardWork - The reward for working. Defaults to the value from environment variables.
 * @property {Number} rewardDaily - The daily reward. Defaults to the value from environment variables.
 * @property {Number} rewardWeekly - The weekly reward. Defaults to the value from environment variables.
 * @property {Boolean} levelStatus - Indicates whether the level system is enabled. Defaults to true.
 * @property {Boolean} itemStatus - Indicates whether the item system is enabled. Defaults to true.
 * @property {Boolean} vipServer - Indicates whether the guild is a VIP server. Defaults to false.
 * @property {String[]} commandsNotUsed - An array of command names that are not used in the guild.
 */
const GuildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    lang: { type: String, default: "en" },
    economyType: { type: Boolean, default: false },
    commandChannel: { type: String, default: null },
    logChannel: { type: String, default: null },
    initBalance: { type: Number, default: parseInt(config.initBalance) },
    maxBet: { type: Number, default: parseInt(config.maxBetAllowed) },
    minBet: { type: Number, default: parseInt(config.minBetAllowed) },
    xpLevel: { type: Number, default: parseInt(config.xpLevel) },
    initBalloon: { type: Number, default: parseInt(config.initBalloon) },
    initMobile: { type: Number, default: parseInt(config.initMobile) },
    initBike: { type: Number, default: parseInt(config.initBike) },
    initCar: { type: Number, default: parseInt(config.initCar) },
    initCastle: { type: Number, default: parseInt(config.initCastle) },
    initMultiplier: { type: Number, default: parseInt(config.initMultiplier) },
    initLevel: { type: Number, default: parseInt(config.initLevel) },
    maxBetLvl5: { type: Number, default: parseInt(config.maxBetLvl5) },
    maxBetLvl15: { type: Number, default: parseInt(config.maxBetLvl15) },
    maxBetLvl35: { type: Number, default: parseInt(config.maxBetLvl35) },
    maxBetLvl75: { type: Number, default: parseInt(config.maxBetLvl75) },
    maxBetLvl150: { type: Number, default: parseInt(config.maxBetLvl150) },
    maxBetLvl300: { type: Number, default: parseInt(config.maxBetLvl300) },
    rewardWork: { type: Number, default: parseInt(config.rewardWork) },
    rewardDaily: { type: Number, default: parseInt(config.rewardDaily) },
    rewardWeekly: { type: Number, default: parseInt(config.rewardWeekly) },
    levelStatus: { type: Boolean, default: true },
    itemStatus: { type: Boolean, default: true },
    vipServer: { type: Boolean, default: false },
    commandsNotUsed: [String],
});

const Guild = mongoose.model("Guild", GuildSchema);
module.exports = Guild;
