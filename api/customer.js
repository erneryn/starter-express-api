
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
var bcrypt = require("bcryptjs");
const db = require("../databases");
const jwt = require("jsonwebtoken");
const auth = require("./authentication");


router.post("/get", auth, async (req, res) => {
  let name = req.body.name || null;
  let qr_code = req.body.qr_code || null;
  let no_handphone = req.body.no_handphone || null;
  let param_string = "";
  let params = {};

  if (name) {
    param_string = "name";
  } else if (qr_code) {
    param_string = "qr_code";
    params.qr_code = qr_code;
  } else if (no_handphone) {
    param_string = "no_handphone";
    params.no_handphone = no_handphone;
  }

  try {
    var conn = await db.getConnection();
    let query = "";
    if (param_string == "") {
      query =
        "SELECT id,name,bike_name,no_handphone,qr_code,email,COALESCE(url_image,'') url_image, history.tanggal,frame,drivetrain,cockpit,brake,wheelset FROM bike_data bd LEFT JOIN ( SELECT MAX(created) tanggal, bike_id FROM service_history sh GROUP BY bike_id ) history ON history.bike_id = bd.id ORDER BY history.tanggal DESC";
    } else if (param_string == "name") {
      query =
        "SELECT id,name,bike_name,no_handphone,qr_code,email,COALESCE(url_image,'') url_image, history.tanggal,frame,drivetrain,cockpit,brake,wheelset FROM bike_data bd LEFT JOIN ( SELECT MAX(created) tanggal, bike_id FROM service_history sh GROUP BY bike_id ) history ON history.bike_id = bd.id WHERE name LIKE '%" +
        name +
        "%';";
    } else {
      query =
        "SELECT id,name,bike_name,no_handphone,qr_code,email,COALESCE(url_image,'') url_image, history.tanggal,frame,drivetrain,cockpit,brake,wheelset FROM bike_data bd LEFT JOIN ( SELECT MAX(created) tanggal, bike_id FROM service_history sh GROUP BY bike_id ) history ON history.bike_id = bd.id WHERE " +
        param_string +
        "=:" +
        param_string;
    }
    let [row] = await conn.execute(query, params);

    let data = [];
    for (let i = 0; i < row.length; i++) {
      let obj = {};
      let e = row[i];
      obj.id = e.id;
      obj.name = e.name;
      obj.bike_name = e.bike_name;
      obj.no_handphone = e.no_handphone;
      obj.qr_code = e.qr_code;
      obj.email = e.email;
      obj.url_image = e.url_image;
      obj.tanggal = e.tanggal;
      obj.frame = e.frame;
      obj.drivetrain = JSON.parse(e.drivetrain);
      obj.brake = e.brake;
      obj.cockpit = JSON.parse(e.cockpit);
      obj.wheelset = JSON.parse(e.wheelset);
      data.push(obj);
    }
    console.log(data);
    res.status(200).json({
      status: 200,
      message: "oke",
      data,
    });
    // console.log("customer/get ||", row[0]);
  } catch (error) {
    conn && conn.release();
    res.status(error.status || 500).json({ message: error.message } || error);
  } finally {
    conn && conn.release();
  }
});

module.exports = router