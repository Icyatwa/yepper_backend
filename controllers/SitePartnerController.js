// SitePartnerController.js
const Waitlist = require('../models/sitePartenersModel');

exports.createWaitlist = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newWaitlist = new Waitlist({
            email,
        });

        const savedWaitlist = await newWaitlist.save();
        res.status(201).json(savedWaitlist);
    } catch (error) {
        console.error('Error creating waitlist:', error);
        res.status(500).json({ message: 'Failed to create waitlist', error });
    }
};