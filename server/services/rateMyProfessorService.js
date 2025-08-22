// Required dependencies for web scraping and caching
const axios = require('axios'); // HTTP client for making web requests
const cheerio = require('cheerio'); // Server-side jQuery implementation for HTML parsing
const NodeCache = require('node-cache'); // In-memory caching for performance optimization

/**
 * RateMyProfessorService - Advanced web scraping service for Rate My Professor data
 * 
 * This service implements a robust multi-strategy approach to scrape professor data
 * from Rate My Professor, handling various website structure changes and anti-bot measures.
 * 
 * Key Features:
 * - Multiple scraping strategies (direct, enhanced, session-based)
 * - Multiple selector strategies (modern, legacy, generic)
 * - Intelligent caching (30-minute TTL)
 * - User agent rotation to avoid detection
 * - Graceful error handling and fallbacks
 */
class RateMyProfessorService {
  constructor() {
        // Initialize cache with 30-minute TTL for performance optimization
        this.cache = new NodeCache({ stdTTL: 1800 });
        
        // Rotate between different user agents to avoid bot detection
        // These mimic real browsers (Chrome, Safari, Firefox) on different platforms
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];
    }

    /**
     * Extract professor name from Rate My Professor URL
     * 
     * RMP URLs typically follow the pattern: /professor/FirstName-LastName-123456
     * This method extracts and cleans the name portion for display
     * 
     * @param {string} url - Rate My Professor URL
     * @returns {string|null} - Cleaned professor name or null if extraction fails
     */
    extractProfessorName(url) {
        try {
            // Use regex to match the professor name pattern in RMP URLs
            // Pattern: /professor/Name-Name-ID -> extracts "Name-Name"
            const match = url.match(/\/professor\/([^\/]+)/);
            if (match) {
                // Decode URI components and replace hyphens with spaces
                // "John-Smith" becomes "John Smith"
                return decodeURIComponent(match[1].replace(/-/g, ' '));
            }
            return null;
        } catch (error) {
            console.error('Error extracting professor name from URL:', error);
            return null;
        }
    }

    /**
     * Validate if a URL is a proper Rate My Professor URL
     * 
     * Ensures the URL matches the expected RMP domain and path structure
     * 
     * @param {string} url - URL to validate
     * @returns {boolean} - True if valid RMP professor URL, false otherwise
     */
    validateRMPUrl(url) {
        try {
            const urlObj = new URL(url);
            // Check for correct hostname and professor path
            return urlObj.hostname === 'www.ratemyprofessors.com' && 
                   urlObj.pathname.includes('/professor/');
        } catch (error) {
            // Invalid URL format
            return false;
        }
    }

    /**
     * Main scraping orchestrator - tries multiple strategies to extract RMP data
     * 
     * This method implements a cascading fallback system:
     * 1. Check cache first for performance
     * 2. Try direct scraping (fastest)
     * 3. Try enhanced scraping (more headers)
     * 4. Try session scraping (most browser-like)
     * 5. Return fallback data if all fail
     * 
     * @param {string} url - Rate My Professor URL to scrape
     * @returns {Object} - Professor data object with ratings, reviews, etc.
     */
    async scrapeRMPData(url) {
        // Create unique cache key for this URL
        const cacheKey = `rmp_${url}`;
        const cached = this.cache.get(cacheKey);
        
        // Return cached data if available (30-minute TTL)
        if (cached) {
            console.log('📋 Returning cached RMP data');
            return cached;
        }

        console.log(`🔍 Scraping RMP data from: ${url}`);

        // Strategy 1: Direct scraping with rotating user agents
        // Fastest approach - simple HTTP request with realistic headers
        let data = await this.directScrape(url);
        
        // Strategy 2: Enhanced scraping with comprehensive browser headers
        // More sophisticated headers to mimic modern browsers
        if (!data || !data.overallRating || data.overallRating === 'N/A') {
            console.log('🔄 Direct scraping failed, trying with enhanced headers...');
            data = await this.enhancedScrape(url);
        }

        // Strategy 3: Session-based scraping with cookie management
        // Most browser-like approach - establishes session first
        if (!data || !data.overallRating || data.overallRating === 'N/A') {
            console.log('🔄 Enhanced scraping failed, trying with session approach...');
            data = await this.sessionScrape(url);
        }

        // Fallback: Create minimal data structure if all scraping fails
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
            // Mark successful scraping
            data.url = url;
            data.scrapingStatus = 'success';
        }

        // Cache the result for future requests (30-minute TTL)
        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Strategy 1: Direct scraping with basic browser headers
     * 
     * The simplest and fastest scraping approach using randomly selected
     * user agents to avoid basic bot detection
     * 
     * @param {string} url - RMP URL to scrape
     * @returns {Object|null} - Parsed professor data or null if failed
     */
    async directScrape(url) {
        try {
            // Randomly select a user agent to rotate and avoid detection
            const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
            
            // Make HTTP request with basic browser headers
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
                timeout: 15000 // 15-second timeout
            });

            // Parse the HTML response using Cheerio
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

    /**
     * Core HTML parsing method using Cheerio (server-side jQuery)
     * 
     * This is where the magic happens! Cheerio loads the HTML and allows us
     * to use jQuery-like selectors to extract data from the RMP page.
     * 
     * The method tries multiple selector strategies because RMP frequently
     * changes their HTML structure and CSS classes.
     * 
     * @param {string} html - Raw HTML content from RMP page
     * @param {string} url - Original URL for fallback name extraction
     * @returns {Object|null} - Extracted professor data or null if parsing fails
     */
    parseRMPHTML(html, url) {
        try {
            // Load HTML into Cheerio - now we can use jQuery syntax!
            // $ becomes our jQuery-like object for DOM manipulation
            const $ = cheerio.load(html);
            
            // Strategy 1: Try modern RMP selectors (2024-2025 website structure)
            // These selectors target the current RMP design
            let data = this.extractWithModernSelectors($);
            
            // Strategy 2: Try legacy selectors (older website structures)
            // Fallback for when RMP hasn't fully updated their pages
            if (!data.name || data.overallRating === 'N/A') {
                data = this.extractWithLegacySelectors($);
            }
            
            // Strategy 3: Try generic pattern matching
            // Last resort - look for patterns in the text content
            if (!data.name || data.overallRating === 'N/A') {
                data = this.extractWithGenericSelectors($);
            }

            // Final fallback: Extract name from URL if HTML parsing completely fails
            if (!data.name) {
                data.name = this.extractProfessorName(url) || 'Unknown Professor';
            }

            return data;
        } catch (error) {
            console.error('Error parsing RMP HTML:', error);
            return null;
        }
    }

    /**
     * Modern RMP selectors (2024-2025) - Core Cheerio jQuery usage
     * 
     * This method demonstrates how Cheerio works as server-side jQuery:
     * - Use CSS selectors to find elements: $('selector')
     * - Extract text content: .text()
     * - Iterate through elements: .each()
     * - Map elements to arrays: .map()
     * 
     * @param {CheerioStatic} $ - Cheerio instance loaded with HTML
     * @returns {Object} - Extracted professor data
     */
    extractWithModernSelectors($) {
        // Initialize data structure for professor information
        const data = {
            name: '',
            overallRating: 'N/A',
            wouldTakeAgain: 'N/A',
            difficulty: 'N/A',
            totalRatings: 'N/A',
            reviews: []
        };

        // Multiple selectors for professor name (RMP changes these frequently)
        // We try each selector until we find one that works
        const nameSelectors = [
            'h1[data-testid="professor-name"]',        // Current RMP structure
            'h1.ProfessorName__StyledProfessorName-sc-1y6qp06-0', // Styled-components class
            'h1',                                       // Generic h1 fallback
            '[data-testid="professor-name"]',          // Any element with test ID
            '.ProfessorName__StyledProfessorName-sc-1y6qp06-0'   // Class-only selector
        ];

        // Loop through selectors until we find the professor name
        for (const selector of nameSelectors) {
            // Cheerio syntax: $(selector) finds elements, .first() gets first match, .text() extracts text
            const name = $(selector).first().text().trim();
            if (name && name.length > 0) {
                data.name = name;
                break; // Found it! Stop looking
            }
        }

        // Multiple selectors for overall rating - same strategy
        const ratingSelectors = [
            '[data-testid="overall-rating"]',          // Modern data-testid approach
            '.RatingValue__StyledRating-sc-1y6qp06-0', // Styled-components class
            '.Rating__StyledRating-sc-1y6qp06-0',      // Alternative styling
            '[data-testid="rating"]'                   // Generic rating test ID
        ];

        for (const selector of ratingSelectors) {
            const rating = $(selector).first().text().trim();
            if (rating && rating !== 'N/A') {
                data.overallRating = rating;
                break;
            }
        }

        // Extract additional metrics (would take again %, difficulty, total ratings)
        // .map() creates an array from all matching elements
        // .get() converts Cheerio object to regular JavaScript array
        const metrics = $('.RatingValue__StyledRating-sc-1y6qp06-0, [data-testid*="rating"]')
            .map((i, el) => $(el).text().trim()).get();
        
        // If we found multiple rating elements, assign them to specific fields
        if (metrics.length >= 3) {
            data.wouldTakeAgain = metrics[1] || 'N/A';
            data.difficulty = metrics[2] || 'N/A';
            data.totalRatings = metrics[3] || 'N/A';
        }

        // Extract student reviews - try multiple selectors
        const reviewSelectors = [
            '.Comments__StyledComments-sc-1y6qp06-0',    // Comment containers
            '.Review__StyledReview-sc-1y6qp06-0',        // Review containers
            '[data-testid="review-text"]',               // Test ID approach
            '.ReviewText__StyledReviewText-sc-1y6qp06-0' // Text-specific styling
        ];

        for (const selector of reviewSelectors) {
            // .each() iterates through all matching elements
            $(selector).each((i, element) => {
                if (i < 3) { // Limit to first 3 reviews for performance
                    const reviewText = $(element).text().trim();
                    if (reviewText && reviewText.length > 20) { // Filter out short/empty reviews
                        data.reviews.push({ text: reviewText, rating: 'N/A' });
                    }
                }
            });
            if (data.reviews.length > 0) break; // Found reviews, stop looking
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
