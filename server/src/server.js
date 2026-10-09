// server/src/server.js
// Entry point — binds the Express app to a port.

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚗 Carpooling server running on http://localhost:${PORT}`);
});
