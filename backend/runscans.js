'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

// Reset lock + set password, then return a fresh JWT via the model
function getSignedJwtToken() {
  return require('jsonwebtoken').sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const u = await User.findOne({ email: 'admin@sentinelx.ai' });
  if (!u) { console.log('NO ADMIN'); process.exit(1); }
  u.password = 'SentinelX2026!';
  u.loginAttempts = 0;
  u.lockUntil = undefined;
  await u.save();
  const token = getSignedJwtToken.call(u, {});
  console.log(token);
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
