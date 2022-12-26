
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const db = require('../databases')

router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  try {
    var conn = await db.getConnection()
    let [find] = await conn.execute("SELECT email,password FROM user where email=?",[email])
    if(find.length > 0){
        if(bcrypt.compareSync(password, find[0].password)){
          console.log('berhasil')
            res.status(200).json({
                message: 'Login Berhasil',
                token: jwt.sign({
                    email,
                    password
                },process.env.SECRET_KEY)
            })
        }else {
            throw new Error({
                status: 404,
                message : 'Password Wrong'
            })
        }
    }else {
        throw new Error({
            status: 404,
            message : 'Email Not Found'
        })
    }
    console.log('/login || BERHASIL')
    conn.release()
  } catch (error) {
    conn && conn.release()
    res.status(error.status || 500).json({ message: error.message } || error);
  }
});

module.exports = router
