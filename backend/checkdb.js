'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const ScanRecord = require('./models/ScanRecord');
const IOC = require('./models/IOC');
const ThreatIntelligence = require('./models/ThreatIntelligence');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find({}, 'email firstName lastName role organization isActive');
  console.log('Total users:', users.length);
  users.forEach(u => console.log(u.email, '| role:', u.role, '| org:', u.organization, '| active:', u.isActive));
  console.log('ScanRecords:', await ScanRecord.countDocuments());
  console.log('IOCs:', await IOC.countDocuments());
  console.log('ThreatIntelligence:', await ThreatIntelligence.countDocuments());
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
