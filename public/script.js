const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.querySelector('.chat-box');

const chatToggle = document.getElementById('chat-toggle');
const chatWidget = document.getElementById('chat-widget');
const closeChat = document.getElementById('close-chat');
const quickBox = document.getElementById("quickQuestions");
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");

let conversationHistory = [];
let lastUserMessage = "";
let lastMessageId = null;

let userHasScrolled = false;
let isInitialLoad = true;
let hasStartedChat = false;
function scrollToBottom(force = false) {
  if (isInitialLoad && !force) return;
  if (!force && !userHasScrolled) return;

  chatBox.scrollTop = chatBox.scrollHeight;
}

chatBox.addEventListener("scroll", () => {
  userHasScrolled = true;
});

function toggleChat() {
  chatWidget.classList.toggle('hidden');
}

chatToggle?.addEventListener('click', toggleChat);
closeChat?.addEventListener('click', () => {
  chatWidget.classList.add('hidden');
});

hamburger?.addEventListener("click", (e) => {
  e.stopPropagation();
  navMenu.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
    navMenu.classList.remove("active");
  }
});

document.querySelectorAll("#navMenu a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
  });
});

function appendMessage(sender, text, isTemporary = false, showRetry = false, id = null) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  msg.dataset.id = id || Date.now();
  lastMessageId = msg.dataset.id;

  msg.innerHTML = text;

  if (showRetry) {
    const retryBtn = document.createElement('button');
    retryBtn.textContent = "Coba lagi 🔄";
    retryBtn.className = "retry-btn";

    retryBtn.onclick = () => {
      if (msg.dataset.id !== lastMessageId) return;
      retryLastMessage();
    };

    msg.appendChild(retryBtn);
  }
  chatBox.appendChild(msg);
  scrollToBottom();
  return isTemporary ? msg : null;
}

function updateMessage(el, text, showRetry = false) {
  if (!el) return;
  el.innerHTML = "";

  const msgText = document.createElement("div");
  msgText.innerHTML = text;
  el.appendChild(msgText);

  if (showRetry) {
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Coba lagi 🔄";
    retryBtn.className = "retry-btn";
    retryBtn.onclick = () => retryLastMessage(el);
    el.appendChild(retryBtn);
  }

  scrollToBottom(true);
}

document.querySelectorAll(".qq-bubble").forEach(bubble => {
  bubble.addEventListener("click", () => {
    const question = bubble.innerText.trim();

    input.value = question;
    hideQuickQuestions();

    form.dispatchEvent(new Event("submit", { cancelable: true }));
  });
});

function hideQuickQuestions() {
  const quickBox = document.getElementById("quickQuestions");
  if (!quickBox) return;

  quickBox.style.display = "none";
  hasStartedChat = true;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;
  hideQuickQuestions();

  lastUserMessage = userMessage;

  appendMessage('user', userMessage);
  conversationHistory.push({ role: 'user', text: userMessage });

  input.value = '';

  await sendToServer(userMessage);
});

async function sendToServer(message) {
  const messageId = Date.now();

  const thinking = appendMessage(
    'bot',
    '🤖 Lagi mikir sebentar ya...',
    true,
    false,
    messageId
  );

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: conversationHistory }),
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();

    if (data?.result) {
      updateMessage(thinking, data.result);
      conversationHistory.push({ role: 'model', text: data.result });
    } else {
      throw new Error("No response");
    }

  } catch (error) {
    updateMessage(
      thinking,
      `😢 Koneksi bermasalah.<br>Coba lagi ya, server lagi istirahat ☕`,
      true
    );
  }
}

function retryLastMessage() {
  if (!lastUserMessage) return;
  const messages = document.querySelectorAll(".message.bot");
  const lastBot = messages[messages.length - 1];
  if (lastBot) lastBot.remove();
  sendToServer(lastUserMessage);
}

window.addEventListener("load", () => {

  const quickBox = document.getElementById("quickQuestions");
  if (hasStartedChat) {
    quickBox.style.display = "none";
  }
  const greeting = `👋 Hai! Aku Codi, AI Assistant Coding School.<br>
  Kamu bisa tanya tentang:<br>
  • Belajar coding<br>
  • Roadmap Software Engineer<br>
  • Karir AI Engineer<br>
  • Tips interview & portfolio`;

  appendMessage("bot", greeting);
  conversationHistory.push({ role: "model", text: greeting });
  isInitialLoad = false;
});