// /js/chatRoom.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, set, push, update, onDisconnect, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAgI4VQ0yUlcJOm_X7OHkeQ9L3BVlW1wyc",
    authDomain: "app-application-f73b9.firebaseapp.com",
    databaseURL: "https://app-application-f73b9-default-rtdb.firebaseio.com",
    projectId: "app-application-f73b9",
    storageBucket: "app-application-f73b9.appspot.com",
    messagingSenderId: "127997162999",
    appId: "1:127997162999:web:69da92f7a4c8b02631aaf2",
    measurementId: "G-VEWJTWJ710"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=default";
const NOTIFICATION_SOUND = new Audio('/assests/IPhone Ting.mp3'); // Fixed typo from 'assests' to 'assets'
let hasInteracted = false;
let isSoundMuted = localStorage.getItem('isSoundMuted') === 'true';

const getCurrentUser = () => sessionStorage.getItem("sender");
let currentChatPartner = null;

onAuthStateChanged(auth, (user) => {
    if (!user && window.location.pathname !== "/index.html" && window.location.pathname !== "/pages/login.html") {
        window.location.href = "/pages/login.html";
    }
});

document.addEventListener('click', () => {
    hasInteracted = true;
    if (!isSoundMuted) {
        NOTIFICATION_SOUND.play().catch(error => console.error("Initial interaction sound error:", error));
    }
}, { once: true });

const updateOnlineStatus = async () => {
    const username = getCurrentUser();
    if (!username) return;

    const userRef = ref(db, `onlineUsers/${username}`);
    // Fetch the current data from onlineUsers instead of users
    const userSnapshot = await getValueOnce(userRef);
    const savedAvatar = userSnapshot.val()?.avatar || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${username}`;

    await set(userRef, { username, lastActive: Date.now(), avatar: savedAvatar });
    const heartbeat = setInterval(() => update(userRef, { lastActive: Date.now() }), 30000);
    await onDisconnect(userRef).remove();
    window.addEventListener('beforeunload', () => clearInterval(heartbeat));
};

const getValueOnce = (ref) => new Promise((resolve) => onValue(ref, resolve, { onlyOnce: true }));

function openChat(otherUserName) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    currentChatPartner = otherUserName;
    document.getElementById('chatPartner').textContent = otherUserName;
    document.getElementById('chatPanel').classList.add('active');

    const updates = {
        [`userConversations/${currentUser}/${otherUserName}`]: { username: otherUserName, lastInteracted: Date.now(), unread: false },
        [`userConversations/${otherUserName}/${currentUser}`]: { username: currentUser, lastInteracted: Date.now() }
    };
    update(ref(db), updates);
    loadMessages(currentUser, otherUserName);
}

function sendMessage() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentChatPartner) return;

    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    const chatId = [currentUser, currentChatPartner].sort().join('_');
    const messagesRef = ref(db, `privateMessages/${chatId}`);
    const newMessageRef = push(messagesRef);

    set(newMessageRef, {
        sender: currentUser,
        receiver: currentChatPartner,
        text: messageText,
        isGif: false,
        timestamp: Date.now()
    }).then(() => {
        messageInput.value = '';
        update(ref(db), {
            [`userConversations/${currentUser}/${currentChatPartner}`]: { username: currentChatPartner, lastInteracted: Date.now(), unread: false },
            [`userConversations/${currentChatPartner}/${currentUser}`]: { username: currentUser, lastInteracted: Date.now(), unread: true }
        });
    });
}

window.sendGifMessage = function(gifUrl) {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentChatPartner) return;

    const chatId = [currentUser, currentChatPartner].sort().join('_');
    const messagesRef = ref(db, `privateMessages/${chatId}`);
    const newMessageRef = push(messagesRef);

    set(newMessageRef, {
        sender: currentUser,
        receiver: currentChatPartner,
        gifUrl,
        isGif: true,
        timestamp: Date.now()
    }).then(() => {
        update(ref(db), {
            [`userConversations/${currentUser}/${currentChatPartner}`]: { username: currentChatPartner, lastInteracted: Date.now(), unread: false },
            [`userConversations/${currentChatPartner}/${currentUser}`]: { username: currentUser, lastInteracted: Date.now(), unread: true }
        });
    });
};

function loadMessages(currentUser, otherUserName) {
    const chatId = [currentUser, otherUserName].sort().join('_');
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;

    let lastMessageTimestamp = localStorage.getItem(`lastMessageTimestamp_${chatId}`) || 0;

    onValue(ref(db, `privateMessages/${chatId}`), (snapshot) => {
        messagesDiv.innerHTML = "";
        if (!snapshot.exists()) {
            messagesDiv.innerHTML = "<p class='text-gray-400 text-base p-3'>No messages yet</p>";
            return;
        }

        snapshot.forEach(childSnapshot => {
            const message = childSnapshot.val();
            const messageElement = document.createElement("div");
            messageElement.className = `message ${message.sender === currentUser ? 'sent' : 'received'}`;

            if (message.isGif) {
                const img = document.createElement("img");
                img.src = message.gifUrl;
                img.style.maxWidth = "200px";
                img.style.maxHeight = "200px";
                messageElement.appendChild(img);
            } else {
                messageElement.textContent = message.text;
            }

            messagesDiv.appendChild(messageElement);

            if (message.sender !== currentUser && !message.isGif && message.timestamp > lastMessageTimestamp && hasInteracted && !isSoundMuted) {
                console.log("New text message received from:", message.sender);
                NOTIFICATION_SOUND.play().then(() => console.log("Sound played")).catch(error => console.error("Sound error:", error));
            }
            lastMessageTimestamp = Math.max(lastMessageTimestamp, message.timestamp);
        });
        localStorage.setItem(`lastMessageTimestamp_${chatId}`, lastMessageTimestamp);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

function loadOnlineUsers() {
    const onlineUsersDiv = document.getElementById('onlineUsers');
    if (!onlineUsersDiv) return;

    onValue(ref(db, "onlineUsers"), (snapshot) => {
        onlineUsersDiv.innerHTML = "";
        const currentUser = getCurrentUser();
        const users = [];

        if (!snapshot.exists()) {
            onlineUsersDiv.innerHTML = "<p class='text-gray-400 text-base p-3'>No online contacts</p>";
            return;
        }

        snapshot.forEach(childSnapshot => {
            const username = childSnapshot.key;
            const userData = childSnapshot.val();
            const timeSinceLastActive = Date.now() - (userData.lastActive || 0);

            if (username !== currentUser && timeSinceLastActive < 60000) {
                users.push({
                    username: userData.username,
                    avatar: userData.avatar || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${username}`
                });
            }
        });

        if (users.length === 0) {
            onlineUsersDiv.innerHTML = "<p class='text-gray-400 text-base p-3'>No online contacts</p>";
        } else {
            users.forEach(user => {
                const userElement = document.createElement("div");
                userElement.className = "chat-item cursor-pointer flex items-center gap-4";
                userElement.innerHTML = `
                    <img src="${user.avatar}" class="w-12 h-12 rounded-full" onerror="this.src='${DEFAULT_AVATAR}'">
                    <div class="flex-1">
                        <p class="font-medium text-white text-lg">${user.username}</p>
                        <p class="text-sm text-green-400">Online</p>
                    </div>
                `;
                userElement.onclick = () => openChat(user.username);
                onlineUsersDiv.appendChild(userElement);
            });
        }
    });
}

function loadConversationHistory() {
    const conversationListDiv = document.getElementById('conversationList');
    if (!conversationListDiv) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    onValue(ref(db, `userConversations/${currentUser}`), (convSnapshot) => {
        onValue(ref(db, "onlineUsers"), (onlineSnapshot) => {
            conversationListDiv.innerHTML = "";
            const conversations = [];
            const onlineUsers = onlineSnapshot.val() || {};

            if (!convSnapshot.exists()) {
                conversationListDiv.innerHTML = "<p class='text-gray-400 text-base p-3'>No chats yet</p>";
                return;
            }

            convSnapshot.forEach(childSnapshot => {
                const username = childSnapshot.key;
                const convData = childSnapshot.val();
                if (username !== currentUser) {
                    conversations.push({
                        username: username,
                        lastInteracted: convData.lastInteracted,
                        unread: convData.unread || false
                    });
                }
            });

            conversations.sort((a, b) => b.lastInteracted - a.lastInteracted);

            if (conversations.length === 0) {
                conversationListDiv.innerHTML = "<p class='text-gray-400 text-base p-3'>No chats yet</p>";
            } else {
                conversations.forEach(conv => {
                    const userData = onlineUsers[conv.username] || {};
                    const isOnline = userData.lastActive && (Date.now() - userData.lastActive) < 60000;
                    const avatar = userData.avatar || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${conv.username}`;
                    const userElement = document.createElement("div");
                    userElement.className = "chat-item cursor-pointer flex items-center gap-4 relative";
                    userElement.innerHTML = `
                        <img src="${avatar}" class="w-12 h-12 rounded-full" onerror="this.src='${DEFAULT_AVATAR}'">
                        <div class="flex-1">
                            <p class="font-medium text-white text-lg">${conv.username}</p>
                            <p class="text-sm ${isOnline ? 'text-green-400' : 'text-gray-400'}">
                                ${isOnline ? 'Online' : new Date(conv.lastInteracted).toLocaleTimeString()}
                            </p>
                        </div>
                        ${conv.unread ? '<span class="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full"></span>' : ''}
                    `;
                    userElement.onclick = () => openChat(conv.username);
                    conversationListDiv.appendChild(userElement);
                });
            }
        });
    });
}

// Toggle sound mute
window.toggleSoundMute = function() {
    isSoundMuted = !isSoundMuted;
    localStorage.setItem('isSoundMuted', isSoundMuted);
    const muteButton = document.getElementById('muteButton');
    muteButton.textContent = isSoundMuted ? 'Unmute Sound' : 'Mute Sound';
    muteButton.className = isSoundMuted ? 'bg-red-500 text-white p-2 rounded' : 'bg-green-500 text-white p-2 rounded';
};


function logOut() {
    const username = getCurrentUser();
    if (username) remove(ref(db, `onlineUsers/${username}`));
    signOut(auth).then(() => {
        sessionStorage.removeItem("sender");
        window.location.href = "/pages/login.html";
    });
}

window.openChat = openChat;
window.sendMessage = sendMessage;
window.sendGifMessage = sendGifMessage;
window.logOut = logOut; 
window.closeChat = function() {
    document.getElementById('chatPanel').classList.remove('active');
    currentChatPartner = null;
};
window.testSound = function() {
    if (!isSoundMuted) {
        NOTIFICATION_SOUND.play().then(() => console.log("Test sound played")).catch(error => console.error("Test sound error:", error));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
    loadOnlineUsers();
    loadConversationHistory();
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        muteButton.textContent = isSoundMuted ? 'Unmute Sound' : 'Mute Sound';
        muteButton.className = isSoundMuted ? 'bg-red-500 text-white p-2 rounded' : 'bg-green-500 text-white p-2 rounded';
    }
});