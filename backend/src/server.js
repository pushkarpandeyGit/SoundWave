require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  SoundWave Audio Server Running`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Port:        ${PORT}`);
  console.log(`  Health:      http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
