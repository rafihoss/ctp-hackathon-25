const express = require('express');
const router = express.Router();

// Get conversation history for a session
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await req.conversationService.getConversationHistory(sessionId, parseInt(limit));
    
    res.json({
      success: true,
      sessionId,
      history
    });
  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history'
    });
  }
});

// Get recent sessions
router.get('/sessions', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;
    
    const sessions = await req.conversationService.getRecentSessions(userId, parseInt(limit));
    
    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

// Create a new session
router.post('/sessions', async (req, res) => {
  try {
    const { userId, metadata = {} } = req.body;
    
    const sessionId = await req.conversationService.createSession(userId, metadata);
    
    res.json({
      success: true,
      sessionId
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

// Delete a session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await req.conversationService.deleteSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
});

// Search conversations
router.get('/search', async (req, res) => {
  try {
    const { query, sessionId, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const conversations = await req.conversationService.searchConversations(query, sessionId, parseInt(limit));
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Search conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search conversations'
    });
  }
});

// Get conversation statistics
router.get('/stats', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    const stats = await req.conversationService.getConversationStats(sessionId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get conversation stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation statistics'
    });
  }
});

module.exports = router;
