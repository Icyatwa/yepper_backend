// PayoutController.js
const axios = require('axios');
const Payment = require('../models/PaymentModel');
const Withdrawal = require('../models/WithdrawalModel');
const mongoose = require('mongoose');

class PayoutService {
  // Validate input parameters
  static validatePayoutInput(amount, phoneNumber, userId) {
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount. Must be a positive number.');
    }

    if (!phoneNumber || !/^(07\d{8})$/.test(phoneNumber)) {
      throw new Error('Invalid phone number. Must start with 07 and be 10 digits.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }
  }

  // Fetch user earnings
  static async fetchUserEarnings(userId) {
    try {
      const response = await axios.get(`https://yepper-backend.onrender.com/api/picture/earnings/${userId}`);
      return response.data.totalEarnings;
    } catch (error) {
      console.error('Error fetching user earnings:', error);
      throw new Error('Could not retrieve user earnings');
    }
  }

  // Prepare Flutterwave payout payload
  static preparePayoutPayload(phoneNumber, amount, tx_ref) {
    return {
      account_bank: "MPS", // Mobile Money Rwanda
      account_number: phoneNumber,
      amount: amount,
      narration: "Creator Earnings Payout",
      currency: "RWF",
      reference: tx_ref,
      callback_url: "https://yepper-backend.onrender.com/api/payout/callback"
    };
  }

  // Log detailed error for debugging
  static logDetailedError(error) {
    console.error('Detailed Payout Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response',
      status: error.response ? error.response.status : 'Unknown',
      headers: error.response ? error.response.headers : 'No headers'
    });
  }
}
 
exports.initiatePayoutTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, phoneNumber, userId } = req.body;

    // Validate input
    PayoutService.validatePayoutInput(amount, phoneNumber, userId);

    // Verify user's earnings
    const totalEarnings = await PayoutService.fetchUserEarnings(userId);

    // Check if user has enough earnings
    if (totalEarnings < amount) {
      return res.status(400).json({ 
        message: 'Insufficient funds',
        currentBalance: totalEarnings 
      });
    }

    // Generate a unique, more robust transaction reference
    const tx_ref = `PAYOUT-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Prepare Flutterwave payout payload
    const payoutPayload = PayoutService.preparePayoutPayload(phoneNumber, amount, tx_ref);

    try {
      // Initiate payout via Flutterwave
      const response = await axios.post('https://api.flutterwave.com/v3/transfers', payoutPayload, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });

      // Create withdrawal record
      const withdrawal = new Withdrawal({
        userId,
        phoneNumber,
        amount,
        status: response.data.status === 'success' ? 'pending' : 'failed'
      });
      await withdrawal.save({ session });

      // Create payment record
      const payment = new Payment({
        tx_ref,
        amount,
        currency: 'RWF',
        status: response.data.status === 'success' ? 'pending' : 'failed',
        phoneNumber,
        userId,
        pictureId: null, // No picture associated with payout
        withdrawalStatus: response.data.status === 'success' ? 'pending' : 'none'
      });
      await payment.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Respond based on Flutterwave response
      if (response.data.status === 'success') {
        return res.status(200).json({ 
          message: 'Payout initiated successfully', 
          reference: tx_ref,
          amount: amount
        });
      } else {
        return res.status(400).json({ 
          message: 'Payout initiation failed', 
          error: response.data 
        });
      }
    } catch (flutterwaveError) {
      // Log detailed Flutterwave error
      PayoutService.logDetailedError(flutterwaveError);

      // Abort transaction
      await session.abortTransaction();
      session.endSession();

      // Handle specific Flutterwave error scenarios
      if (flutterwaveError.response) {
        const errorData = flutterwaveError.response.data;
        return res.status(500).json({ 
          message: 'Flutterwave payout error',
          details: {
            code: errorData.code || 'UNKNOWN',
            message: errorData.message || 'Unexpected Flutterwave error'
          }
        });
      }

      return res.status(500).json({ 
        message: 'Error processing payout', 
        error: flutterwaveError.message 
      });
    }
  } catch (error) {
    // Handle validation or other errors
    console.error('Payout initialization error:', error);
    return res.status(400).json({ 
      message: error.message || 'Payout initialization failed'
    });
  }
};

// Payout callback handler
exports.payoutCallback = async (req, res) => {
  try {
    const { tx_ref, status, id: transferId } = req.body;

    // Find and update the payment record
    const payment = await Payment.findOneAndUpdate(
      { tx_ref },
      { 
        status: status === 'successful' ? 'successful' : 'failed',
        withdrawalStatus: status === 'successful' ? 'completed' : 'none',
        flutterwaveTransferId: transferId
      },
      { new: true }
    );

    // Update corresponding withdrawal
    if (payment) {
      await Withdrawal.findOneAndUpdate(
        { userId: payment.userId, amount: payment.amount },
        { status: status === 'successful' ? 'processed' : 'failed' }
      );
    }

    res.status(200).json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Payout callback error:', error);
    res.status(500).json({ message: 'Error processing payout callback' });
  }
};

// CreatorEarnings.js
import React, { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import './payout.css';
import axios from 'axios';

const CreatorEarnings = () => {
  const { user } = useClerk();
  const userId = user?.id;
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://yepper-backend.onrender.com/api/picture/earnings/${userId}`);
        setEarnings(response.data);
      } catch (error) {
        console.error('Error fetching earnings:', error);
        setError('Could not retrieve earnings');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchEarnings();
  }, [userId]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      const response = await fetch('https://yepper-backend.onrender.com/api/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          phoneNumber,
          userId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setWithdrawSuccess('Payout initiated successfully!');
        setWithdrawAmount('');
        setPhoneNumber('');

        // Refresh earnings
        const earningsResponse = await fetch(`https://yepper-backend.onrender.com/api/picture/earnings/${userId}`);
        const updatedEarnings = await earningsResponse.json();
        setEarnings(updatedEarnings);
      } else {
        setWithdrawError(data.message || 'Payout failed');
      }
    } catch (error) {
      console.error('Payout error:', error);
      setWithdrawError('Payout failed');
    }
  };
};

export default CreatorEarnings;

Detailed Payout Error: {
    message: 'Request failed with status code 400',
    response: {
      status: 'error',
      message: 'This request cannot be processed. Please contact your account administrator',
      data: null
    },
    status: 400,
    headers: Object [AxiosHeaders] {
      date: 'Sat, 07 Dec 2024 15:18:09 GMT',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '118',
      connection: 'keep-alive',
      server: 'nginx/1.26.0',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, v3-xapp-id, flw-auth-token, mra-auth-token, alt_mode_auth, mid, altmodeauth, cc-admin-token, x-flw-lang',
      'access-control-allow-methods': 'PUT, POST, GET, DELETE, OPTIONS',
      etag: 'W/"76-FhNpRwQo5TRc51vVUXgu2w"'
    }
  }