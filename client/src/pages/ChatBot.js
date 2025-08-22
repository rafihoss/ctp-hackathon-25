// React imports for component functionality and routing
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Lucide React icons for beautiful UI elements
import { Send, MessageCircle, User, Bot, BarChart3, PieChart, BookOpen, Search, Brain, Sparkles, Zap, Star, Lightbulb } from 'lucide-react';

// Custom components for data visualization
import GradeDistributionChart from '../components/GradeDistributionChart';
import GradeStatistics from '../components/GradeStatistics';

/**
 * ChatBot Component - Main AI-powered conversational interface
 * 
 * This is the heart of the application that combines multiple data sources:
 * - Rate My Professor data (via RateMyProfessorService scraping)
 * - Queens College grade distributions (via DatabaseService)
 * - OpenAI GPT-4 for intelligent responses (via ChatGPTService)
 * 
 * Key Features:
 * - Natural language processing for professor and course queries
 * - Rate My Professor URL detection and scraping
 * - Real-time grade distribution analysis
 * - Interactive data visualization with Chart.js
 * - Conversation history and context awareness
 * 
 * Data Flow:
 * 1. User inputs text or RMP URLs
 * 2. Frontend detects RMP links using regex
 * 3. Backend scrapes RMP data using Cheerio
 * 4. Backend queries grade database using SQL
 * 5. Backend generates AI response using OpenAI
 * 6. Frontend displays results with charts and statistics
 */
const ChatBot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your CUNY Professor Assistant. I can help you get information about professors in two ways:\n\n1️⃣ **Ask directly**: \"What's the grade distribution for Professor Smith?\" or \"Tell me about Professor Johnson in CSCI 212\"\n\n2️⃣ **Paste RMP links**: Paste up to 3 Rate My Professor links for detailed analysis with both RMP data and grade distributions\n\n💡 **Tip**: You can combine both! Ask about a professor AND include their RMP link for comprehensive analysis.\n\n📊 **New**: Visual charts and statistics are now available!\n\n🚀 **AI Recommendations**: Try our new AI-powered course recommendation system!\n\nTry asking about any Queens College professor!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedLinks, setDetectedLinks] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [showCharts, setShowCharts] = useState(false);

  /**
   * Handle user input and detect Rate My Professor URLs
   * 
   * This function demonstrates real-time URL detection:
   * - Uses regex to find RMP URLs in user input
   * - Automatically detects and highlights Rate My Professor links
   * - Limits to 3 links for performance (scraping can be slow)
   * 
   * The detected URLs will be sent to the backend where the
   * RateMyProfessorService will scrape them using Cheerio
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Regex pattern to detect Rate My Professor URLs
    // Matches: https://www.ratemyprofessors.com/professor/Name-123456
    const rmpLinkRegex = /https?:\/\/www\.ratemyprofessors\.com\/professor\/[^\s]+/g;
    
    // Extract all RMP URLs from the input text
    const links = value.match(rmpLinkRegex) || [];
    
    // Limit to 3 links to prevent overwhelming the scraping service
    setDetectedLinks(links.slice(0, 3));
  };

  /**
   * Handle form submission and orchestrate the complete data pipeline
   * 
   * This function demonstrates the end-to-end data flow:
   * 1. Frontend: Send user message + detected RMP URLs to backend
   * 2. Backend: Parse message for professor/course names
   * 3. Backend: Scrape RMP URLs using Cheerio (RateMyProfessorService)
   * 4. Backend: Query grade database using SQL (DatabaseService)
   * 5. Backend: Generate AI response using OpenAI (ChatGPTService)
   * 6. Frontend: Display response with interactive charts
   * 
   * The backend orchestrates all three services to provide comprehensive insights
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() && detectedLinks.length === 0) return;

    // Create user message for conversation history
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue
    };

    // Update UI with user message and reset input
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message and detected RMP links to backend chat endpoint
      // This triggers the complete data pipeline described above
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,        // User's text input
          rmpLinks: detectedLinks     // Detected RMP URLs for scraping
        }),
      });

      // Parse the comprehensive response from backend
      const data = await response.json();
      
      if (data.success) {
        // Create bot response message
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response  // AI-generated response combining all data sources
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Display interactive charts if grade distribution data is available
        // This data comes from the Queens College grade database
        if (data.gradeData && data.gradeData.length > 0) {
          setChartData(data.gradeData);
          setShowCharts(true);
        }
      } else {
        // Handle API errors gracefully
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Sorry, I encountered an error. Please try again.'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      // Handle network or parsing errors
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Clean up loading state and detected links
      setIsLoading(false);
      setDetectedLinks([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container-responsive py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 animate-fade-in-left">
              <div className="relative">
                <MessageCircle className="h-10 w-10 text-blue-600 animate-pulse" />
                <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">CUNY Professor Assistant</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Powered by Queens College grade data & Rate My Professor</p>
              </div>
            </div>
            <div className="flex space-x-3 animate-fade-in-right">
              <button
                onClick={() => navigate('/search')}
                className="btn-primary flex items-center px-4 py-2 text-sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </button>
              <button
                onClick={() => navigate('/comparison')}
                className="btn-secondary flex items-center px-4 py-2 text-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare Professors
              </button>
              <button
                onClick={() => navigate('/courses')}
                className="btn-success flex items-center px-4 py-2 text-sm"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Course Analysis
              </button>
              <button
                onClick={() => navigate('/ai-recommendations')}
                className="relative group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                  AI Recommendations
                  <Zap className="h-3 w-3 ml-2 animate-bounce" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Container */}
      <div className="flex-1 container-responsive py-8">
        {/* Enhanced Quick Examples */}
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-lg animate-fade-in-up">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-600 animate-pulse" />
            💡 Quick Examples:
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-2 text-yellow-500" />
              "What's the grade distribution for Professor Smith?"
            </div>
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-2 text-yellow-500" />
              "Tell me about Professor Johnson in CSCI 212"
            </div>
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-2 text-yellow-500" />
              Paste RMP link: https://www.ratemyprofessors.com/professor/...
            </div>
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-2 text-yellow-500" />
              Combine both: "What's the grade distribution for Professor Chyn?" + RMP link
            </div>
          </div>
        </div>
        
        <div className="card h-[600px] flex flex-col animate-scale-in">
          {/* Enhanced Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg transform hover:scale-[1.02] transition-all duration-300 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.type === 'user' ? (
                      <User className="h-5 w-5 mt-1 flex-shrink-0 animate-pulse" />
                    ) : (
                      <Bot className="h-5 w-5 mt-1 flex-shrink-0 animate-pulse" />
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <Bot className="h-5 w-5 animate-pulse" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Charts Section */}
          {showCharts && chartData && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 animate-slide-in-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <BarChart3 className="h-6 w-6 mr-3 text-blue-600 animate-pulse" />
                  Visual Analysis
                </h3>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setChartType('bar')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      chartType === 'bar'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Bar Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('pie')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      chartType === 'pie'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    <PieChart className="h-4 w-4 inline mr-2" />
                    Pie Chart
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6 animate-fade-in-up animate-stagger-1">
                  <GradeDistributionChart data={chartData} chartType={chartType} />
                </div>
                <div className="card p-6 animate-fade-in-up animate-stagger-2">
                  <GradeStatistics data={chartData} />
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Input Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Ask about a professor or paste RMP links..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  disabled={isLoading}
                />
                {detectedLinks.length > 0 && (
                  <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                    {detectedLinks.length} RMP link{detectedLinks.length > 1 ? 's' : ''} detected
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || (!inputValue.trim() && detectedLinks.length === 0)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                {isLoading ? (
                  <div className="spinner h-5 w-5 mr-2"></div>
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
