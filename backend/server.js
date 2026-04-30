require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const facilityRoutes = require('./routes/facilities');
const submissionsRoutes = require('./routes/submissions');
const ticketRoutes = require('./routes/tickets');
const lmsRoutes = require('./routes/lms');
const aiRoutes = require('./routes/ai');
const leaveRoutes = require('./routes/leaves');


const app = express();

// Middleware
app.use(cors()); // Allow all origins for network testing
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/leaves', leaveRoutes);


const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files (Production)
const frontendDistPath = path.join(__dirname, '../dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // All other GET requests not handled before will return the React app
  app.use((req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
  socket.on('join_role', (role) => {
    if (role === 'principal') socket.join('principal');
  });
});

async function startServer() {
  try {
    const dataPath = path.join(__dirname, 'mongo_data');
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath: dataPath,
        storageEngine: 'wiredTiger',
        ip: '0.0.0.0'
      }
    });

    const MONGO_URI = mongod.getUri();
    console.log(`Embedded MongoDB started at ${MONGO_URI} with persistent data in ${dataPath}`);

    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

startServer();
