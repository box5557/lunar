const express = require('express');
const app = express();
const { Pool } = require('pg');
const dotenv = require('dotenv');
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Import additional modules
const bodyParser = require('body-parser');

dotenv.config();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Add the following middleware after the app.use(express.urlencoded({ extended: true })) line
app.use(bodyParser.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/suggestion-box', (req, res) => {
    // Render the Suggestion Box page
});


// Start listener
http.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Add a new route for handling chat message submissions
app.post('/submit-message', async (req, res) => {
    try {
        const { username, message } = req.body;
        const result = await pool.query('INSERT INTO chat_messages (username, message) VALUES ($1, $2) RETURNING *', [username, message]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while submitting the message' });
    }
});

// Add a new route for retrieving chat messages
app.get('/get-messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM chat_messages ORDER BY timestamp ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching the messages' });
    }
});

app.get('/about-us', function(req, res){
    res.render('about-us');
});


io.on('connection', (socket) => {
  console.log('User connected');

  // Extract IP address and log it
  const ipAddress = socket.handshake.address;
  logUserIp(ipAddress);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
  
    socket.on('chat message', async (data) => {
        try {
            const { username, message } = data;
            const result = await pool.query('INSERT INTO chat_messages (username, message) VALUES ($1, $2) RETURNING *', [username, message]);
            const newMessage = result.rows[0];
            io.emit('chat message', newMessage); // Broadcast the new message to all connected clients

            // Check the number of messages and delete the oldest one if necessary
            const countResult = await pool.query('SELECT COUNT(*) FROM chat_messages');
            const messageCount = parseInt(countResult.rows[0].count);
            if (messageCount > 50) {
                await deleteOldestMessage();
            }

        } catch (err) {
            console.error(err);
        }
    });
});

async function deleteOldestMessage() {
    try {
        await pool.query('DELETE FROM chat_messages WHERE timestamp = (SELECT MIN(timestamp) FROM chat_messages)');
    } catch (err) {
        console.error(err);
    }
}


async function logUserIp(ipAddress) {
    try {
      await pool.query('INSERT INTO user_ips (ip_address) VALUES ($1)', [ipAddress]);
    } catch (err) {
      console.error(err);
    }
  }
  