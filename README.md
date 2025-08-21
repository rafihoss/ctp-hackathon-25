# CUNY Rate My Professor Bot

A comprehensive web application for comparing professors and analyzing grade distributions at Queens College, CUNY. This bot combines data from Queens College's grade distribution Google Sheets and Rate My Professor to provide students with data-driven insights for course selection.

## 🚀 Features

### Core Functionality
- **Professor Comparison**: Compare up to 3 professors using Rate My Professor URLs
- **Grade Distribution Analysis**: View comprehensive grade data from Queens College (2012-present)
- **Course Search**: Search for specific courses and view detailed statistics
- **Professor Search**: Find professors and view their teaching history
- **AI-Powered Features**: ChatGPT integration for intelligent recommendations and insights
- **Real-time Data**: Live scraping of Rate My Professor data using Cheerio
- **Caching**: Intelligent caching for improved performance

### Data Sources
- **Queens College Grade Distributions**: Historical grade data from CSV files (2012-present)
- **Rate My Professor**: Real-time professor ratings and reviews
- **ChatGPT API**: AI-powered insights and recommendations
- **Comprehensive Analytics**: Combined insights from all sources

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Cheerio** for web scraping
- **SQLite** for grade distribution data storage
- **CSV Parser** for data ingestion
- **OpenAI API** for AI-powered features
- **Axios** for HTTP requests
- **Node-cache** for performance optimization

### Frontend
- **React.js** with React Router
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

### Security & Performance
- **Helmet** for security headers
- **Rate limiting** to prevent abuse
- **CORS** configuration
- **Error handling** and validation

## 📋 Prerequisites

Before running this application, you'll need:

1. **Node.js** (v14 or higher)
2. **npm** or **yarn**
3. **Access to Queens College Grade Distribution Google Sheet** (to download CSV files)
4. **OpenAI API Key** (for AI-powered features)

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cuny-rmp-bot
```

### 2. Install Dependencies
```bash
# Install all dependencies (server and client)
npm run install-all
```

### 3. Prepare CSV Data

1. Download CSV files from the Queens College "Grade Distribution 2012–2024" Google Sheet
2. Name the files using the format: `SP25.csv`, `FA24.csv`, `SU24.csv`, etc.
3. Place them in the `./data/qc_grades/` directory

The expected CSV format should include columns like:
- TERM, SUBJECT, NBR, COURSE NAME, SECTION, PROF, TOTAL
- A+, A, A-, B+, B, B-, C+, C, C-, D, F, W, INC/NA, AVG GPA

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp env.example .env
```

2. The default configuration should work for most setups. The `.env` file includes:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_PATH=./server/data/grades.db

# CSV Data Directory
CSV_DATA_DIR=./data/qc_grades

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Cache Configuration
CACHE_TTL=3600
RMP_CACHE_TTL=1800

# ChatGPT API Configuration
OPENAI_API_KEY=your-openai-api-key-here

### 5. Load Data into Database

Run the data ingestion script to load CSV files into the SQLite database:
```bash
npm run ingest
```

### 6. Run the Application

#### Development Mode
```bash
# Terminal 1: Start the backend server
npm run dev

# Terminal 2: Start the frontend client
npm run client
```

#### Production Mode
```bash
# Build the client
npm run build

# Start the production server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 API Endpoints

### Grade Distribution
- `GET /api/grades` - Get all grade distribution data
- `GET /api/grades/search?query=<search>` - Search courses
- `GET /api/grades/course/:courseCode` - Get course statistics
- `GET /api/grades/professor/:professorName` - Get professor grade data
- `GET /api/grades/departments` - Get all departments
- `GET /api/grades/department/:department` - Get courses by department
- `GET /api/grades/summary` - Get grade distribution summary

### Professors
- `GET /api/professors` - Get all professors
- `GET /api/professors/search?query=<search>` - Search professors
- `GET /api/professors/:professorName` - Get professor details
- `GET /api/professors/:professorName/courses` - Get professor's courses
- `GET /api/professors/:professorName/performance` - Get performance over time
- `GET /api/professors/top/performance` - Get top performing professors

### Comparison
- `POST /api/compare/rmp` - Compare professors using RMP URLs
- `POST /api/compare/comprehensive` - Comprehensive professor comparison
- `GET /api/compare/rmp/:encodedUrl` - Get single professor RMP data
- `GET /api/compare/course/:courseCode` - Compare course across professors

### AI Features
- `POST /api/ai/recommendations` - Get AI-powered professor recommendations
- `GET /api/ai/course-analysis/:courseCode` - Analyze course difficulty with AI
- `POST /api/ai/study-advice` - Get personalized study advice
- `POST /api/ai/compare-professors` - AI-powered professor comparison
- `POST /api/ai/ask` - Ask general academic questions
- `GET /api/ai/status` - Check AI service status

## 🎯 Usage Guide

### Comparing Professors
1. Navigate to the "Compare Professors" page
2. Enter up to 3 Rate My Professor URLs
3. Click "Compare Professors" to get comprehensive analysis
4. View detailed comparisons including ratings, difficulty, and recommendations

### Searching Courses
1. Go to the "Course Search" page
2. Enter a course code, name, or department
3. Browse search results and click on courses for detailed information
4. View grade distributions and professor performance

### Analyzing Grade Distributions
1. Visit the "Grade Distribution" page
2. Filter by department to see available courses
3. Click on courses to view detailed statistics
4. Analyze historical grade trends

### Finding Professors
1. Use the "Professor Search" page
2. Search by name (full or partial)
3. View teaching history and performance data
4. Compare professors across different courses

### Using AI Features
1. Navigate to the "AI Assistant" page
2. Choose from available AI features:
   - **Professor Recommendations**: Get AI-powered suggestions based on your preferences
   - **Course Analysis**: Understand course difficulty and success patterns
   - **Study Advice**: Get personalized study strategies for specific professors
   - **AI Comparison**: Compare professors with intelligent insights
   - **Q&A**: Ask general questions about courses and academic planning
3. Follow the prompts and get instant AI-generated insights

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **CORS Protection**: Configurable cross-origin requests
- **Security Headers**: Implemented via Helmet
- **Error Handling**: Graceful error responses

## 🚀 Performance Optimizations

- **Caching**: Grade data cached for 1 hour, RMP data for 30 minutes
- **Lazy Loading**: Components load on demand
- **Optimized Queries**: Efficient database-like operations on Google Sheets data
- **Compression**: Response compression for faster loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Queens College for providing grade distribution data
- Rate My Professor for student review data
- The CUNY community for inspiration and feedback

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Note**: This application is designed specifically for Queens College, CUNY. To extend it to other CUNY schools, you would need to:
1. Add their grade distribution data sources
2. Update the Google Sheets integration
3. Modify the data parsing logic for different formats
4. Update the UI to reflect the new school(s)
