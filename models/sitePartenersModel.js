// // waitlist.js
// const mongoose = require('mongoose');

// const SitePartnersWaitlistSchema = new mongoose.Schema({
//   email: { type: String, required: true },
// });

// module.exports = mongoose.model('SitePartnerWaitlist', SitePartnersWaitlistSchema);




const mongoose = require('mongoose');

const SitePartnersWaitlistSchema = new mongoose.Schema({
    email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  source: {
    type: String,
    required: true,
    default: 'direct'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SitePartnerWaitlist',
    default: null
  },
  referralCount: {
    type: Number,
    default: 0
  },
  metadata: {
    platform: String,
    browser: String,
    location: String,
    deviceType: String,
    screenResolution: String
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for performance
SitePartnersWaitlistSchema.index({ email: 1, status: 1 });
SitePartnersWaitlistSchema.index({ referralCode: 1 });
SitePartnersWaitlistSchema.index({ createdAt: 1 });

module.exports = mongoose.model('SitePartnerWaitlist', SitePartnersWaitlistSchema);
