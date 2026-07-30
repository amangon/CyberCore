const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Team = require('./models/Team');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create sample data
const createSampleData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Organization.deleteMany();
    await Team.deleteMany();

    console.log('Cleared existing data...');

    // Create sample organization
    const organization = await Organization.create({
      name: 'Acme Corporation',
      description: 'A leading technology company specializing in cybersecurity solutions',
      industry: 'Technology',
      size: 'enterprise',
      address: {
        street: '123 Tech Boulevard',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA'
      },
      contactEmail: 'security@acme.com',
      contactPhone: '+1-415-555-0123',
      website: 'https://www.acme.com',
      subscriptionPlan: 'enterprise'
    });

    console.log('Created organization:', organization.name);

    // Create sample users
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@acme.com',
      password: 'AdminPassword123!', // Will be hashed by middleware
      role: 'admin',
      organization: organization._id
    });

    const analystUser = await User.create({
      firstName: 'Jane',
      lastName: 'Analyst',
      email: 'jane.analyst@acme.com',
      password: 'AnalystPassword123!',
      role: 'analyst',
      organization: organization._id
    });

    const viewerUser = await User.create({
      firstName: 'John',
      lastName: 'Viewer',
      email: 'john.viewer@acme.com',
      password: 'ViewerPassword123!',
      role: 'viewer',
      organization: organization._id
    });

    console.log('Created users');

    // Create sample team
    const securityTeam = await Team.create({
      name: 'Security Operations Center',
      description: 'Primary security monitoring and incident response team',
      organization: organization._id,
      teamLead: adminUser._id,
      members: [adminUser._id, analystUser._id]
    });

    console.log('Created team:', securityTeam.name);

    console.log('Sample data created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating sample data:', err);
    process.exit(1);
  }
};

// Delete all data
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Organization.deleteMany();
    await Team.deleteMany();

    console.log('All data deleted successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error deleting data:', err);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  deleteData();
} else {
  createSampleData();
}