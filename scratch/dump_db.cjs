const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Leave = require('./backend/models/Leave');

async function dump() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/test'); // Adjust DB name if needed, but mongodb-memory-server usually uses 'test' or similar
    console.log('Connected to MongoDB');
    
    const users = await User.find({});
    console.log('--- USERS ---');
    users.forEach(u => console.log(`${u.name} (Roll: ${u.rollNumber}, Role: ${u.role}, College: ${u.college})` || u));
    
    const leaves = await Leave.find({});
    console.log('\n--- LEAVES ---');
    leaves.forEach(l => console.log(`${l.userName} (Status: ${l.status}, College: ${l.college}, Dates: ${l.startDate} - ${l.endDate})` || l));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

dump();
