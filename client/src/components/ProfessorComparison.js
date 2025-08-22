import React, { useState } from 'react';
import { BarChart3, X, Plus, Search } from 'lucide-react';
import GradeDistributionChart from './GradeDistributionChart';
import GradeStatistics from './GradeStatistics';
import ProfessorComparisonChart from './ProfessorComparisonChart';

const ProfessorComparison = ({ onCompare }) => {
  const [selectedProfessors, setSelectedProfessors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);



  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    console.log('🔍 Searching for:', searchTerm);
    setIsSearching(true);
    try {
      const response = await fetch(`/api/professors/search?query=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      console.log('📡 API Response:', data);
      
      if (data.success) {
        console.log('✅ Found professors:', data.professors);
        setSearchResults(data.professors);
      } else {
        console.error('❌ Search failed:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addProfessor = (professor) => {
    if (selectedProfessors.length >= 3) {
      alert('You can only compare up to 3 professors at a time.');
      return;
    }
    
    if (selectedProfessors.find(p => p.id === professor.id)) {
      alert('This professor is already selected.');
      return;
    }
    
    setSelectedProfessors(prev => [...prev, professor]);
    setSearchResults([]);
    setSearchTerm('');
  };

  const removeProfessor = (professorId) => {
    setSelectedProfessors(prev => prev.filter(p => p.id !== professorId));
    setComparisonData(null);
  };

  const runComparison = async () => {
    if (selectedProfessors.length < 2) {
      alert('Please select at least 2 professors to compare.');
      return;
    }

    setIsComparing(true);
    try {
      const response = await fetch('/api/professors/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professorNames: selectedProfessors.map(prof => prof.name)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setComparisonData(data.comparisonData);
      } else {
        console.error('Comparison failed:', data.error);
        alert('Error running comparison. Please try again.');
      }
    } catch (error) {
      console.error('Comparison error:', error);
      alert('Error running comparison. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  const clearComparison = () => {
    setSelectedProfessors([]);
    setComparisonData(null);
    setSearchResults([]);
    setSearchTerm('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
          Professor Comparison Tool
        </h2>
        {selectedProfessors.length > 0 && (
                      <button
              onClick={clearComparison}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear All
            </button>
        )}
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                type="text"
                placeholder="Search for professors by name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Results:</h4>
            <div className="space-y-2">
              {searchResults.map(professor => (
                <div
                  key={professor.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{professor.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{professor.department}</p>
                  </div>
                  <button
                    onClick={() => addProfessor(professor)}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Professors */}
      {selectedProfessors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Selected Professors ({selectedProfessors.length}/3)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedProfessors.map(professor => (
              <div
                key={professor.id}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">{professor.name}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{professor.department}</p>
                  </div>
                  <button
                    onClick={() => removeProfessor(professor.id)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <button
              onClick={runComparison}
              disabled={isComparing || selectedProfessors.length < 2}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isComparing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Comparison...
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Compare {selectedProfessors.length} Professor{selectedProfessors.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Comparison Results
            </h3>
            
            {/* Individual Professor Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {comparisonData.map((professor, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {professor.name}
                  </h4>
                  <GradeStatistics data={professor.grades} />
                </div>
              ))}
            </div>

            {/* Side-by-Side Comparison Chart */}
            <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Grade Distribution Comparison
            </h4>
              <ProfessorComparisonChart 
                professorsData={comparisonData}
                title="Professor Grade Comparison"
              />
            </div>

            {/* Individual Grade Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {comparisonData.map((professor, index) => (
                <div key={index}>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {professor.name} - Grade Distribution
                  </h4>
                  <GradeDistributionChart 
                    data={professor.grades}
                    type="bar"
                    title={`${professor.name} - ${professor.grades.length} courses`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {selectedProfessors.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium mb-2">Start Comparing Professors</p>
          <p className="text-sm">
            Search for professors above and add them to compare their grade distributions, 
            statistics, and teaching performance side by side.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfessorComparison;
