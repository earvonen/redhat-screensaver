const express = require('express');
const path = require('path');

const app = express();

const undefinedVar = {
  methodThatDoesntExists: function() {
    return 'Hello from methodThatDoesntExists!';
  }
};

undefinedVar.methodThatDoesntExists();

app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});