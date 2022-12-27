"user strict";

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
var bcrypt = require("bcryptjs");
const db = require("../databases");
const jwt = require("jsonwebtoken");
const auth = require("./authentication");


 router.post('/get', async (req,res)=>{
  let {bike_id,qr_code} = req.body
  
  try {
    var where = " where id=:bike_id"
    if(!qr_code){
      if(bike_id == "" || bike_id == null){
        throw {
          status: 400,
          message: 'Bike id Harus ada'
        }
      }
    } else {
      where = " where qr_code=:qr_code"
    }
    
    
    
    var conn = await db.getConnection()
    conn.beginTransaction()
    
    let query_customer = 'SELECT id,name,bike_name,no_handphone,qr_code,email,COALESCE(url_image,"") image_url,frame,drivetrain,cockpit,brake,wheelset FROM bike_data '+ where
    let [customer] = await conn.query(query_customer,{bike_id,qr_code});
    let cust_data = []
    if(customer.length != 0){
      
      for(let i =0;i<customer.length;i++){
        let obj  = {}
        let e = customer[i]
        obj.id = e.id
        obj.name = e.name
        obj.bike_name = e.bike_name
        obj.qr_code = e.qr_code
        obj.email = e.email
        obj.no_handphone= e.no_handphone
        obj.image_url= e.image_url
        obj.tanggal = e.tanggal
        obj.frame = e.frame
        obj.drivetrain = JSON.parse(e.drivetrain)
        obj.brake = e.brake
        obj.cockpit = JSON.parse(e.cockpit)
        obj.wheelset = JSON.parse(e.wheelset)
        cust_data.push(obj)
      }
    }
    let query_service = 'SELECT id,part_change, action action , notes , created FROM service_history sh where bike_id =:bike_id ORDER BY created DESC'
    let [row] = await conn.query(query_service,{bike_id : cust_data[0].id});

    conn.commit()
    conn.release();
    res.status(200).json({
      message: "oke",
      ...cust_data[0],
      history: row
    }, );
  } catch (error) {
    conn && conn.release();
    res.status(error.status || 500).json({ message: error.message } || error);
  }
 })

router.post("/add",auth,async (req, res) => {
  let { bike_id, part_change, action, notes,frame,drivertrain,cockpit,brake } = req.body;

  let id = uuidv4();
  try {
    if (bike_id == "" || bike_id == null) {
      throw {
        status: 400,
        message: "bike id harus ada",
      };
    }
    if (action == "" || action == null) {
      throw {
        status: 400,
        message: "action harus di isi",
      };
    }
    var conn = await db.getConnection();

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();

    var hh = String(today.getHours()).padStart(2,'0');
    var mmm = String(today.getMinutes()).padStart(2,'0');
    var ss = String(today.getSeconds()).padStart(2,'0');

    today = `${yyyy}-${mm}-${dd} ${hh}-${mmm}-${ss}`;
    console.log(conn.format("INSERT INTO service_history (id,bike_id,part_change,action,notes,created,frame,drivetrain,cockpit,brake) VALUES (:id,:bike_id,:part_change,:action,:notes,:created,:frame,:drivetrain,:cockpit,:brake)",
    {
      id,
      bike_id,
      part_change: JSON.stringify(part_change),
      action: JSON.stringify(action),
      notes,
      created: today
    }))
     let insert = await conn.query(
      "INSERT INTO service_history (id,bike_id,part_change,action,notes,created) VALUES (:id,:bike_id,:part_change,:action,:notes,:created)",
      {
        id,
        bike_id,
        part_change: JSON.stringify(part_change),
        action: JSON.stringify(action),
        notes,
        created: today
      }
    );
    console.log(insert)
    conn.release();
    res.status(201).json({
      message: "new service data added",
    });
  } catch (error) {
    console.log(error);
    conn && conn.release();
    res.status(error.status || 500).json({ message: error.message } || error);
  }
});

router.post("/edit",auth ,async(req,res)=>{
  let { id,part_change,action,notes} = req.body;

  try {
      let query = "UPDATE service_history SET part_change=:part_change, action=:action,notes=:notes WHERE id=:id"
      var conn = await db.getConnection()
      console.log(conn.format(query,{
        action: JSON.stringify(action),
        notes,
        part_change: JSON.stringify(part_change),
        id
      }))
      let set = await conn.query(query,{
        action: JSON.stringify(action),
        notes,
        part_change: JSON.stringify(part_change),
        id
      })
      
      conn.release()
      res.status(201).json({
        message: "service data updated",
      });
  } catch (error) {
    console.log(error)
    conn && conn.release();
    res.status(error.status || 500).json({ message: error.message } || error);
  }
})

router.post('/delete',auth, async (req,res)=>{
  let { id } = req.body;

  try {
    var conn = await db.getConnection()
      console.log(conn.format('DELETE FROM service_history WHERE id=?',[id]))
      let Delete = await conn.query("DELETE FROM service_history WHERE id=?",[id]);
      conn.release()
      res.status(201).json({
        message: "service data Deleted",
      });
  } catch (error) {
    console.log(error)
    conn && conn.release();
    res.status(error.status || 500).json({ message: error.message } || error);
  }
})

module.exports = router;
