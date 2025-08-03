const mongoose = require("mongoose");
const config = require("./config.json");

/**
 * Returns the default values for a user schema.
 *
 * @returns {Object} An object containing the default values for the user schema.
 * @returns {Object} return.userId - User ID information.
 * @returns {String} return.userId.type - The type of the user ID.
 * @returns {Boolean} return.userId.required - Whether the user ID is required.
 * @returns {Boolean} return.userId.unique - Whether the user ID is unique.
 * @returns {Object} return.balance - Balance information.
 * @returns {Number} return.balance.type - The type of the balance.
 * @returns {Number} return.balance.default - The default balance value.
 * @returns {Object} return.level - Level information.
 * @returns {Number} return.level.type - The type of the level.
 * @returns {Number} return.level.default - The default level value.
 * @returns {Object} return.experience - Experience information.
 * @returns {Number} return.experience.type - The type of the experience.
 * @returns {Number} return.experience.default - The default experience value.
 * @returns {Object} return.maxBet - Max bet information.
 * @returns {Number} return.maxBet.type - The type of the max bet.
 * @returns {Number} return.maxBet.default - The default max bet value.
 * @returns {Object} return.swag - Swag information.
 * @returns {Object} return.swag.balloons - Balloons information.
 * @returns {Number} return.swag.balloons.type - The type of the balloons.
 * @returns {Number} return.swag.balloons.default - The default balloons value.
 * @returns {Object} return.swag.mobile - Mobile information.
 * @returns {Number} return.swag.mobile.type - The type of the mobile.
 * @returns {Number} return.swag.mobile.default - The default mobile value.
 * @returns {Object} return.swag.bike - Bike information.
 * @returns {Number} return.swag.bike.type - The type of the bike.
 * @returns {Number} return.swag.bike.default - The default bike value.
 * @returns {Object} return.lastWork - Last work information.
 * @returns {Number} return.lastWork.type - The type of the last work.
 * @returns {Number} return.lastWork.default - The default last work value.
 * @returns {Object} return.lastDaily - Last daily information.
 * @returns {Number} return.lastDaily.type - The type of the last daily.
 * @returns {Number} return.lastDaily.default - The default last daily value.
 * @returns {Object} return.lastWeekly - Last weekly information.
 * @returns {Number} return.lastWeekly.type - The type of the last weekly.
 * @returns {Number} return.lastWeekly.default - The default last weekly value.
 * @returns {Object} return.lastBlackJack - Last BlackJack information.
 * @returns {Number} return.lastBlackJack.type - The type of the last BlackJack.
 * @returns {Number} return.lastBlackJack.default - The default last BlackJack value.
 * @returns {Object} return.lastCoinFlip - Last CoinFlip information.
 * @returns {Number} return.lastCoinFlip.type - The type of the last CoinFlip.
 * @returns {Number} return.lastCoinFlip.default - The default last CoinFlip value.
 * @returns {Object} return.lastCrash - Last Crash information.
 * @returns {Number} return.lastCrash.type - The type of the last Crash.
 * @returns {Number} return.lastCrash.default - The default last Crash value.
 * @returns {Object} return.lastMinesweeper - Last Minesweeper information.
 * @returns {Number} return.lastMinesweeper.type - The type of the last Minesweeper.
 * @returns {Number} return.lastMinesweeper.default - The default last Minesweeper value.
 * @returns {Object} return.lastRace - Last Race information.
 * @returns {Number} return.lastRace.type - The type of the last Race.
 * @returns {Number} return.lastRace.default - The default last Race value.
 * @returns {Object} return.lastRoulette - Last Roulette information.
 * @returns {Number} return.lastRoulette.type - The type of the last Roulette.
 * @returns {Number} return.lastRoulette.default - The default last Roulette value.
 * @returns {Object} return.lastRps - Last RPS information.
 * @returns {Number} return.lastRps.type - The type of the last RPS.
 * @returns {Number} return.lastRps.default - The default last RPS value.
 * @returns {Object} return.lastRussianRoulette - Last Russian Roulette information.
 * @returns {Number} return.lastRussianRoulette.type - The type of the last Russian Roulette.
 * @returns {Number} return.lastRussianRoulette.default - The default last Russian Roulette value.
 * @returns {Object} return.lastSlot - Last Slot information.
 * @returns {Number} return.lastSlot.type - The type of the last Slot.
 * @returns {Number} return.lastSlot.default - The default last Slot value.
 * @returns {Object} return.lastVote - Last Vote information.
 * @returns {Number} return.lastVote.type - The type of the last Vote.
 * @returns {Number} return.lastVote.default - The default last Vote value.
 * @returns {Object} return.lastCrime - Last Crime information.
 * @returns {Number} return.lastCrime.type - The type of the last Crime.
 * @returns {Number} return.lastCrime.default - The default last Crime value.
 * @returns {Object} return.multiplier - Votes information.
 */
function getDefaultValues() {
    return {
        userId: { type: String, required: true, unique: true },
        balance: { type: Number, default: parseInt(config.initBalance) },
        level: { type: Number, default: parseInt(config.initLevel) },
        experience: { type: Number, default: 0 },
        swag: {
            balloon: { type: Number, default: parseInt(config.initBalloon) },
            mobile: { type: Number, default: parseInt(config.initMobile) },
            bike: { type: Number, default: parseInt(config.initBike) },
            car: { type: Number, default: parseInt(config.initCar) },
            castle: { type: Number, default: parseInt(config.initCastle) },
        },
        lastWork: { type: Number, default: 0 },
        lastDaily: { type: Number, default: 0 },
        lastWeekly: { type: Number, default: 0 },
        lastBlackJack: { type: Number, default: 0 },
        lastCoinFlip: { type: Number, default: 0 },
        lastCrash: { type: Number, default: 0 },
        lastMinesweeper: { type: Number, default: 0 },
        lastRace: { type: Number, default: 0 },
        lastRoulette: { type: Number, default: 0 },
        lastRps: { type: Number, default: 0 },
        lastRussianRoulette: { type: Number, default: 0 },
        lastSlot: { type: Number, default: 0 },
        lastVote: { type: Number, default: 0 },
        lastCrime: { type: Number, default: 0 },
        multiplier: {
            type: Number,
            default: parseFloat(config.initMultiplier).toFixed(2),
        },
        battlePass: {
            active: { type: Boolean, default: false },
            level: { type: Number, default: 1 },
            rewardsClaimed: {
                type: [Number], // Arreglo de números de los niveles reclamados
                default: [],
            },
            experience: { type: Number, default: 0 },
        },
    };
}

/**
 * Creates and returns a new Mongoose schema with default values.
 *
 * @returns {mongoose.Schema} A new Mongoose schema instance.
 */
function getInfoSchema() {
    return new mongoose.Schema(getDefaultValues());
}

/**
 * Retrieves the default information schema based on the default values defined in the schema definition.
 *
 * @function
 * @returns {Object} An object containing the default information schema.
 */
function getDefaultInfo() {
    const schemaDefinition = getDefaultValues();
    const defaultInfo = {};

    for (const [key, value] of Object.entries(schemaDefinition)) {
        if (typeof value === "object" && value.default !== undefined) {
            defaultInfo[key] = value.default;
        } else if (typeof value === "object" && !value.default) {
            defaultInfo[key] = {};
            for (const [subKey, subValue] of Object.entries(value)) {
                defaultInfo[key][subKey] = subValue.default;
            }
        }
    }

    return defaultInfo;
}

module.exports = { getInfoSchema, getDefaultInfo };
