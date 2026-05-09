const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const chatToggle = document.getElementById('chat-toggle');
const chatWidget = document.getElementById('chat-widget');
const closeChat = document.getElementById('close-chat');
const quickBox = document.getElementById("quickQuestions");
let lastMessageId = null;
let conversationHistory = [];
let lastUserMessage = "";

function toggleChat() {
  chatWidget.classList.toggle('hidden');
}

chatToggle?.addEventListener('click', toggleChat);
closeChat?.addEventListener('click', () => {
  chatWidget.classList.add('hidden');
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
  chatBox.scrollTop = chatBox.scrollHeight;

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

  chatBox.scrollTop = chatBox.scrollHeight;
}

const bubbles = document.querySelectorAll(".qq-bubble");

bubbles.forEach(bubble => {
  bubble.addEventListener("click", () => {
    const question = bubble.innerText.trim();

    input.value = question;
    if (quickBox) quickBox.style.display = "none";

    form.dispatchEvent(new Event("submit", { cancelable: true }));
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

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
      `😢 Aduh koneksi lagi bermasalah.<br>
      Tenang ya, kadang server juga butuh kopi ☕<br>
      Yuk coba kirim lagi!`,
      true
    );
  }
}

function retryLastMessage() {
  if (!lastUserMessage) return;
  const messages = document.querySelectorAll(".message.bot");
  const lastBot = messages[messages.length - 1];

  if (lastBot) {
    lastBot.remove();
  }

  sendToServer(lastUserMessage);
}

window.addEventListener("load", () => {
  const greeting = `👋 Hai! Aku AI Career Assistant.<br>
  Kamu bisa tanya tentang:<br>
  • Belajar coding<br>
  • Roadmap Software Engineer<br>
  • Karir AI Engineer<br>
  • Tips interview & portfolio`;

  appendMessage("bot", greeting);
  conversationHistory.push({ role: "model", text: greeting });
});