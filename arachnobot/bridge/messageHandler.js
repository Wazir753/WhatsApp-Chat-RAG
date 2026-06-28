const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

function handleFirstMessage(sender) {
    return {
        text: `🕷️ *ArachnoBot here!*

I'm your personal AI assistant connected to your WhatsApp history.
I can search your conversations, find messages, and answer questions.

What do you need?

1️⃣ Search my chat history
2️⃣ Summarize a conversation
3️⃣ Find a specific message
4️⃣ Ask me anything
5️⃣ ℹ️ Help`,
        nextState: 'menu'
    };
}

function handleMenuResponse(input, session) {
    const choice = input.trim();
    
    switch (choice) {
        case '1':
            return {
                text: '🔍 What are you looking for? Type your search query.',
                nextState: 'search'
            };
        case '2':
            return {
                text: '📋 Which contact\'s conversation to summarize? Type their name.',
                nextState: 'summarize'
            };
        case '3':
            return {
                text: '📅 Describe the message or give a date range (e.g. "pizza recipe from Sara in March")',
                nextState: 'find'
            };
        case '4':
            return {
                text: '🧠 Go ahead, ask me anything about your conversations!',
                nextState: 'ask'
            };
        case '5':
            return {
                text: `🕷️ *ArachnoBot Help*

1️⃣ Search - Find anything in your chat history
2️⃣ Summarize - Get a summary of a conversation
3️⃣ Find - Locate specific messages
4️⃣ Ask - General questions about your chats

Just reply with the number to get started!`,
                nextState: 'menu'
            };
        default:
            return {
                text: '🕷️ Not sure what you mean! Reply with 1, 2, 3, 4, or 5 to get started.',
                nextState: 'menu'
            };
    }
}

async function handleSearch(query, sender) {
    try {
        const response = await axios.post(`${FASTAPI_URL}/chat`, {
            query: query,
            sender_id: sender,
            mode: 'search'
        });
        
        if (response.data.sources && response.data.sources.length > 0) {
            const source = response.data.sources[0];
            return `📍 Found it! ${source.contact} sent this on ${new Date(source.date).toLocaleDateString()}:

${source.snippet}

— from your chat with ${source.contact}, ${new Date(source.date).toLocaleDateString()} 🕷️`;
        } else {
            return '🕷️ Couldn\'t find anything matching that. Try a different search term!';
        }
    } catch (error) {
        console.error('Search error:', error.message);
        return '🕷️ Something went wrong searching. Please try again!';
    }
}

async function handleSummarize(contactName, sender) {
    try {
        const response = await axios.post(`${FASTAPI_URL}/summarize`, {
            contact_name: contactName,
            days_back: 30
        });
        
        const summary = response.data;
        return `📋 *Summary of conversation with ${contactName}*

🗓️ Last talked: ${new Date(summary.last_talked).toLocaleDateString()}
💬 Messages: ${summary.message_count}
🔑 Key topics: ${summary.key_topics.join(', ')}

${summary.summary}

🕷️`;
    } catch (error) {
        console.error('Summarize error:', error.message);
        return '🕷️ Couldn\'t summarize that conversation. Make sure the contact name is correct!';
    }
}

async function handleFind(query, sender) {
    try {
        const response = await axios.post(`${FASTAPI_URL}/chat`, {
            query: query,
            sender_id: sender,
            mode: 'find'
        });
        
        if (response.data.sources && response.data.sources.length > 0) {
            const source = response.data.sources[0];
            return `📍 Found this message:

${source.snippet}

— ${source.contact}, ${new Date(source.date).toLocaleDateString()} 🕷️`;
        } else {
            return '🕷️ Couldn\'t find that message. Try being more specific!';
        }
    } catch (error) {
        console.error('Find error:', error.message);
        return '🕷️ Something went wrong. Please try again!';
    }
}

async function handleAsk(query, sender) {
    try {
        const response = await axios.post(`${FASTAPI_URL}/chat`, {
            query: query,
            sender_id: sender,
            mode: 'ask'
        });
        
        return `${response.data.answer}

🕷️`;
    } catch (error) {
        console.error('Ask error:', error.message);
        return '🕷️ My brain is warming up! Try again in 30 seconds.';
    }
}

module.exports = {
    handleFirstMessage,
    handleMenuResponse,
    handleSearch,
    handleSummarize,
    handleFind,
    handleAsk
};
