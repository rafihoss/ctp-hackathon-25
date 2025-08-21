const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

class RateMyProfessorService {
  constructor() {
        this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];
    }

    // Extract professor name from RMP URL
    extractProfessorName(url) {
        try {
            const match = url.match(/\/professor\/([^\/]+)/);
            if (match) {
                return decodeURIComponent(match[1].replace(/-/g, ' '));
            }
            return null;
        } catch (error) {
            console.error('Error extracting professor name from URL:', error);
            return null;
        }
    }

    // Validate RMP URL
    validateRMPUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'www.ratemyprofessors.com' && 
                   urlObj.pathname.includes('/professor/');
        } catch (error) {
            return false;
        }
    }

    // Try multiple scraping strategies
    async scrapeRMPData(url) {
        const cacheKey = `rmp_${url}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log('📋 Returning cached RMP data');
            return cached;
        }

        console.log(`🔍 Scraping RMP data from: ${url}`);

        // Strategy 1: Direct scraping with rotating user agents
        let data = await this.directScrape(url);
        
        // Strategy 2: If direct scraping fails, try with different headers
        if (!data || !data.overallRating || data.overallRating === 'N/A') {
            console.log('🔄 Direct scraping failed, trying with enhanced headers...');
            data = await this.enhancedScrape(url);
        }

        // Strategy 3: If still no data, try with proxy-like approach
        if (!data || !data.overallRating || data.overallRating === 'N/A') {
            console.log('🔄 Enhanced scraping failed, trying with session approach...');
            data = await this.sessionScrape(url);
        }

        // If all strategies fail, return basic data from URL
        if (!data || !data.overallRating || data.overallRating === 'N/A') {
            console.log('⚠️ All scraping strategies failed, returning basic data');
            const professorName = this.extractProfessorName(url);
            data = {
                name: professorName || 'Unknown Professor',
                overallRating: 'N/A',
                wouldTakeAgain: 'N/A',
                difficulty: 'N/A',
                totalRatings: 'N/A',
                reviews: [],
                url: url,
                scrapingStatus: 'failed'
            };
        } else {
            data.url = url;
            data.scrapingStatus = 'success';
        }

        // Cache the result
        this.cache.set(cacheKey, data);
        return data;
    }

    // Strategy 1: Direct scraping
    async directScrape(url) {
        try {
            const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
            const response = await axios.get(url, {
        headers: {
                    'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: 15000
            });

            return this.parseRMPHTML(response.data, url);
    } catch (error) {
            console.error('Direct scraping failed:', error.message);
            return null;
        }
    }

    // Strategy 2: Enhanced scraping with more headers
    async enhancedScrape(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Cache-Control': 'max-age=0'
                },
                timeout: 20000
            });

            return this.parseRMPHTML(response.data, url);
        } catch (error) {
            console.error('Enhanced scraping failed:', error.message);
            return null;
        }
    }

    // Strategy 3: Session-based scraping
    async sessionScrape(url) {
        try {
            // Create a session to maintain cookies
            const session = axios.create({
                timeout: 25000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive'
                }
            });

            // First, visit the main page to get cookies
            await session.get('https://www.ratemyprofessors.com/');
            
            // Then scrape the professor page
            const response = await session.get(url);
            return this.parseRMPHTML(response.data, url);
        } catch (error) {
            console.error('Session scraping failed:', error.message);
            return null;
        }
    }

    // Parse RMP HTML with multiple selector strategies
    parseRMPHTML(html, url) {
        try {
            const $ = cheerio.load(html);
            
            // Strategy 1: Try modern RMP selectors
            let data = this.extractWithModernSelectors($);
            
            // Strategy 2: If modern selectors fail, try legacy selectors
            if (!data.name || data.overallRating === 'N/A') {
                data = this.extractWithLegacySelectors($);
            }
            
            // Strategy 3: If still no data, try generic selectors
            if (!data.name || data.overallRating === 'N/A') {
                data = this.extractWithGenericSelectors($);
            }

            // Fallback: Extract name from URL if all else fails
            if (!data.name) {
                data.name = this.extractProfessorName(url) || 'Unknown Professor';
            }

            return data;
        } catch (error) {
            console.error('Error parsing RMP HTML:', error);
            return null;
        }
    }

    // Modern RMP selectors (2024-2025)
    extractWithModernSelectors($) {
        const data = {
            name: '',
            overallRating: 'N/A',
            wouldTakeAgain: 'N/A',
            difficulty: 'N/A',
            totalRatings: 'N/A',
            reviews: []
        };

        // Try multiple selectors for name
        const nameSelectors = [
            'h1[data-testid="professor-name"]',
            'h1.ProfessorName__StyledProfessorName-sc-1y6qp06-0',
            'h1',
            '[data-testid="professor-name"]',
            '.ProfessorName__StyledProfessorName-sc-1y6qp06-0'
        ];

        for (const selector of nameSelectors) {
            const name = $(selector).first().text().trim();
            if (name && name.length > 0) {
                data.name = name;
                break;
            }
        }

        // Try multiple selectors for ratings
        const ratingSelectors = [
            '[data-testid="overall-rating"]',
            '.RatingValue__StyledRating-sc-1y6qp06-0',
            '.Rating__StyledRating-sc-1y6qp06-0',
            '[data-testid="rating"]'
        ];

        for (const selector of ratingSelectors) {
            const rating = $(selector).first().text().trim();
            if (rating && rating !== 'N/A') {
                data.overallRating = rating;
                break;
            }
        }

        // Extract other metrics
        const metrics = $('.RatingValue__StyledRating-sc-1y6qp06-0, [data-testid*="rating"]').map((i, el) => $(el).text().trim()).get();
        
        if (metrics.length >= 3) {
            data.wouldTakeAgain = metrics[1] || 'N/A';
            data.difficulty = metrics[2] || 'N/A';
            data.totalRatings = metrics[3] || 'N/A';
        }

        // Extract reviews
        const reviewSelectors = [
            '.Comments__StyledComments-sc-1y6qp06-0',
            '.Review__StyledReview-sc-1y6qp06-0',
            '[data-testid="review-text"]',
            '.ReviewText__StyledReviewText-sc-1y6qp06-0'
        ];

        for (const selector of reviewSelectors) {
            $(selector).each((i, element) => {
                if (i < 3) {
                    const reviewText = $(element).text().trim();
                    if (reviewText && reviewText.length > 20) {
                        data.reviews.push({ text: reviewText, rating: 'N/A' });
                    }
                }
            });
            if (data.reviews.length > 0) break;
        }

        return data;
    }

    // Legacy RMP selectors
    extractWithLegacySelectors($) {
        const data = {
            name: '',
            overallRating: 'N/A',
            wouldTakeAgain: 'N/A',
            difficulty: 'N/A',
            totalRatings: 'N/A',
            reviews: []
        };

        // Legacy name selectors
        const name = $('.professor-name, .NameTitle__Name-dowf0z-0, h1').first().text().trim();
        if (name) data.name = name;

        // Legacy rating selectors
        const rating = $('.RatingValue__Numerator-qw8sqy-0, .Rating__Numerator-qw8sqy-0').first().text().trim();
        if (rating) data.overallRating = rating;

        // Legacy metrics
        const metrics = $('.RatingValue__Numerator-qw8sqy-0, .Rating__Numerator-qw8sqy-0').map((i, el) => $(el).text().trim()).get();
        if (metrics.length >= 3) {
            data.wouldTakeAgain = metrics[1] || 'N/A';
            data.difficulty = metrics[2] || 'N/A';
            data.totalRatings = metrics[3] || 'N/A';
        }

        // Legacy reviews
        $('.Comments__Comments-dowf0z-0, .Review__Review-dowf0z-0').each((i, element) => {
            if (i < 3) {
                const reviewText = $(element).text().trim();
                if (reviewText && reviewText.length > 20) {
                    data.reviews.push({ text: reviewText, rating: 'N/A' });
                }
            }
        });

        return data;
    }

    // Generic selectors as last resort
    extractWithGenericSelectors($) {
        const data = {
            name: '',
            overallRating: 'N/A',
            wouldTakeAgain: 'N/A',
            difficulty: 'N/A',
            totalRatings: 'N/A',
            reviews: []
        };

        // Try to find any h1 or h2 that might be the name
        const name = $('h1, h2').first().text().trim();
        if (name && name.length > 0 && name.length < 100) {
            data.name = name;
        }

        // Try to find any numbers that might be ratings
        const text = $.text();
        const ratingMatch = text.match(/(\d+\.?\d*)\s*(?:out of|stars?|rating)/i);
        if (ratingMatch) {
            data.overallRating = ratingMatch[1];
        }

        // Try to find any percentage that might be "would take again"
        const percentageMatch = text.match(/(\d+)%\s*(?:would take again|take again)/i);
        if (percentageMatch) {
            data.wouldTakeAgain = percentageMatch[1] + '%';
        }

        return data;
    }

    // Get professor data with enhanced error handling
    async getProfessorData(url) {
        try {
            if (!this.validateRMPUrl(url)) {
                throw new Error('Invalid Rate My Professor URL');
            }

            const data = await this.scrapeRMPData(url);
            return {
                success: true,
                data: data
            };
    } catch (error) {
            console.error('Error getting professor data:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    name: this.extractProfessorName(url) || 'Unknown Professor',
                    overallRating: 'N/A',
                    wouldTakeAgain: 'N/A',
                    difficulty: 'N/A',
                    totalRatings: 'N/A',
                    reviews: [],
                    url: url,
                    scrapingStatus: 'error'
                }
            };
        }
    }

    // Compare multiple professors
    async compareProfessors(urls) {
        const results = [];
        
        for (const url of urls) {
            const result = await this.getProfessorData(url);
            results.push(result);
        }
        
        return results;
    }
}

module.exports = RateMyProfessorService;
