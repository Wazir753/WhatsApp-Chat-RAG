const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function getSession(sender) {
    const session = sessions.get(sender);
    if (!session) return null;
    
    if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
        sessions.delete(sender);
        return null;
    }
    
    session.lastActivity = Date.now();
    return session;
}

function setSession(sender, state) {
    sessions.set(sender, {
        state: state,
        lastActivity: Date.now()
    });
}

function updateSession(sender, state) {
    const session = sessions.get(sender);
    if (session) {
        session.state = state;
        session.lastActivity = Date.now();
    }
}

function clearSession(sender) {
    sessions.delete(sender);
}

function cleanupOldSessions() {
    const now = Date.now();
    for (const [sender, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT) {
            sessions.delete(sender);
        }
    }
}

setInterval(cleanupOldSessions, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = {
    getSession,
    setSession,
    updateSession,
    clearSession
};
