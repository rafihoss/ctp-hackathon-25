const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Cache for 30 minutes
const cache = new NodeCache({ stdTTL: 1800 });

class RateMyProfessorService {
  constructor() {
    this.cache = cache;
    this.baseUrl = 'https://www.ratemyprofessors.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  // Extract professor data from RMP URL
  async scrapeProfessorData(rmpUrl) {
    const cacheKey = `rmp_${rmpUrl}`;
    
    // Check cache first
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // Validate URL
      if (!this.isValidRMPUrl(rmpUrl)) {
        throw new Error('Invalid Rate My Professor URL');
      }

      const response = await axios.get(rmpUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      const professorData = this.extractProfessorInfo($);
      
      // Cache the result
      this.cache.set(cacheKey, professorData);
      
      return professorData;
    } catch (error) {
      console.error('Error scraping RMP data:', error);
      throw new Error(`Failed to scrape professor data: ${error.message}`);
    }
  }

  // Validate RMP URL format
  isValidRMPUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('ratemyprofessors.com') && 
             urlObj.pathname.includes('/ShowRatings.jsp');
    } catch {
      return false;
    }
  }

  // Extract professor information from the HTML
  extractProfessorInfo($) {
    try {
      const professorData = {
        name: '',
        department: '',
        school: '',
        overallRating: 0,
        wouldTakeAgain: 0,
        difficulty: 0,
        totalRatings: 0,
        recentRatings: [],
        tags: [],
        courses: []
      };

      // Extract basic information
      professorData.name = $('h1[data-testid="professor-name"]').text().trim() ||
                          $('.NameTitle__Name-dowf0z-0').text().trim() ||
                          $('h1').first().text().trim();

      // Extract department and school
      const schoolInfo = $('.SchoolInfo__School-dowf0z-1').text().trim() ||
                        $('.SchoolInfo__SchoolName-dowf0z-2').text().trim();
      
      if (schoolInfo) {
        const parts = schoolInfo.split('•');
        if (parts.length >= 2) {
          professorData.school = parts[0].trim();
          professorData.department = parts[1].trim();
        } else {
          professorData.school = schoolInfo;
        }
      }

      // Extract ratings
      const overallRatingText = $('[data-testid="overall-rating"]').text().trim() ||
                               $('.RatingValue__Numerator-qw8sqy-2').text().trim();
      
      if (overallRatingText) {
        professorData.overallRating = parseFloat(overallRatingText) || 0;
      }

      // Extract would take again percentage
      const wouldTakeAgainText = $('[data-testid="would-take-again"]').text().trim() ||
                                $('.FeedbackItem__FeedbackNumber-uof32n-1').first().text().trim();
      
      if (wouldTakeAgainText) {
        const percentage = wouldTakeAgainText.match(/(\d+)%/);
        professorData.wouldTakeAgain = percentage ? parseInt(percentage[1]) : 0;
      }

      // Extract difficulty
      const difficultyText = $('[data-testid="difficulty"]').text().trim() ||
                            $('.FeedbackItem__FeedbackNumber-uof32n-1').last().text().trim();
      
      if (difficultyText) {
        professorData.difficulty = parseFloat(difficultyText) || 0;
      }

      // Extract total ratings
      const totalRatingsText = $('[data-testid="total-ratings"]').text().trim() ||
                              $('.RatingValue__TotalRatings-qw8sqy-3').text().trim();
      
      if (totalRatingsText) {
        const match = totalRatingsText.match(/(\d+)/);
        professorData.totalRatings = match ? parseInt(match[1]) : 0;
      }

      // Extract tags
      $('.Tag-bs9vf4-0').each((index, element) => {
        const tag = $(element).text().trim();
        if (tag) {
          professorData.tags.push(tag);
        }
      });

      // Extract recent courses
      $('.Course__CourseName-1q6q1d-0').each((index, element) => {
        const course = $(element).text().trim();
        if (course && index < 5) { // Limit to 5 most recent courses
          professorData.courses.push(course);
        }
      });

      // Extract recent ratings
      $('.Rating__RatingContainer-1q6q1d-0').each((index, element) => {
        if (index < 3) { // Limit to 3 most recent ratings
          const rating = {
            date: $(element).find('.Rating__RatingDate-1q6q1d-1').text().trim(),
            comment: $(element).find('.Comments__StyledComments-dowf0z-0').text().trim(),
            grade: $(element).find('.Rating__Grade-1q6q1d-2').text().trim(),
            rating: $(element).find('.Rating__RatingValue-1q6q1d-3').text().trim()
          };
          
          if (rating.comment || rating.grade) {
            professorData.recentRatings.push(rating);
          }
        }
      });

      return professorData;
    } catch (error) {
      console.error('Error extracting professor info:', error);
      throw new Error('Failed to extract professor information from page');
    }
  }

  // Compare multiple professors
  async compareProfessors(rmpUrls) {
    if (!Array.isArray(rmpUrls) || rmpUrls.length === 0) {
      throw new Error('No RMP URLs provided for comparison');
    }

    if (rmpUrls.length > 3) {
      throw new Error('Maximum 3 professors can be compared at once');
    }

    try {
      const professorData = await Promise.all(
        rmpUrls.map(url => this.scrapeProfessorData(url))
      );

      const comparison = {
        professors: professorData,
        summary: this.generateComparisonSummary(professorData),
        recommendations: this.generateRecommendations(professorData)
      };

      return comparison;
    } catch (error) {
      console.error('Error comparing professors:', error);
      throw new Error(`Failed to compare professors: ${error.message}`);
    }
  }

  // Generate comparison summary
  generateComparisonSummary(professors) {
    const summary = {
      highestRated: null,
      easiest: null,
      mostRecommended: null,
      mostExperienced: null
    };

    if (professors.length === 0) return summary;

    // Find highest rated
    summary.highestRated = professors.reduce((prev, current) => 
      (prev.overallRating > current.overallRating) ? prev : current
    );

    // Find easiest (lowest difficulty)
    summary.easiest = professors.reduce((prev, current) => 
      (prev.difficulty < current.difficulty) ? prev : current
    );

    // Find most recommended
    summary.mostRecommended = professors.reduce((prev, current) => 
      (prev.wouldTakeAgain > current.wouldTakeAgain) ? prev : current
    );

    // Find most experienced (most ratings)
    summary.mostExperienced = professors.reduce((prev, current) => 
      (prev.totalRatings > current.totalRatings) ? prev : current
    );

    return summary;
  }

  // Generate recommendations based on comparison
  generateRecommendations(professors) {
    const recommendations = [];

    if (professors.length === 0) return recommendations;

    // Overall rating recommendation
    const avgRating = professors.reduce((sum, prof) => sum + prof.overallRating, 0) / professors.length;
    if (avgRating >= 4.0) {
      recommendations.push("All professors have excellent ratings!");
    } else if (avgRating >= 3.0) {
      recommendations.push("Professors have good overall ratings.");
    } else {
      recommendations.push("Consider reading recent reviews for more details.");
    }

    // Difficulty recommendation
    const avgDifficulty = professors.reduce((sum, prof) => sum + prof.difficulty, 0) / professors.length;
    if (avgDifficulty <= 2.0) {
      recommendations.push("All professors are considered relatively easy.");
    } else if (avgDifficulty >= 4.0) {
      recommendations.push("These professors are considered challenging.");
    }

    // Would take again recommendation
    const avgWouldTakeAgain = professors.reduce((sum, prof) => sum + prof.wouldTakeAgain, 0) / professors.length;
    if (avgWouldTakeAgain >= 80) {
      recommendations.push("High recommendation rate across all professors.");
    }

    return recommendations;
  }

  // Search for professors by name (if needed for future features)
  async searchProfessorByName(name, school = 'Queens College') {
    try {
      // This would require implementing a search functionality
      // For now, we'll return a placeholder
      throw new Error('Professor search by name not implemented yet');
    } catch (error) {
      console.error('Error searching professor:', error);
      throw new Error(`Failed to search professor: ${error.message}`);
    }
  }
}

module.exports = new RateMyProfessorService();
