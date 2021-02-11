const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = mongoose

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))

const userSchema = new Schema({
  username: {type: String, required: true},
  date: String,
  duration: Number,
  description: String,
  log: [],
  count: {type: Number, default: 0}
}, {versionKey: false})

const User = mongoose.model('User', userSchema)


let responseObject = {}
app.post('/api/exercise/new-user', (req, res) => {
  let uname = req.body.username
  let newUser = User({
    username: uname
  })
  newUser.save((err, user) => {
    if(!err) {
      responseObject['username'] = user.username
      responseObject['_id'] = user._id
      res.send(responseObject)
    }
  })
})

app.get('/api/exercise/users', (req, res) => {
  User.find({})
  .select({username: 1, _id: 1})
  .exec((err, data) => {
    if(!err) {
      res.send(data)
    }
  })
})

app.post('/api/exercise/add', (req, res) => {
  let uid = req.body.userId
  let desc = req.body.description
  let dur = req.body.duration
  let dat = req.body.date
  if(dat == "") {
    dat = new Date()
  } else {
    dat = new Date(req.body.date)
  }
  
  User.findOne({_id: uid}, (err, user) => {
    if(!err){
      user.description = desc
      user.duration = dur
      user.date = dat.toDateString()
      user.log.push(
        {description: user.description,
        duration: user.duration,
        date: user.date})
      user.count += 1
      user.save((err, uU) => {
        if(!err) {
          res.send({_id: uU._id, username: uU.username, date: uU.date, description: uU.description, duration: uU.duration})
        }
      })
    }
  })
})

app.get('/api/exercise/log', (req, res) => {
  let uid = req.query.userId
  let fr = req.query.from
  let to = req.query.to
  let lmt = req.query.limit
  User.findOne({_id: uid}, (err, user) => {
    if(!err) {
      let arr = user.log
      if(fr !== undefined) {
        for(let i = 0; i < arr.length; i++) {
          if(arr[i].date < fr) {
            arr.splice(i,1)
          }
        }
      } else if(to !== undefined) {
        for(let i = 0; i < arr.length; i++) {
          if(arr[i].date > to) {
            arr.splice(i,1)
          }
        }
      } else if(lmt !== undefined) {
        for(let i = 0; i < arr.length; i++) {
          if(i > lmt - 1) {
            arr.splice(i,1)
          }
        }
      }
      user.log = arr
      user.save((err, uU) => {
        if(!err) {
          res.send(uU)
        }
      })
    }
  })
})