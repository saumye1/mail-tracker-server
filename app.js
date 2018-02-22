var md5        = require('MD5');
var config     = require('config');
var app        = require('express')();
var bodyParser = require('body-parser');
var MongoClient = require('mongo');

app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

app.post('/signup', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email || !password || !emailRegex.test()) {
        return res.send('Insufficient information was provided.');
    }
    var passHash = md5(password);
    var accessToken = md5(email + passHash + new Date().getTime());
    db.collection(config.get("mongoCollections.users")).findOne({email : email}, function(err, user) {
        if (!err && !user) {
            db.collection(config.get("mongoCollections.users")).insert({
                email : email,
                password : passHash,
                date : new Date().getTime(),
                accessToken : accessToken
            }, function(err, result) {
                if (!err) {
                    return res.send(JSON.stringify({
                        message : "Signup successful",
                        status : 200,
                        data : '' + accessToken
                    }));
                }
                return res.send('Some error occured.');
            })
        } else if (user && user.email) {
            return res.send('User already exists!');
        } else {
            return res.send('Some error occured.');
        }
    })
})

app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email || !password || !emailRegex.test()) {
        return res.send('Insufficient information was provided.');
    }
    var passHash = md5(password);
    var accessToken = md5(email + passHash + new Date().getTime());
    
    db.collection(config.get("mongoCollections.users")).findOne({
        email : email,
        password : passHash,
    }, function(err, result) {
        if (!err && result) {
            db.collection(config.get("mongoCollections.users")).update({email : email, password : passHash}, {$set: {accessToken : accessToken} }, function(err, updateRes) {})
            return res.send(JSON.stringify({
                message : "Login successful",
                status : 200,
                data : '' + accessToken
            }));
        }
        return res.send('Some error occured.');
    })
})

app.get('/:mailToken', function(req, res) {
  var reqParams = req.params;
  var token = reqParams.mailToken;
  db.collection(config.get('mongoCollections.mails')).update({mailToken : token}, {$inc : {count : 1} }, function(err, result) {
    if (err) {
      console.error('Error occurred while updating data');
    } else {
      console.log('A mail read reciept was recieved');
    }
  })
  return res.send('');
})

app.post('/tokenizeMail', function(req, res) {
    var accessToken = req.body.accessToken;
    var subject = req.body.subject;
    var to = req.body.to;
    if (!accessToken || !subject || !to) {
        return res.send('Insufficient information was provided.');
    }
    db.collection(config.get("mongoCollections.users")).findOne({
        accessToken : accessToken
    }, function(err, user) {
        if (err || !user) {
            return res.send('Authentication error.');
        }

        //order of to mails shouldn't matter in tokenization
        //therefore always sort before tokenizing
        to = to.split(',').map(mail => { return mail.trim(); }).sort();
        to = to.join();
        var from = user.email;
        var mailToken = generateMailToken(to, from, subject);
        db.collection(config.get('mongoCollections.mails')).update({ mailToken : mailToken }, {
            mailToken : mailToken,
            email : from,
            date : new Date().getTime()
        }, { upsert : true }, function(err, updateRes) {
            if (err || !updateRes) {
                return res.send('Error occurred while updating data');
            }
            return res.send(JSON.stringify({
                message : "Successfully tokenized your mail",
                status : 200,
                data : config.get('apiLink') + mailToken
            }));
        })
    })
})

app.listen(config.get('PORT'));

function startInitialProcess() {
  MongoClient.connect(config.get('databaseSettings.database'), function(err, database) {
    db = ''
    if (!err) {
      console.log("Database initialized");
      db = database;
    } else {
      console.error("Error while connecting to database");
      throw err;
    }
  })
}

startInitialProcess();

function generateMailToken(to, from, subject) {
  return md5(from + to + subject).toString();
}