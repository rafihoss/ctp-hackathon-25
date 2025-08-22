# CUNY Rate My Professor Bot

A comprehensive web application for comparing professors and analyzing grade distributions at Queens College, CUNY. This bot combines data from Queens College's grade distribution data and Rate My Professor to provide students with data-driven insights for course selection.

## 🛠️ Complete Tech Stack

### **Backend (Node.js/Express)**
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database for grade distribution data
- **Cheerio** - Web scraping for Rate My Professor
- **OpenAI API** - GPT-4 integration for AI features
- **Axios** - HTTP client for API requests
- **Node-cache** - In-memory caching
- **CSV Parser** - Data ingestion from CSV files
- **UUID** - Unique identifier generation
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting
- **Dotenv** - Environment variable management

### **Frontend (React)**
- **React 18** - UI framework
- **React Router DOM** - Client-side routing
- **React Chart.js 2** - Data visualization
- **Chart.js** - Chart library
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

### **Development Tools**
- **Nodemon** - Development server with auto-restart
- **React Scripts** - Create React App scripts
- **ESLint** - Code linting

### **Data Sources**
- **Queens College Grade Distributions** - Historical grade data (2012-present)
- **Rate My Professor** - Real-time professor ratings and reviews
- **OpenAI GPT-4** - AI-powered insights and recommendations

## 🚀 Complete Feature List

### **1. 🤖 AI-Powered Chatbot**
- **Intelligent Query Processing**: Natural language understanding for professor and course queries
- **Context-Aware Responses**: Remembers conversation history and provides relevant insights
- **Multi-Modal Input**: Accepts both text queries and Rate My Professor URLs
- **Real-time Analysis**: Instant responses with grade distribution data
- **Conversation History**: Persistent chat sessions with save/restore functionality

### **2. 📊 Rate My Professor Integration**
- **Real-time Web Scraping**: Live data extraction from Rate My Professor
- **Comprehensive Professor Data**: Ratings, difficulty, would-take-again percentages
- **Review Analysis**: Student feedback and sentiment analysis
- **Caching System**: Optimized performance with intelligent caching
- **Error Handling**: Graceful fallbacks when RMP data is unavailable

### **3. 📈 Advanced Data Visualization**
- **Interactive Grade Distribution Charts**: Bar charts, pie charts, and trend analysis
- **Professor Comparison Charts**: Side-by-side visual comparisons
- **Course Performance Graphs**: Historical grade trends and patterns
- **Responsive Design**: Charts adapt to different screen sizes
- **Dark Mode Support**: Charts work seamlessly in both light and dark themes

### **4. 🔍 Enhanced Search & Discovery**
- **Professor Search**: Fuzzy name matching with typo tolerance
- **Course Search**: Search by code, name, or department
- **Advanced Filtering**: Filter by department, course level, difficulty
- **Real-time Results**: Instant search results with loading states
- **Search History**: Remember recent searches for quick access

### **5. 👨‍🏫 Professor Comparison Tool**
- **Multi-Professor Comparison**: Compare up to 3 professors simultaneously
- **Comprehensive Metrics**: GPA, success rates, withdrawal rates, enrollment
- **Visual Comparisons**: Side-by-side charts and statistics
- **Performance Analysis**: Historical performance trends
- **Recommendation Engine**: AI-powered professor suggestions

### **6. 📚 Course Analysis System**
- **Course Difficulty Assessment**: AI-powered difficulty analysis
- **Grade Distribution Analysis**: Comprehensive statistical breakdown
- **Success Rate Prediction**: Machine learning-based success probability
- **Prerequisite Analysis**: Course dependency and pathway planning
- **Department Performance**: Comparative analysis across departments

### **7. 🎯 AI-Powered Recommendations**
- **Personalized Course Matching**: AI analyzes academic history for optimal course suggestions
- **Success Probability Prediction**: Machine learning algorithms predict success rates
- **Academic Pattern Recognition**: Identifies strengths, weaknesses, and learning preferences
- **Professor Recommendations**: Suggests best professors based on student profile
- **Learning Path Planning**: Creates personalized academic roadmaps
- **Difficulty Matching**: Aligns course difficulty with student capabilities

### **8. 🎨 User Experience Features**
- **Dark Mode Toggle**: User preference for light/dark theme
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Loading States**: Smooth loading animations and progress indicators
- **Error Handling**: Graceful error messages and recovery options
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance Optimization**: Lazy loading and efficient data fetching

### **9. 🔒 Security & Performance**
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Input Validation**: Comprehensive sanitization of all user inputs
- **CORS Protection**: Configurable cross-origin request handling
- **Security Headers**: Implemented via Helmet for enhanced security
- **Caching Strategy**: Multi-level caching for optimal performance
- **Error Logging**: Comprehensive error tracking and debugging

### **10. 📱 Advanced Features**
- **Conversation Persistence**: Save and restore chat sessions
- **Export Functionality**: Download grade distribution reports
- **Bookmark System**: Save favorite professors and courses
- **Notification System**: Real-time updates and alerts
- **Offline Support**: Basic functionality when network is unavailable

## 🚀 Quick Start Guide

### **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn package manager
- Queens College grade distribution CSV files
- OpenAI API key (for AI features)

### **1. Clone & Setup**
```bash
# Clone the repository
git clone <repository-url>
cd cuny-rmp-bot

# Install all dependencies (server + client)
npm run install-all
```

### **2. Prepare Data**
```bash
# Create data directory
mkdir -p data/qc_grades

# Download CSV files from Queens College Grade Distribution
# Place them in data/qc_grades/ with format: SP25.csv, FA24.csv, etc.
```

### **3. Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your OpenAI API key
# OPENAI_API_KEY=your-api-key-here
```

### **4. Load Data**
```bash
# Ingest CSV files into database
npm run ingest
```

### **5. Run Application**
```bash
# Development mode (two terminals needed)
npm run dev          # Terminal 1: Backend server
npm run client       # Terminal 2: Frontend client

# Or production mode
npm run build        # Build client
npm start           # Start production server
```

### **6. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📖 How to Use Each Feature

### **🤖 AI Chatbot**
1. **Navigate to Home Page**: The chatbot is the main interface
2. **Ask Questions**: Type natural language queries like:
   - "What's the grade distribution for Professor Smith?"
   - "Tell me about CSCI 212"
   - "Compare Professor Johnson and Professor Williams"
3. **Paste RMP Links**: Include Rate My Professor URLs for detailed analysis
4. **View Results**: Get instant responses with charts and statistics

### **👨‍🏫 Professor Comparison**
1. **Go to Comparison Page**: Click "Professor Comparison" in navigation
2. **Search Professors**: Use the search bar to find professors
3. **Add to Comparison**: Click "+" to add professors (up to 3)
4. **Run Comparison**: Click "Compare Professors" for detailed analysis
5. **View Results**: See side-by-side comparisons with charts

### **📚 Course Analysis**
1. **Visit Course Analysis**: Navigate to "Course Analysis" page
2. **Search Courses**: Enter course code, name, or department
3. **Apply Filters**: Use department, level, and difficulty filters
4. **Select Course**: Click on a course for detailed analysis
5. **View Statistics**: See grade distributions, success rates, and trends

### **🎯 AI Recommendations**
1. **Access AI Recommendations**: Go to "AI Recommendations" page
2. **Generate Recommendations**: Click "Generate AI Recommendations"
3. **View Course Suggestions**: See personalized course recommendations
4. **Get Professor Suggestions**: Click "View Professor Recommendations" on any course
5. **Switch Tabs**: Use tabs to switch between course and professor views

### **🔍 Search Features**
1. **Professor Search**: Search by name with fuzzy matching
2. **Course Search**: Find courses by code, name, or department
3. **Department Browse**: Filter by academic department
4. **Advanced Filters**: Use multiple criteria for refined searches

## 📊 API Endpoints

### **Core Endpoints**
- `GET /api/health` - Health check
- `GET /api/grades` - All grade data
- `GET /api/professors` - All professors
- `GET /api/courses` - All courses

### **Search Endpoints**
- `GET /api/search/professors?query=<name>` - Professor search
- `GET /api/search/courses?query=<course>` - Course search
- `GET /api/search/grades?query=<search>` - Grade search

### **Analysis Endpoints**
- `POST /api/chat` - AI chatbot
- `POST /api/recommendations/courses` - Course recommendations
- `POST /api/recommendations/professors/:courseCode` - Professor recommendations
- `GET /api/courses/:courseCode/analysis` - Course analysis

### **Comparison Endpoints**
- `POST /api/professors/compare` - Professor comparison
- `POST /api/rmp/scrape` - Rate My Professor data
- `GET /api/professors/:name/grades` - Professor grade history

## 🔧 Configuration Options

### **Environment Variables**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_PATH=./server/data/grades.db
CSV_DATA_DIR=./data/qc_grades

# API Keys
OPENAI_API_KEY=your-openai-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Caching
CACHE_TTL=3600
RMP_CACHE_TTL=1800

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Deployment

### **Local Development**
```bash
npm run dev          # Backend
npm run client       # Frontend
```

### **Production Build**
```bash
npm run build        # Build client
npm start           # Start production server
```

### **Docker Deployment**
```bash
# Build image
docker build -t cuny-rmp-bot .

# Run container
docker run -p 5000:5000 cuny-rmp-bot
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Queens College** for providing grade distribution data
- **Rate My Professor** for student review data
- **OpenAI** for GPT-4 integration
- **CUNY Community** for inspiration and feedback

## 📞 Support

For support, please:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Include error logs and steps to reproduce

---

**Note**: This application is specifically designed for Queens College, CUNY. To extend to other CUNY schools, you would need to:
1. Add their grade distribution data sources
2. Update the data parsing logic for different formats
3. Modify the UI to reflect the new school(s)
4. Update the database schema if needed
