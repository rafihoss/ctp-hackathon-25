const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class ConversationService {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/conversations.db');
    this.db = null;
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      // Ensure the data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening conversation database:', err.message);
          reject(err);
        } else {
          console.log('Connected to conversation database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createConversationsTable = `
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          user_message TEXT NOT NULL,
          bot_response TEXT NOT NULL,
          professor_name TEXT,
          course_info TEXT,
          rmp_links TEXT,
          grade_data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT
        )
      `;

      const createSessionsTable = `
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT
        )
      `;

      this.db.serialize(() => {
        this.db.run(createSessionsTable, (err) => {
          if (err) {
            console.error('Error creating sessions table:', err);
            reject(err);
          }
        });

        this.db.run(createConversationsTable, (err) => {
          if (err) {
            console.error('Error creating conversations table:', err);
            reject(err);
          } else {
            console.log('Conversation tables created successfully');
            resolve();
          }
        });
      });
    });
  }

  // Create a new session
  async createSession(userId = null, metadata = {}) {
    return new Promise((resolve, reject) => {
      const sessionId = uuidv4();
      const sql = `
        INSERT INTO sessions (id, user_id, metadata)
        VALUES (?, ?, ?)
      `;
      
      this.db.run(sql, [sessionId, userId, JSON.stringify(metadata)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(sessionId);
        }
      });
    });
  }

  // Save a conversation message
  async saveMessage(sessionId, userMessage, botResponse, metadata = {}) {
    return new Promise((resolve, reject) => {
      const messageId = uuidv4();
      const sql = `
        INSERT INTO conversations (
          id, session_id, user_message, bot_response, 
          professor_name, course_info, rmp_links, grade_data, metadata
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        messageId,
        sessionId,
        userMessage,
        botResponse,
        metadata.professorName || null,
        metadata.courseInfo ? JSON.stringify(metadata.courseInfo) : null,
        metadata.rmpLinks ? JSON.stringify(metadata.rmpLinks) : null,
        metadata.gradeData ? JSON.stringify(metadata.gradeData) : null,
        JSON.stringify(metadata)
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(messageId);
        }
      });
    });
  }

  // Get conversation history for a session
  async getConversationHistory(sessionId, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM conversations 
        WHERE session_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
      
      this.db.all(sql, [sessionId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const conversations = rows.map(row => ({
            id: row.id,
            userMessage: row.user_message,
            botResponse: row.bot_response,
            professorName: row.professor_name,
            courseInfo: row.course_info ? JSON.parse(row.course_info) : null,
            rmpLinks: row.rmp_links ? JSON.parse(row.rmp_links) : null,
            gradeData: row.grade_data ? JSON.parse(row.grade_data) : null,
            timestamp: row.timestamp,
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
          }));
          resolve(conversations.reverse()); // Return in chronological order
        }
      });
    });
  }

  // Get recent sessions
  async getRecentSessions(userId = null, limit = 10) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT s.*, 
               COUNT(c.id) as message_count,
               MAX(c.timestamp) as last_message_time
        FROM sessions s
        LEFT JOIN conversations c ON s.id = c.session_id
      `;
      
      const params = [];
      if (userId) {
        sql += ` WHERE s.user_id = ?`;
        params.push(userId);
      }
      
      sql += ` GROUP BY s.id ORDER BY s.last_activity DESC LIMIT ?`;
      params.push(limit);
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const sessions = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            createdAt: row.created_at,
            lastActivity: row.last_activity,
            messageCount: row.message_count,
            lastMessageTime: row.last_message_time,
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
          }));
          resolve(sessions);
        }
      });
    });
  }

  // Update session last activity
  async updateSessionActivity(sessionId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE sessions 
        SET last_activity = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      this.db.run(sql, [sessionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Delete a session and all its conversations
  async deleteSession(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('DELETE FROM conversations WHERE session_id = ?', [sessionId], (err) => {
          if (err) {
            reject(err);
          }
        });

        this.db.run('DELETE FROM sessions WHERE id = ?', [sessionId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  // Search conversations by content
  async searchConversations(query, sessionId = null, limit = 20) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT c.*, s.user_id 
        FROM conversations c
        JOIN sessions s ON c.session_id = s.id
        WHERE (c.user_message LIKE ? OR c.bot_response LIKE ?)
      `;
      
      const params = [`%${query}%`, `%${query}%`];
      
      if (sessionId) {
        sql += ` AND c.session_id = ?`;
        params.push(sessionId);
      }
      
      sql += ` ORDER BY c.timestamp DESC LIMIT ?`;
      params.push(limit);
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const conversations = rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            userId: row.user_id,
            userMessage: row.user_message,
            botResponse: row.bot_response,
            professorName: row.professor_name,
            courseInfo: row.course_info ? JSON.parse(row.course_info) : null,
            timestamp: row.timestamp
          }));
          resolve(conversations);
        }
      });
    });
  }

  // Get conversation statistics
  async getConversationStats(sessionId = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(DISTINCT professor_name) as unique_professors,
          AVG(LENGTH(user_message)) as avg_user_message_length,
          AVG(LENGTH(bot_response)) as avg_bot_response_length,
          MIN(timestamp) as first_message,
          MAX(timestamp) as last_message
        FROM conversations
      `;
      
      const params = [];
      if (sessionId) {
        sql += ` WHERE session_id = ?`;
        params.push(sessionId);
      }
      
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalMessages: row.total_messages,
            totalSessions: row.total_sessions,
            uniqueProfessors: row.unique_professors,
            avgUserMessageLength: Math.round(row.avg_user_message_length || 0),
            avgBotResponseLength: Math.round(row.avg_bot_response_length || 0),
            firstMessage: row.first_message,
            lastMessage: row.last_message
          });
        }
      });
    });
  }

  // Close database connection
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Conversation database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = ConversationService;
