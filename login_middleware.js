var express = require('express');
var cons = require('consolidate');  // npm install consolidate
var bodyParser = require('body-parser');
var path = require('path');
var session = require('express-session'); // npm install express-session

var app=express();

// luodaan yhteys tietokantaan t60
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '',
  database: 'customer'
});

// Asennus npm install handlebars
app.engine('html', cons.handlebars);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

const http = require('http');

// Määritellään hostname ja portti
const hostname = '127.0.0.1';
const port = process.env.PORT || 3001;

//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}



// middlevare t58
var reqHTTP = function(req, res, next) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log("URL: " + fullUrl);
    next();
}

// middlevare t59
var ownHeader = function(req, res, next) {
    var date = new Date;
    var dd = date.getDate();
    var mm = date.getMonth();
    var yyyy = date.getFullYear();
    var today = dd + '.' + mm + '.' + yyyy;

    res.header('Calling-Time', 'You called my node on ' + today + ' at ' + date.toLocaleTimeString());

    next();
}


// Session käyttö
app.set('trust proxy', 1) // trust first proxy

app.use(session({
    secret: 'tosi_salainen_merkkijono ultra_secret', // 1. arvo -> käytetään kun hashataan data, muut arvot -> käytetään vertailuun onko data validia
    resave: false,
    saveUninitialized: true,
    name : 'JK_session_id'
  }))

app.use(allowCrossDomain);

//kirjoittaa lokiin jokaisen serverille tulevan HTTP-kutsun
app.use(reqHTTP);

//header, milloin kutsu tehtiin
app.use(ownHeader);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.post('/login', function(req, res){
    console.log('/login: data=' + JSON.stringify(req.body));
    let username = req.body.tunnus;
    let password = req.body.ss;

    //käyttäjän kirjautuminen, vaadittu että pääsee navigoimaan muille sivuille. kirjautumistieto tallentuu sessioon
    let sql = 'SELECT * FROM asiakas WHERE TUNNUS = ' + mysql.escape(username) + ' AND SALASANA = ' + mysql.escape(password);
    
    connection.query(sql, function (error, results, fields) {
        if ( error )
        {
            console.log("Error fetching data from db, reason: " + error);
            
        }
        
        else
        {
            if(results.length >0){
                req.session.username = username;
                req.session.aName = results[0].NIMI;
                res.redirect('/client');
            }
              else
              {
                res.redirect('/?message=Virheellinen käyttäjätunnus tai salasana');
              }
            
          }
    });
}),



// haetaan käyttäjän nimi client.htmlään
app.get('/client', function(req,res){
    res.render('client', {
        name: req.session.aName
    });
});

// uloskirjautumisen yhteydessä session tyhjennys ja uudelleenohjaus
app.get('/logout', function(req,res){
    req.session.destroy();
    res.redirect('/');
});

app.get('/', function(req,res){

    let msg = 'Tervetuloa sovellukseen X';

    if ( req.query.message )
        msg = req.query.message;

    res.render('login', {
        message: msg,
    });        

    // Tämäkin toimii, mutta tässä koodissa login.html-sivulle EI voi viedä mitään dataa
    //res.sendFile(path.join(__dirname + '/login.html'));

    //res.sendFile(path.join(__dirname + '/views/index.html'));

});


// kaikki muut polut mitä ei ole olemassa ohjautuvat pagenotfoundiin
app.all('*', function(req,res){
    res.sendfile(path.join(__dirname + '/views/pagenotfound.html'))
});

app.listen(port, hostname, () => {
  console.log(`Server running AT http://${hostname}:${port}/`);
});
