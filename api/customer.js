
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
var bcrypt = require("bcryptjs");
const db = require("../databases");
const jwt = require("jsonwebtoken");
const auth = require("./authentication");
const multer = require("multer");
const AWS = require("aws-sdk");


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


const Storage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, "");
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Wrong File Type"), false);
  }
};

const upload = multer({
  storage: Storage,
  limits: {
    fileSize: 1024 * 1024 * 1,
  },
  fileFilter: fileFilter,
}).single("bikeImage");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});

const checkImage = async (req, res, next) => {
  try {
    const checkImage = await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          reject({ status: 400, message: "Wrong image Type Or Size" });
        } else if (err) {
          reject({ status: 400, message: "Wrong image Type Or Size" });
          // An unknown error occurred when uploading.
        }
        resolve({
          message: "ok",
        });
      });
    });
    if (checkImage.message !== "ok") {
      throw checkImage;
    } else {
      next();
    }
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message } || error);
  }
};


router.post("/add", auth, checkImage, async (req, res) => {
  let name = req.body.name || null,
    email = req.body.email || null,
    no_handphone = req.body.no_handphone || null,
    bike_name = req.body.bike_name || null,
    frame = req.body.frame || null,
    drivetrain = req.body.drivetrain || null,
    cockpit = req.body.cockpit || null,
    brake = req.body.brake || null,
    wheelset = req.body.wheelset || null;

  let id = uuidv4();
  if (req.body.id) id = req.body.id;

  try {
    if (
      !name ||
      !email ||
      !no_handphone ||
      !bike_name ||
      !drivetrain ||
      !frame ||
      !cockpit ||
      !brake ||
      !wheelset
    ) {
      throw {
        status: 400,
        message: "data tidak lengkap",
        data:{ name  ,email  ,no_handphone ,bike_name ,frame  ,drivetrain ,cockpit ,brake  ,wheelset}
      };
    }

    var conn = await db.getConnection();
    //check email
    let qr_code = "";
    let [
      count,
    ] = await conn.execute(
      "SELECT count(id) total FROM bike_data WHERE no_handphone=? ",
      [no_handphone]
    );

    if (count[0].total > 0) {
      qr_code = `${no_handphone}_${count[0].total + 1}`;
    } else {
      qr_code = no_handphone + "_" + "1";
    }
    if (req.file) {
      const newFile = req.file.originalname.split(".");
      const fileType = newFile[newFile.length - 1];
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuidv4()}.${fileType}`,
        Body: req.file.buffer,
        ContentType: "image/" + fileType,
        ACL: "public-read",
      };
      var urlImg = "";
      var Upload = await new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
          if (err) {
            reject({ error: err, message: "error" });
          } else {
            resolve({ message: "ok", data });
          }
        });
      });


      if (Upload.message == "ok") {
        let insert = await conn.execute(
          "INSERT INTO bike_data (id,name,bike_name,no_handphone,qr_code,email,url_image,frame,drivetrain,cockpit,brake,wheelset) VALUES (:id,:name,:bike_name,:no_handphone,:qr_code,:email,:url_image,:frame,:drivetrain,:cockpit,:brake,:wheelset)",
          {
            id,
            name,
            bike_name,
            no_handphone,
            qr_code,
            email,
            url_image: Upload.data.Location,
            frame,
            drivetrain: drivetrain,
            cockpit: cockpit,
            brake,
            wheelset: wheelset,
          }
        );
      } else {
        throw Upload.error;
      }
    } else {
      /*
      let insert = await conn.execute(
        "INSERT INTO bike_data (id,name,bike_name,no_handphone,qr_code,email,url_image,frame,drivetrain,cockpit,brake,wheelset) VALUES (:id,:name,:bike_name,:no_handphone,:qr_code,:email,:url_image,:frame,:drivetrain,:cockpit,:brake,:wheelset)",
        {
          id,
          name,
          bike_name,
          no_handphone,
          qr_code,
          email,
          url_image: "",
          frame,
          drivetrain: drivetrain,
          cockpit: cockpit,
          brake,
          wheelset: wheelset,
        }
      );
      */
    }
    conn.release();
    res.status(201).json({
      message: "new bike added",
      data: {
        name,
        email,
        no_handphone,
        bike_name,
        url_image: req.file ? Upload.data.Location : "",
      },
    });
  } catch (error) {
    console.log(error);
    conn && conn.release();
    res.status(error.status || 500).json({ message: error.message, data: error.data || null } || error);
  }
});

module.exports = router