import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, User, BookOpen, BarChart3, ArrowLeft } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import GradeDistributionChart from '../components/GradeDistributionChart';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    term: '',
    minGPA: '',
    maxGPA: ''
  });
  const [departments, setDepartments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [deptResponse, termsResponse] = await Promise.all([
        fetch('/api/search/departments'),
        fetch('/api/search/terms')
      ]);
      
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData.departments);
      }
      
      if (termsResponse.ok) {
        const termsData = await termsResponse.json();
        setTerms(termsData.terms);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSearch = async (searchData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchData.query,
          filters: filters
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        
        // Prepare chart data if we have results
        if (data.results && data.results.length > 0) {
          prepareChartData(data.results);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = async (quickSearch) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: quickSearch.query,
          filters: filters
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        
        if (data.results && data.results.length > 0) {
          prepareChartData(data.results);
        }
      }
    } catch (error) {
      console.error('Quick search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const prepareChartData = (results) => {
    // Group by professor or course for chart visualization
    const groupedData = results.reduce((acc, result) => {
      const key = `${result.prof} - ${result.subject} ${result.nbr}`;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          A: 0, B: 0, C: 0, D: 0, F: 0, W: 0,
          total: 0,
          avgGPA: 0,
          count: 0
        };
      }
      
      acc[key].A += (result.a_plus + result.a + result.a_minus);
      acc[key].B += (result.b_plus + result.b + result.b_minus);
      acc[key].C += (result.c_plus + result.c + result.c_minus);
      acc[key].D += result.d;
      acc[key].F += result.f;
      acc[key].W += result.w;
      acc[key].total += result.total;
      acc[key].avgGPA += result.avg_gpa;
      acc[key].count += 1;
      
      return acc;
    }, {});

    // Calculate averages and prepare chart format
    const chartData = Object.values(groupedData).map(item => ({
      name: item.name,
      A: Math.round((item.A / item.total) * 100),
      B: Math.round((item.B / item.total) * 100),
      C: Math.round((item.C / item.total) * 100),
      D: Math.round((item.D / item.total) * 100),
      F: Math.round((item.F / item.total) * 100),
      W: Math.round((item.W / item.total) * 100),
      avgGPA: (item.avgGPA / item.count).toFixed(2)
    }));

    setChartData(chartData);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      term: '',
      minGPA: '',
      maxGPA: ''
    });
  };

  const handleResultClick = (result) => {
    // Handle result click if needed in the future
    console.log('Result clicked:', result);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <Search className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Search</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Find professors and courses with detailed filters</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search and Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <SearchBar onSearch={handleSearch} onQuickSearch={handleQuickSearch} />
              
              {/* Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
                  
                  <div className="space-y-4">
                    {/* Department Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department
                      </label>
                      <select
                        value={filters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* Term Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Semester
                      </label>
                      <select
                        value={filters.term}
                        onChange={(e) => handleFilterChange('term', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Semesters</option>
                        {terms.map(term => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                    </div>

                    {/* GPA Range */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Min GPA
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="4"
                          value={filters.minGPA}
                          onChange={(e) => handleFilterChange('minGPA', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max GPA
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="4"
                          value={filters.maxGPA}
                          onChange={(e) => handleFilterChange('maxGPA', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="4.0"
                        />
                      </div>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {isLoading && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 dark:text-gray-400">Searching...</span>
                </div>
              </div>
            )}

            {/* Results */}
            {!isLoading && searchResults.length > 0 && (
              <div className="space-y-6">
                {/* Chart Visualization */}
                {chartData && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Grade Distribution Overview
                    </h3>
                    <GradeDistributionChart data={chartData} />
                  </div>
                )}

                {/* Results List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Search Results ({searchResults.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleResultClick(result)}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <User className="h-5 w-5 text-blue-600" />
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {result.prof}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-3 mb-3">
                              <BookOpen className="h-4 w-4 text-green-600" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {result.subject} {result.nbr} - {result.course_name}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Term:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{result.term}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Section:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{result.section}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Enrollment:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{result.total}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Avg GPA:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{result.avg_gpa}</span>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-green-600 font-medium">A's: {result.a_percentage}%</span>
                              </div>
                              <div>
                                <span className="text-blue-600 font-medium">B's: {result.b_percentage}%</span>
                              </div>
                              <div>
                                <span className="text-yellow-600 font-medium">C's: {result.c_percentage}%</span>
                              </div>
                              <div>
                                <span className="text-red-600 font-medium">D/F's: {result.df_percentage}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && searchResults.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
