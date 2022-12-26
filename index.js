

const express = require('express')
const app = express()
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config()

const user = require('./api/user');
const customer = require('./api/customer');

app.options('*',cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,x-token,application-id,module-id');
    next();
});

app.use(function(req, res, next) {
    req.headers['content-type'] = req.headers['content-type'] || 'application/json';
    next();
});
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
})

app.use(morgan('dev'))

app.use('/user', user);
app.use('/customer', customer);

const PORT = process.env.PORT || 3037;

app.listen(PORT, () => {
    console.log('application running')
    console.log(`http://localhost:${PORT}/`)
})