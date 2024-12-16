// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
const waitlistRoutes = require('./routes/WaitlistRoutes')
const importAdRoutes = require('./routes/ImportAdRoutes');
const requestAdRoutes = require('./routes/RequestAdRoutes');
const websiteRoutes = require('./routes/WebsiteRoutes');
const adCategoryRoutes = require('./routes/AdCategoryRoutes');
const adSpaceRoutes = require('./routes/AdSpaceRoutes');
const apiGeneratorRoutes = require('./routes/ApiGeneratorRoutes');
const adApprovalRoutes = require('./routes/AdApprovalRoutes');
const adDisplayRoutes = require('./routes/AdDisplayRoutes');
const paymentRoutes = require('./routes/PaymentRoutes');
const pictureRoutes = require('./routes/PictureRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
// const withdrawalRoutes = require('./routes/WithdrawalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/join-waitlist', waitlistRoutes);
app.use('/api/importAds', importAdRoutes);
app.use('/api/requestAd', requestAdRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/ad-categories', adCategoryRoutes);
app.use('/api/ad-spaces', adSpaceRoutes);
app.use('/api/generate-api', apiGeneratorRoutes);
app.use('/api/accept', adApprovalRoutes);
app.use('/api/ads', adDisplayRoutes);
// app.use('/api/picture', pictureRoutes);
// app.use('/api/payment', paymentRoutes);
// app.use('/api/payout', payoutRoutes);
// app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/picture', pictureRoutes);
app.use('/api/payout', payoutRoutes);

const server = http.createServer(app);
const io = socketIo(server);

module.exports.io = io;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });


// require('dotenv').config(); // For loading environment variables
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/database');
// const mongoose = require('mongoose');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const http = require('http');
// const socketIo = require('socket.io');
// const path = require('path');
// const axios = require('axios');

// // Routes
// const importAdRoutes = require('./routes/ImportAdRoutes');
// const requestAdRoutes = require('./routes/RequestAdRoutes');
// const adRoutes = require('./routes/AdRoutes');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Configure sessions
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET, // Secret key for encrypting session cookies
//     resave: false, // Do not save session if unmodified
//     saveUninitialized: false, // Do not save uninitialized session
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGODB_URI, // Store sessions in your MongoDB cloud
//       collectionName: 'sessions',
//     }),
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24, // 1 day expiration for cookies
//       secure: false, // Set to true if you're using HTTPS
//       httpOnly: true,
//       sameSite: 'lax', // Allows session to be sent on redirects
//     },
//   })
// );

// // Routes
// app.use('/api/importAds', importAdRoutes);
// app.use('/api/requestAd', requestAdRoutes);
// app.use('/api/ads', adRoutes);

// const server = http.createServer(app);
// const io = socketIo(server);
// module.exports.io = io;

// // Connect to MongoDB and start server
// connectDB()
//   .then(() => {
//     server.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.log(error);
//   });
