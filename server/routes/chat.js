import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../services/db.js';
import { generateQueryEmbedding, streamChatCompletion } from '../services/ai.js';
import { search, getStoreSize } from '../services/vectorStore.js';

const router = express.Router();

// Get all chats for the user
router.get('/', (req, res) => {
  try {
    // Assuming auth middleware isn't fully locking down without user_id, 
    // but in a real app we'd use req.user.id. Using user 1 for now based on db.js defaults.
    const userId = 1; 
    const db = getDb();
    
    const chats = db.prepare('SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get a specific chat and its messages
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = db.prepare('SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC').all(req.params.id);
    
    // Parse sources JSON
    const parsedMessages = messages.map(msg => ({
      ...msg,
      sources: msg.sources ? JSON.parse(msg.sources) : []
    }));

    res.json({ chat, messages: parsedMessages });
  } catch (error) {
    console.error('Error fetching chat details:', error);
    res.status(500).json({ error: 'Failed to fetch chat details' });
  }
});

// Create a new chat session
router.post('/', (req, res) => {
  try {
    const { title } = req.body;
    const userId = 1;
    const db = getDb();
    const chatId = uuidv4();

    db.prepare('INSERT INTO chats (id, user_id, title) VALUES (?, ?, ?)').run(chatId, userId, title || 'New Chat');
    
    const newChat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Send a message to a chat session (Streamed Response)
router.post('/:id/message', async (req, res) => {
  try {
    const { content } = req.body;
    const chatId = req.params.id;
    const db = getDb();

    // Verify API key exists before anything else
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'Missing GROQ_API_KEY in environment variables.' });
    }

    console.log(`[Chat] Request received for chat ${chatId}`);

    // Verify chat exists
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Save user message
    const userMsgId = uuidv4();
    db.prepare('INSERT INTO chat_messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)').run(
      userMsgId, chatId, 'user', content
    );

    // Get chat history for context
    const history = db.prepare('SELECT role, content FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC').all(chatId);
    
    // Format history for LLM - limit to last 4 exchanges (8 messages)
    const llmMessages = history.slice(-8).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Generate embedding for the new user query to find relevant papers
    const prefs = db.prepare('SELECT semanticModel FROM user_preferences WHERE user_id = ?').get(chat.user_id) || { semanticModel: 'text-embedding-3-small' };
    
    let searchResults = [];
    let noContext = false;
    let contextText = '';
    const sources = [];
    let finalMessages = [];
    
    const MAX_CONTEXT_TOKENS = 6000;
    const topKSequence = [10, 5, 3, 1];

    // Check if we have any papers indexed
    if (getStoreSize() === 0) {
      console.log('[Chat] No papers indexed in vector store. Skipping search.');
      noContext = true;
    } else {
      let queryEmbedding;
      try {
        console.log(`[Chat] Generating embedding using ${prefs.semanticModel}...`);
        queryEmbedding = await generateQueryEmbedding(content, prefs.semanticModel);
      } catch (embedError) {
        console.error('[Chat] Vector search failed, falling back to LLM-only mode:', embedError.message);
        noContext = true;
      }
      
      if (!noContext) {
        for (let i = 0; i < topKSequence.length; i++) {
          const k = topKSequence[i];
          console.log(`[Chat] Searching vector store with TopK=${k}...`);
          searchResults = search(queryEmbedding, k);
          console.log(`[Chat] Retrieved ${searchResults.length} chunks`);
          
          sources.length = 0; // Clear previous iteration
          contextText = "BACKGROUND CONTEXT FROM UPLOADED PAPERS:\n\n";
          
          if (searchResults.length > 0) {
            const paperIds = searchResults.map(r => r.paperId);
            const placeholders = paperIds.map(() => '?').join(',');
            const papers = db.prepare(`SELECT id, title, authors, abstract, year FROM papers WHERE id IN (${placeholders})`).all(paperIds);
            
            for (const paper of papers) {
              // Truncate to 1000 characters maximum
              const truncatedContent = paper.abstract ? paper.abstract.slice(0, 1000) : '';
              contextText += `[Source ID: ${paper.id}]\nTitle: ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year}\nAbstract/Content:\n${truncatedContent}\n\n`;
              sources.push({
                id: paper.id,
                title: paper.title,
                authors: paper.authors,
                year: paper.year
              });
            }
          } else {
            contextText = "No relevant background context found in the uploaded papers.";
            noContext = true;
          }

          const systemPrompt = `You are a research assistant.
Use only the provided excerpts.
If information is unavailable, say so explicitly.

Context:
${contextText}

Answer:
Only retrieved excerpts should be inserted. Never inject full PDFs.`;

          finalMessages = [
            { role: 'system', content: systemPrompt },
            ...llmMessages
          ];
          
          // Estimate tokens
          const promptString = JSON.stringify(finalMessages);
          const estimatedTokens = Math.ceil(promptString.length / 4);
          
          console.log(`[Chat] Estimated Tokens: ${estimatedTokens} (Budget: ${MAX_CONTEXT_TOKENS})`);
          
          if (estimatedTokens <= MAX_CONTEXT_TOKENS) {
            console.log('[Chat] Prompt is within budget.');
            break; // Stop retrying, we found a good fit
          } else {
            console.warn(`[Chat] Prompt exceeds budget with TopK=${k}.`);
            if (i === topKSequence.length - 1) {
               // We reached the lowest TopK and it's still too large
               if (estimatedTokens > 10000) {
                 throw new Error("Prompt exceeds token budget");
               }
            } else {
               console.log("The retrieved research context is too large. Refining the search and retrying...");
            }
          }
        }
      }
    }
    
    if (noContext) {
      const systemPrompt = `You are a research assistant. Use your general knowledge since no papers were found.
If information is unavailable, say so explicitly.`;
      finalMessages = [
        { role: 'system', content: systemPrompt },
        ...llmMessages
      ];
      const estimatedTokens = Math.ceil(JSON.stringify(finalMessages).length / 4);
      console.log(`[Chat] Estimated Tokens (No Context): ${estimatedTokens}`);
      if (estimatedTokens > 10000) {
        throw new Error("Prompt exceeds token budget");
      }
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream response
    console.log('[Chat] Calling LLM...');
    await streamChatCompletion(
      finalMessages,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      (fullContent) => {
        console.log('[Chat] Response generated successfully');
        // Save assistant message to DB
        const assistantMsgId = uuidv4();
        db.prepare('INSERT INTO chat_messages (id, chat_id, role, content, sources) VALUES (?, ?, ?, ?, ?)').run(
          assistantMsgId, chatId, 'assistant', fullContent, JSON.stringify(sources)
        );
        
        res.write(`data: ${JSON.stringify({ done: true, sources, noContext })}\n\n`);
        res.end();
      },
      (error) => {
        console.error('Error during chat stream:', error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to generate response from LLM' })}\n\n`);
        res.end();
      }
    );

  } catch (error) {
    console.error('Error in chat message route:', error);
    if (!res.headersSent) {
      res.status(error.message === 'Prompt exceeds token budget' ? 413 : 500).json({ 
        error: error.message === 'Prompt exceeds token budget' 
          ? "The retrieved research context is too large. Try asking a more specific question." 
          : 'Internal server error' 
      });
    }
  }
});

// Update chat title
router.patch('/:id', (req, res) => {
  try {
    const { title } = req.body;
    const db = getDb();
    
    db.prepare('UPDATE chats SET title = ? WHERE id = ?').run(title, req.params.id);
    const updatedChat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.id);
    
    res.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// Delete a chat session
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    // Due to ON DELETE CASCADE on chat_messages, we only need to delete the chat
    db.prepare('DELETE FROM chats WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;
