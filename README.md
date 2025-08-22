# CUNY GradeLens

A comprehensive web application for analyzing grade distributions and providing AI-powered insights about professors across CUNY campuses. This intelligent chatbot combines comprehensive grade distribution data with OpenAI GPT-4 to provide students with data-driven insights for course selection.

## 🛠️ Tech Stack

### **Backend (Node.js/Express)**
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database for grade distribution data
- **OpenAI API** - GPT-4 integration for AI features
- **Axios** - HTTP client for API requests
- **Node-cache** - In-memory caching
- **CSV Parser** - Data ingestion from CSV files
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
- **Concurrently** - Run multiple commands simultaneously

### **Data Sources**
- **CUNY Grade Distributions** - Historical grade data (2012-present)
- **OpenAI GPT-4** - AI-powered insights and recommendations

## 🚀 Key Features

### **1. 🤖 AI-Powered Chatbot**
- **Intelligent Query Processing**: Natural language understanding for professor and course queries
- **Context-Aware Responses**: Remembers conversation history and provides relevant insights
- **Real-time Analysis**: Instant responses with grade distribution data
- **Conversation History**: Persistent chat sessions with context awareness
- **Follow-up Questions**: Maintains context for pronouns like "her", "his", "their"

### **2. 📊 Advanced Data Visualization**
- **Interactive Grade Distribution Charts**: Bar charts and pie charts
- **Dismissible Visual Analysis**: Optional charts that can be hidden/shown
- **Responsive Design**: Charts adapt to different screen sizes
- **Dark Mode Support**: Charts work seamlessly in both light and dark themes

### **3. 🔍 Advanced Search**
- **Professor Search**: Fuzzy name matching with typo tolerance
- **Course-Specific Filtering**: Filter by specific courses and semesters
- **Semester Detection**: Smart detection of terms like "SP25", "FA24", "Spring 2025"
- **Real-time Results**: Instant search results with loading states

### **4. 🎯 AI-Powered Analysis**
- **Teaching Style Analysis**: AI insights about professor teaching approaches
- **Course Difficulty Assessment**: Data-driven difficulty analysis
- **Grade Distribution Analysis**: Comprehensive statistical breakdown
- **Success Rate Analysis**: Historical performance patterns
- **Concise Responses**: Optimized for quick, actionable insights

### **5. 🎨 User Experience Features**
- **Dark Mode Toggle**: User preference for light/dark theme
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Loading States**: Smooth loading animations and progress indicators
- **Error Handling**: Graceful error messages and recovery options
- **Performance Optimization**: Efficient data fetching and caching

### **6. 🔒 Security & Performance**
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Input Validation**: Comprehensive sanitization of all user inputs
- **CORS Protection**: Configurable cross-origin request handling
- **Security Headers**: Implemented via Helmet for enhanced security
- **Caching Strategy**: Multi-level caching for optimal performance

## 🚀 Quick Start Guide

### **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn package manager
- CUNY grade distribution CSV files
- OpenAI API key (for AI features)

### **1. Clone & Setup**
```bash
# Clone the repository
git clone <repository-url>
cd cuny-gradelens

# Install all dependencies (server + client)
npm run install-all
```

### **2. Prepare Data**
```bash
# Create data directory
mkdir -p data/qc_grades

# Download CSV files from CUNY Grade Distribution
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
# Development mode (runs both server and client)
npm run dev

# Or run separately
npm run dev:server    # Terminal 1: Backend server
npm run dev:client    # Terminal 2: Frontend client

# Production mode
npm run build        # Build client
npm start           # Start production server
```

### **6. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📖 How to Use

### **🤖 AI Chatbot**
1. **Navigate to Home Page**: The chatbot is the main interface
2. **Ask Questions**: Type natural language queries like:
   - "What's the grade distribution for Professor Smith?"
   - "Tell me about Professor Johnson in CSCI 212"
   - "How difficult is Professor Williams' MATH 201 class?"
   - "Give me the numbers for Professor Chyn's courses"
3. **Follow-up Questions**: Ask follow-up questions like:
   - "What about her CSCI 212 class?"
   - "Give me just the numbers"
   - "How about Spring 2025?"
4. **View Results**: Get instant responses with optional charts and statistics

### **📊 Visual Analysis**
1. **View Charts**: Charts appear automatically when grade data is available
2. **Toggle Visibility**: Click the "X" button to hide charts
3. **Show Again**: Click "Show Visual Analysis" to display charts again
4. **Switch Chart Types**: Toggle between bar charts and pie charts

### **🔍 Advanced Search**
1. **Access Search**: Click "Search" in the navigation
2. **Search Professors**: Use the search bar to find professors
3. **Filter Results**: Use semester and course filters
4. **View Details**: Click on results for detailed information

## 📊 API Endpoints

### **Core Endpoints**
- `GET /api/health` - Health check
- `POST /api/chat` - AI chatbot endpoint

### **Data Endpoints**
- `GET /api/grades` - All grade data
- `GET /api/professors` - All professors
- `GET /api/courses` - All courses

### **Search Endpoints**
- `GET /api/search/professors?query=<name>` - Professor search
- `GET /api/search/courses?query=<course>` - Course search

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

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Deployment

### **Local Development**
```bash
npm run dev          # Runs both server and client
```

### **Production Build**
```bash
npm run build        # Build client
npm start           # Start production server
```

### **Vercel Deployment**
1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `client/build`
   - Install Command: `npm run install-all`
3. **Set Environment Variables**: Add your `OPENAI_API_KEY`
4. **Deploy**: Vercel will automatically deploy on push to main branch

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CUNY** for providing grade distribution data
- **OpenAI** for GPT-4 integration
- **CUNY Community** for inspiration and feedback

## 📞 Support

For support, please:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Include error logs and steps to reproduce

---

**Note**: This application is designed for CUNY campuses with grade distribution data. To extend to other schools, you would need to:
1. Add their grade distribution data sources
2. Update the data parsing logic for different formats
3. Modify the UI to reflect the new school(s)
4. Update the database schema if needed
