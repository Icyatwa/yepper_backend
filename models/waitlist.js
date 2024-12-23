// // waitlist.js
// const mongoose = require('mongoose');

// const waitlistSchema = new mongoose.Schema({
//   email: { type: String, required: true },
// });

// module.exports = mongoose.model('Waitlist', waitlistSchema);


const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
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
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waitlist',
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

// Indexes
waitlistSchema.index({ email: 1 }, { unique: true });
waitlistSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
waitlistSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);
