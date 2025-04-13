const mongoose = require('mongoose');
const { MyConstants } = require('./MyConstants');

const uri = 'mongodb+srv://' + MyConstants.DB_USER + ':' + MyConstants.DB_PASS + '@' + MyConstants.DB_SERVER + '/' + MyConstants.DB_DATABASE;

mongoose.connect(uri)
    .then(() => { 
        console.log('Connected to MongoDB at ' + MyConstants.DB_SERVER); 
        console.log('Database:', MyConstants.DB_DATABASE);
    })
    .catch((err) => { 
        console.error('MongoDB connection error:', err); 
    });

// Add connection error handler
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

module.exports = mongoose;