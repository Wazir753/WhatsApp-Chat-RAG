const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const sessionStore = require('./sessionStore');
const messageHandler = require('./messageHandler');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const logger = pino({ level: 'silent' });

async function connectToWhatsApp() {
    const authFolder = path.join(__dirname, 'session');
    
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ['ArachnoBot', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n🕷️ Scan this QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🕷️ Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('🕷️ ArachnoBot is connected!');
            await setupBotProfile(sock);
            await syncChatHistory(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
                await handleIncomingMessage(sock, msg);
            }
        }
    });

    return sock;
}

async function setupBotProfile(sock) {
    try {
        console.log('🕷️ Setting up bot profile...');
        
        await sock.updateProfileName('ArachnoBot 🕷️');
        console.log('✓ Bot name set to ArachnoBot');
        
        const avatarPathPng = path.join(__dirname, 'avatar.png');
        const avatarPathSvg = path.join(__dirname, 'avatar.svg');
        
        if (fs.existsSync(avatarPathPng)) {
            try {
                const avatarBuffer = fs.readFileSync(avatarPathPng);
                await sock.updateProfilePicture(sock.user.id, avatarBuffer);
                console.log('✓ Avatar updated (PNG)');
            } catch (avatarError) {
                console.log('⚠ Could not set avatar:', avatarError.message);
            }
        } else if (fs.existsSync(avatarPathSvg)) {
            console.log('⚠ Avatar SVG found but WhatsApp requires PNG. Convert avatar.svg to avatar.png for profile picture.');
        } else {
            console.log('⚠ No avatar file found. Place avatar.png or avatar.svg in the bridge directory.');
        }
        
        await sock.updateProfileStatus('Your AI assistant — ask me anything 🧠');
        console.log('✓ Status updated');
        
    } catch (error) {
        console.log('⚠ Profile setup error:', error.message);
    }
}

async function syncChatHistory(sock) {
    try {
        console.log('🕷️ Syncing chat history (last 30 days)...');
        
        const chats = await sock.fetchChats();
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const chatHistory = [];
        
        for (const chat of chats) {
            if (!chat.id.endsWith('@s.whatsapp.net')) continue;
            
            try {
                const messages = await sock.fetchMessages(chat.id, { limit: 100 });
                
                for (const msg of messages) {
                    if (msg.messageTimestamp * 1000 < thirtyDaysAgo) continue;
                    if (!msg.message) continue;
                    
                    const messageContent = msg.message.conversation || 
                                         msg.message.extendedTextMessage?.text ||
                                         JSON.stringify(msg.message);
                    
                    chatHistory.push({
                        contact: chat.name || chat.id.split('@')[0],
                        phone: chat.id,
                        message: messageContent,
                        timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
                        direction: msg.key.fromMe ? 'outgoing' : 'incoming'
                    });
                }
            } catch (chatError) {
                console.log(`⚠ Could not fetch messages for ${chat.id}`);
            }
        }
        
        if (chatHistory.length > 0) {
            const response = await axios.post(`${FASTAPI_URL}/sync`, {
                messages: chatHistory
            });
            console.log(`✓ Synced ${response.data.chunks_stored} chunks from ${response.data.contacts_indexed} contacts`);
        } else {
            console.log('⚠ No messages to sync');
        }
        
    } catch (error) {
        console.log('⚠ Sync error:', error.message);
    }
}

async function handleIncomingMessage(sock, msg) {
    const sender = msg.key.remoteJid;
    const messageContent = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text ||
                         '';
    
    if (!messageContent) return;
    
    console.log(`🕷️ Message from ${sender}: ${messageContent}`);
    
    await sock.readMessages([msg.key]);
    
    const session = sessionStore.getSession(sender);
    
    if (session && session.state === 'menu') {
        const response = messageHandler.handleMenuResponse(messageContent, session);
        await sendReply(sock, sender, response);
        sessionStore.updateSession(sender, response.nextState);
    } else if (session && session.state === 'search') {
        const response = await messageHandler.handleSearch(messageContent, sender);
        await sendReply(sock, sender, response);
        sessionStore.clearSession(sender);
    } else if (session && session.state === 'summarize') {
        const response = await messageHandler.handleSummarize(messageContent, sender);
        await sendReply(sock, sender, response);
        sessionStore.clearSession(sender);
    } else if (session && session.state === 'find') {
        const response = await messageHandler.handleFind(messageContent, sender);
        await sendReply(sock, sender, response);
        sessionStore.clearSession(sender);
    } else if (session && session.state === 'ask') {
        const response = await messageHandler.handleAsk(messageContent, sender);
        await sendReply(sock, sender, response);
        sessionStore.clearSession(sender);
    } else {
        const response = messageHandler.handleFirstMessage(sender);
        await sendReply(sock, sender, response);
        sessionStore.setSession(sender, { state: 'menu' });
    }
}

async function sendReply(sock, jid, text) {
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await sock.sendMessage(jid, { text });
    await sock.sendPresenceUpdate('available', jid);
}

connectToWhatsApp().catch(console.error);
