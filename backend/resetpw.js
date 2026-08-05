'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const u = await User.findOne({ email: 'admin@sentinelx.ai' }).select('+password');
  if (!u) { console.log('admin not found'); process.exit(1); }
  u.password = 'SentinelX2026!';
  u.loginAttempts = 0;
  u.lockUntil = undefined;
  await u.save();
  console.log('admin password reset OK, org:', u.organization);
  const match = await u.matchPassword('SentinelX2026!');
  console.log('matchPassword test:', match);
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
