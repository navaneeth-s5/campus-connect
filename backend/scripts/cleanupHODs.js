const mongoose = require('mongoose');
const User = require('../models/User');

const cleanup = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/admin'); // Try connecting to the default port
    console.log('Connected to MongoDB');

    const users = await User.find({ isHOD: true });
    console.log(`Found ${users.length} HODs total.`);
    
    const depts = {};

    for (const user of users) {
      console.log(`Found HOD: ${user.name} - Dept: ${user.department} - College: ${user.college}`);
      const key = `${user.college}-${user.department.toLowerCase().trim()}`;
      if (depts[key]) {
        console.log(`>>> Unsetting duplicate HOD: ${user.name} for ${user.department}`);
        user.isHOD = false;
        await user.save();
      } else {
        depts[key] = user._id;
        console.log(`Keeping primary HOD: ${user.name} for ${user.department}`);
      }
    }

    console.log('Cleanup complete');
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
};

cleanup();
