// // WaitlistController.js
// const Waitlist = require('../models/waitlist');

// exports.createWaitlist = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const newWaitlist = new Waitlist({
//         email,
//     });

//     const savedWaitlist = await newWaitlist.save();
//     res.status(201).json(savedWaitlist);
//   } catch (error) {
//     console.error('Error creating waitlist:', error);
//     res.status(500).json({ message: 'Failed to create waitlist', error });
//   }
// };







// controllers/WaitlistController.js
const Waitlist = require('../models/waitlist');
const { generateReferralCode, validateEmail } = require('../utils/waitlistUtils');

exports.createWaitlist = async (req, res) => {
  try {
    const { email, referralCode, source, metadata } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    // Check for existing email
    const existingUser = await Waitlist.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'This email is already on our waitlist' 
      });
    }

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await Waitlist.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
        await Waitlist.findByIdAndUpdate(referrer._id, {
          $inc: { referralCount: 1 }
        });
      }
    }

    // Detect device type
    const deviceType = req.headers['user-agent'].includes('Mobile') ? 'mobile' : 'desktop';

    // Create new waitlist entry
    const newWaitlist = new Waitlist({
      email,
      source: source || 'direct',
      referralCode: generateReferralCode(),
      referredBy,
      metadata: {
        ...metadata,
        platform: req.headers['user-agent'],
        location: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        deviceType,
        joinedAt: new Date()
      }
    });

    const savedWaitlist = await newWaitlist.save();

    // Get waitlist position
    const position = await Waitlist.countDocuments({
      createdAt: { $lt: savedWaitlist.createdAt }
    }) + 1;

    res.status(201).json({
      success: true,
      data: {
        id: savedWaitlist._id,
        email: savedWaitlist.email,
        referralCode: savedWaitlist.referralCode,
        position
      }
    });

  } catch (error) {
    console.error('Error in waitlist creation:', error);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred while joining the waitlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.checkWaitlistStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    const waitlistEntry = await Waitlist.findOne({ email: email.toLowerCase() });
    
    return res.status(200).json({
      success: true,
      isRegistered: !!waitlistEntry,
      data: waitlistEntry ? {
        id: waitlistEntry._id,
        email: waitlistEntry.email,
        referralCode: waitlistEntry.referralCode,
        joinedAt: waitlistEntry.joinedAt
      } : null
    });
  } catch (error) {
    console.error('Error checking waitlist status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking waitlist status'
    });
  }
};

exports.cancelWaitlist = async (req, res) => {
  try {
    const { email } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    const waitlistEntry = await Waitlist.findOne({ email: email.toLowerCase() });
    
    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in waitlist'
      });
    }

    await Waitlist.deleteOne({ email: email.toLowerCase() });

    return res.status(200).json({
      success: true,
      message: 'Successfully removed from waitlist'
    });
  } catch (error) {
    console.error('Error canceling waitlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error canceling waitlist registration'
    });
  }
};