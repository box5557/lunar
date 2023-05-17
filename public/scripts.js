const socket = io();

document.getElementById('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!message) {
    alert('Please enter a message.');
    return;
  }

  // Send the message to the server
  socket.emit('chat message', { username, message });
  document.getElementById('message').value = '';
});

socket.on('chat message', (message) => {
  displayMessages([message]);
});

// Fetch messages from the server
async function fetchMessages() {
  const response = await fetch('/get-messages');
  const messages = await response.json();
  displayMessages(messages);
}

// Display messages in the messages container
function displayMessages(messages) {
  const container = document.getElementById('messages-container');
  messages.forEach((message) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${message.username || 'Anonymous'}:</strong> ${message.message}`;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight; // Scroll to the bottom
  });
}

// Fetch messages initially
fetchMessages();


  