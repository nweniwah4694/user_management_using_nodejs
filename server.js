const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const { check, validationResult } = require('express-validator/check');
const port = process.env.PORT || 5000;
const mongo_uri = 'mongodb://127.0.0.1:27017';

// const mongo_uri = 'mongodb+srv://NweNiWah:262611zza$@cluster0-mmxpt.mongodb.net/test?retryWrites=true';

// const mongo_uri = 'mongodb+srv://thinzar:gOuVGubZslnIMSmu@cluster0-hok0q.mongodb.net/test?retryWrites=true';
var db
//create connecting mongoclient
MongoClient.connect(mongo_uri, { useNewUrlParser: true })
.then(client => {

  //create database
  db = client.db('user_db');

  //create user collection
  db.createCollection('users',{
    password: String,
    first_name:String,
    last_name:String,
    gender: String,
    email: String,
    phone: Number,
    isAdmin: Boolean,
    created_date: Date,
    updated_date: Date
  }, function(err, result) {
    console.log("Users Collection Created!");
  });

  //create tags collection
  db.createCollection("tags",{
    user_id: Number,
    tag_name:String,
    created_date: Date
  }, function(err, result) {
    console.log("Tags Collection Created!");
  });

  app.listen(port, () => console.info(`REST API running on port ${port}`));
}).catch(error => console.error(error));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(express.static('public'))

// login page view
app.get('/', (req, res) => {  

  res.render('login.ejs', {error: ""}); 
});

//login submit page
app.post('/login', (req, res) => {

  db.collection("users").find({ email: req.body.email , password: req.body.password}).toArray((err, result) => {

    if(result.length == 0) {

      res.render('login.ejs', {error: "User name and password are not match"}); 
    } else {

      res.redirect('/getUser?valid=' + req.body.email);
    }
  });
});

//create new user view
app.get('/createUser', (req, res) => {  

  res.render('create_user.ejs', { errors: [] }); 
});

//create new user 
app.post('/createUser', 
  [
    check('first_name').isAlpha().withMessage('First name must be only alphabetical characters.'),
    check('last_name').isAlpha().withMessage('Last name must be only alphabetical characters.'),
    check('password').isAlphanumeric().withMessage('Password must be only alphanumeric characters.'),
    check('email').isEmail().withMessage('Invalid email'),
    check('phone').isNumeric().withMessage('Phone number must be only numeric.')
  ], (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('create_user.ejs', { errors: errors.array() }); 
  }

  if(req.body.isAdmin != 'on') {
    req.body.isAdmin = 'off';
  }
  //add user
  var tags = req.body.tage_list.split(',');
  db.collection("users").insertOne(req.body, function(err, result) { 
    //add tags to user
    for(var i=0; i< tags.length; i++) {  

      db.collection("tags").insertOne({user_id: result.insertedId, tag_name: tags[i]}, function(err, result) {
      });
    }
    res.redirect('/userList');
  });
});

//get user 
app.get('/getUser', (req, res) => {

  db.collection("users").find({ email: req.query.valid }).toArray((err, result1) => {

    db.collection('users').aggregate([  
    { $match: {"_id": result1[0]._id}},
    { $lookup:
       {
         from: 'tags',
         localField: '_id',
         foreignField: 'user_id',
         as: 'details'
       }
     }
    ]).toArray(function(err, result) {

      var skillList = [];
      for(var i=0;i< result[0].details.length; i++) {
        skillList.push(result[0].details[i].tag_name);
      }
      res.render('update_user.ejs', {result: result[0], skillList: skillList, errors: [] });
    });
  }); 
});


app.post('/updateUser', 
  [
    check('first_name').isAlpha().withMessage('First name must be only alphabetical characters.'),
    check('last_name').isAlpha().withMessage('Last name must be only alphabetical characters.'),
    check('password').isAlphanumeric().withMessage('Password must be only alphanumeric characters.'),
    check('email').isEmail().withMessage('Invalid email'),
    check('phone').isNumeric().withMessage('Phone number must be only numeric.')
  ],(req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //get old data after validation
    db.collection("users").find({"_id": ObjectId(req.body.id) }).toArray((err, result1) => {

      db.collection('users').aggregate([  
      { $match: {"_id": result1[0]._id}},
      { $lookup:
         {
           from: 'tags',
           localField: '_id',
           foreignField: 'user_id',
           as: 'details'
         }
       }
      ]).toArray(function(err, result) {
        var skillList = [];
        for(var i=0;i< result[0].details.length; i++) {
          skillList.push(result[0].details[i].tag_name);
        }
        res.render('update_user.ejs', {result: result[0], skillList: skillList, errors: errors.array() });
      });
    }); 
  } else {
    //for isAdmin flag
    if(req.body.isAdmin != 'on') {
      req.body.isAdmin = 'off';
    }
    //update user information
    db.collection("users").updateOne( { _id: ObjectId(req.body.id) }, {

      $set: {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        password: req.body.password,
        email: req.body.email,
        phone: req.body.phone,
        gender: req.body.gender,
        isAdmin: req.body.isAdmin
      }},function(err, result) {

       console.log("document updated...");
    });

    //delete all tags of user 
    var myquery = { user_id: ObjectId(req.body.id) };
    db.collection("tags").deleteMany(myquery, function(err, obj) {

      console.log("document deleted..."+obj.result.n);
    });

    //add tags to user 
    var tags = req.body.tage_list.split(','); 
    for(var i=0; i< tags.length; i++) { 
      db.collection("tags").insertOne({user_id: ObjectId(req.body.id), tag_name: tags[i]}, function(err, result1) {
       
        console.log("tags created....."+tags[i]);
      });
    }
    res.redirect('/userList?valid=' + req.body.isAdmin);
  }
});

//get user list
app.get('/userList', (req, res) => {

  db.collection('users').find().toArray((err, result) => {

    res.render('user_list.ejs', {result: result, isAdmin: req.query.valid});
  });
});

//download user list
app.get('/download', (req, res) => {

  db.collection('users').find().toArray((err, result) => {

    var userList='';
    for(var i=0; i< result.length; i++) {
      userList += result[i].first_name;
      userList += result[i].last_name;
      userList += result[i].email;
      userList += result[i].phone;
      userList += result[i].gender;
      userList += "\n";
    }

    const doc = new PDFDocument();
    let filename = 'user_list'
    // Stripping special characters
    filename = encodeURIComponent(filename) + '.pdf'
    // Setting response to 'attachment' (download).
    // If you use 'inline' here it will automatically open the PDF
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"')
    res.setHeader('Content-type', 'application/pdf')
    const content = userList
    doc.y = 300
    doc.text(content, 50, 50)
    doc.pipe(res)
    doc.end()
  });  
});




