const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const chatRoutes = require('./routes/chat');
const professorRoutes = require('./routes/professors');
const courseRoutes = require('./routes/courses');
const conversationRoutes = require('./routes/conversations');
const searchRoutes = require('./routes/search');
const predictionRoutes = require('./routes/predictions');
const DatabaseService = require('./services/databaseService');
const ConversationService = require('./services/conversationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const databaseService = new DatabaseService();
const conversationService = new ConversationService();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make services available to routes
app.use((req, res, next) => {
  req.databaseService = databaseService;
  req.conversationService = conversationService;
  next();
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/predictions', predictionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CUNY RMP Bot is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await databaseService.connect();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 CUNY RMP Bot server running on port ${PORT}`);
      console.log(`📊 Queens College Grade Distribution API ready`);
      console.log(`👨‍🏫 Rate My Professor comparison tool active`);
      console.log(`💬 Conversation history system active`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
