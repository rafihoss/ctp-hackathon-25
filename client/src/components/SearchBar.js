import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, BookOpen, TrendingUp, Filter } from 'lucide-react';

const SearchBar = ({ onSearch, onQuickSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchType, setSearchType] = useState('all'); // 'all', 'professors', 'courses'
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);

  // Quick search options
  const quickSearches = [
    { label: 'Top A-Givers', icon: TrendingUp, type: 'professors', query: 'highest A percentage' },
    { label: 'Computer Science', icon: BookOpen, type: 'courses', query: 'CSCI' },
    { label: 'Mathematics', icon: BookOpen, type: 'courses', query: 'MATH' },
    { label: 'English', icon: BookOpen, type: 'courses', query: 'ENGL' },
    { label: 'Psychology', icon: BookOpen, type: 'courses', query: 'PSYC' },
    { label: 'Biology', icon: BookOpen, type: 'courses', query: 'BIOL' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchTerm)}&type=${searchType}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchType]);

  const handleSearch = (query = searchTerm) => {
    if (!query.trim()) return;
    
    onSearch({
      query: query.trim(),
      type: searchType
    });
    
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const handleQuickSearch = (quickSearch) => {
    onQuickSearch(quickSearch);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name || suggestion);
    handleSearch(suggestion.name || suggestion);
  };

  return (
    <div className="w-full" ref={searchRef}>
      {/* Search Type Tabs */}
      <div className="flex space-x-1 mb-3">
        {[
          { key: 'all', label: 'All', icon: Search },
          { key: 'professors', label: 'Professors', icon: User },
          { key: 'courses', label: 'Courses', icon: BookOpen }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSearchType(tab.key)}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              searchType === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${searchType === 'all' ? 'professors and courses' : searchType}...`}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (suggestions.length > 0 || isLoading) && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </div>
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {suggestion.type === 'professor' ? (
                      <User className="h-4 w-4 text-blue-600" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-green-600" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {suggestion.name || suggestion}
                      </div>
                      {suggestion.department && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {suggestion.department}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Search Options */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
          <Filter className="h-4 w-4 mr-1" />
          Quick Searches
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickSearches.map((quickSearch, index) => (
            <button
              key={index}
              onClick={() => handleQuickSearch(quickSearch)}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <quickSearch.icon className="h-4 w-4 mr-2" />
              {quickSearch.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
