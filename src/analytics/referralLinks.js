const { StatSchema } = require('../models'),
	cron = require('node-cron'),
	{ logger } = require('../utils');


class ReferralLinks {
	constructor() {
		this.initialise = false;
	}
	async updateCounter(link) {
		if (!this.initialise) this.init();
		try {
			let statistic = await StatSchema.findOne({ name: link });
			if (statistic) {
				await StatSchema.findOneAndUpdate({ name: link }, { $inc: { count: 1 } });
			} else {
				statistic = new StatSchema({
					name: link,
					count: 1,
				});
				await statistic.save();
			}
		} catch (err) {
			logger.log(`Analytics: ${err.message}`, 'error');
		}
	}

	// Handle
	init() {
		this.initialise = true;
		console.log('boo');
		// At the end of every day reset it and add to week counter
		cron.schedule('59 23 * * *', async function() {
			logger.log('Resetting daily counter and updating weekly counter');
			const stats = await StatSchema.find();
			for (const item of stats) {
				item.weekly += item.daily;
				item.daily = 0;
				await item.save();
			}
		});

		// At the end of every week reset it and add to month counter
		cron.schedule('* * * * 7', async function() {
			logger.log('Resetting weekly counter and updating monthly counter');
			const stats = await StatSchema.find();
			for (const item of stats) {
				item.monthly += item.weekly;
				item.weekly = 0;
				await item.save();
			}
		});

		// At the end of every month reset it and add to year counter
		cron.schedule('* * 31 * *', async function() {
			logger.log('Resetting monthly counter and updating yearly counter');
			const stats = await StatSchema.find();
			for (const item of stats) {
				item.yearly += item.monthly;
				item.monthly = 0;
				await item.save();
			}
		});
	}
}

module.exports = ReferralLinks;
