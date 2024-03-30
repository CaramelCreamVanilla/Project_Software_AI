const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const Jimp = require('jimp');
const pool = require('./db.js')

require('dotenv').config()

const app = express();
const port = process.env.ENV_PORT;

//Routes
const authRouter = require('./routes/authRoutes.js');
const questionRouter = require('./routes/questionRoutes.js');
const patientRouter = require('./routes/patientRoutes.js');

// Use the cors middleware
app.use(cors());

// Parse JSON in the request body
app.use(express.json());


//Use Routes
app.use('/auth', authRouter)
app.use('/question', questionRouter)
app.use('/patient', patientRouter)

//For Upload img
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

app.post('/uploadimg', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  Jimp.read(req.file.buffer)
    .then(image => {
      // Convert the image to PNG
      return image.writeAsync(path.join(__dirname, 'UserProfile/acc_profile/', req.body.userID + '.png'));
    })
    .then(() => {
      res.status(200).send('Image uploaded and converted to PNG.');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error processing image.');
    });
});
//For Upload img

//For fetch image
app.use('/UserProfile/acc_profile', express.static(path.join(__dirname, 'UserProfile/acc_profile')));

//create ch_id
const update_chID = async () => {
  const lastID = await pool.promise().query('SELECT ch_id FROM `self_check-in` ORDER BY ch_id DESC LIMIT 1')
  const lastIDResult = lastID[0][0].ch_id;
  const numericPart = parseInt(lastIDResult.substring(2), 10);
  const currentnumericPart = numericPart + 1;
  const currentID = `ch${currentnumericPart}`;
  // console.log(currentID)
  return currentID;
}

//get date
function getFormattedDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(6, '0');

  // รวมวันที่และเวลาในรูปแบบที่กำหนด
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

//kiosk
app.get('/getAcc', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT a.account_id, p.p_id FROM account a JOIN information_patient p ON a.account_id = p.account_id; ');
    console.log(rows)
    if (rows.length === 0) {
      res.status(404).json({ error: 'user not found' });
    } else {
      res.json({ result: rows });
    }
  } catch (error) {
    console.error(error.stack);
    return res.status(500).send(error.message);
  }
})

app.post('/mapSelfCheckin', async (req, res) => {
    try {
      const data = req.body;
      const lastID = await update_chID()
      const realtimeDate = getFormattedDateTime()
      // console.log(realtimeDate)
      await pool.promise().query('INSERT INTO `self_check-in` (ch_id,account_id,pressure,weight_check_in,height_check_in,kiosk_speech,date) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [lastID, parseInt(data.account_id), JSON.stringify(data.pressureData),parseFloat(data.weight),parseFloat(data.height),JSON.stringify(data.answers), realtimeDate]);
      return res.status(201).json({ success: true, message: 'Self check-in recorded successfully' });      
    } catch (error) {
      {
        return res.status(500).send(error.message);
      }
    }
  }
)


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});