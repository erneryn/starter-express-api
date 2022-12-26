

const express = require('express')
const app = express()
const morgan = require('morgan');
require('dotenv').config()


const user = require('./api/user');
const customer = require('./api/customer');


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