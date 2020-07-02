require('dotenv').config();

var express = require('express');
var session = require('express-session');
var app = express();
var request2server = require('request');
var bodyparser = require('body-parser');
const { Client } = require('pg');
var passport = require("passport");
var LocalStrategy = require('passport-local-token').Strategy;

/*var books = require("./books");
var auth = require("./authentication");

app.use("/books", books);
app.use("/auth", auth);
*/


app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

//  Var locali
var port = 8888;
var code = "";
var token = "";
var client_id = process.env.ID_APP_G; 			
var client_secret = process.env.CLIENT_SECRET_G; 	
var getEmail = "https://accounts.google.com/o/oauth2/auth?client_id="+client_id+"&scope=https://www.googleapis.com/auth/userinfo.email&redirect_uri=http://localhost:8888/&response_type=code";
var user="";


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

//  Accesso alla pagina di ricerca - verifica se utente loggato
app.get("/searchPage", function(req,res){
    console.log("Richiesta pagina di ricerca");
    if(!req.session.loggedin){
        console.log("Richiesta NEGATA");
        res.redirect("http://localhost:5500/loginPage/login.html");
        return;
    } else {
        console.log("Richiesta ACCONSENTITA");
        res.redirect("http://localhost:5500/request/request.html")
    }
    console.log();
});

//  Ricerca libro
app.get('/search', function(req, res){
    if(!req.session.loggedin){
        res.redirect("http://localhost:5500/loginPage/login.html");
        return;
    }
    
    var quer = "";
    if (req.query.title)
        quer+= ("+intitle:" + req.query.title);
    if (req.query.author)
        quer+= ("+inauthor:" + req.query.author);

    console.log("Ricercando Libri per: " + quer);

    //  Richiesta alla API: Google Books
    request2server ({
        url:'https://www.googleapis.com/books/v1/volumes?q=' + quer + '&maxResults=40&printType=books&key=' + process.env.BOOK_KEY,
        method: 'GET',
    }, function(error, response, body){
        if(error) console.log(error);
        else {

            var jsonBody = JSON.parse(body);
            var imageLists = '';
            
            if (jsonBody.totalItems > 0) {
                console.log("Libri trovati: " + jsonBody.totalItems);
                if(jsonBody.totalItems < 40)
                    var l = jsonBody.totalItems;
                else 
                    var l = 40;

                for (var i=0; i < l; i++) {
                    if (jsonBody.items[i].volumeInfo.hasOwnProperty("imageLinks")) {
                        console.log("img %s trovata", i);
                        var link = jsonBody.items[i].volumeInfo.infoLink;
                        var img = jsonBody.items[i].volumeInfo.imageLinks.thumbnail;
                        imageLists += '<a href="' + link + '"><img style="height:200px; margin-right:30px; margin-bottom:30px; border:solid black 1px; border-radius:5px" src="' + img + '"></a>';
                    } else 
                        console.log ("img %s non trovata", i);
                }

                res.send(imageLists);

            } else {
                console.log("Libri non trovati");
                res.redirect('http://localhost:5500/error.html');
            }
        }
    });
});



//  Callback (Get Token from Code)
app.get('/code', function (req, res) {

    //  Sessione

    //  Var iniziali
    code = req.query.code;
    var url = 'https://www.googleapis.com/oauth2/v3/token';
	var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
	var body = "code="+code+"&client_id="+client_id+"&client_secret="+client_secret+"&redirect_uri=http%3A%2F%2Flocalhost%3A8888%2Fcode&grant_type=authorization_code";
    
    //  Chiamata a API: Google OAuth 2 (per l'autenticazione)
    request2server.post({

        //informazioni che invio all’Authorization Server
		headers: headers,
		url: url,		    
		body: body		    

		}, function(error, response, body){
            
            //  Pagina dopo aver ottenuto il token
            //res.redirect('http://localhost:5500/request/request.html');
			my_obj=JSON.parse(body);
            token = my_obj.access_token;
            console.log("\n");

            //  Richiesta per la email dell'utente appena loggato
            request2server.get({

                //informazioni che invio all’Authorization Server
                headers: 	headers,	    
                url:     	"https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + token,
        
                }, function(error, response, body) {
                    
                    my_obj=JSON.parse(body);
                    email = my_obj.email;
                    console.log("Email utente loggato: " + email);

                    req.session.loggedin = true;
                    req.session.email = email;
                    console.log("Session: log_" + req.session.loggedin + " <> user_"+ req.session.email);
                    res.redirect('http://localhost:5500/request/request.html');

                    const client = new Client({
                        user: 'postgres',
                        host: process.env.HOST,
                        database: process.env.DATABASE,
                        password: process.env.PASSWORD,
                        port: process.env.PORT,
                    });
                    
                    //  Connessione a database Postgres
                    client.connect(function(err){
                        if (err) {
                          console.error('Connessione non stabilita - error: ', err.stack)
                        } else {
                          console.log('Connessione al DB stabilita')
                        }
                    });
                    
                    //  Inserimento email nel database
                    const query2 = "INSERT INTO users (email, password) SELECT * FROM (SELECT '" + email + "', 'null') AS Tmp WHERE NOT EXISTS (SELECT email FROM users WHERE email = '" + email + "') LIMIT 1;"
                    client.query(query2, function(err, res) {

                        if (err) {
                            console.error("Inserimento fallito: " + err);
                            return;
                        } else 
                            console.error("Inserimento avvenuto con successo: " + email);
                        client.end();
                    });
                });
        });
});


// Manual registration
app.post("/register", function(req, result){
    console.log("Registrazione manuale");
    var isRegister = false;
    const client = new Client({
        user: 'postgres',
        host: process.env.HOST,
        database: process.env.DATABASE,
        password: process.env.PASSWORD,
        port: process.env.PORT,
    });

    client.connect(function(err){
        if (err) {
            console.log('Connessione non stabilita - error: ', err.stack);
            return;
        } else {
          console.log('Connessione al DB stabilita');
        }
    });

    const query3 = "SELECT * FROM users WHERE email='" + req.body.inputEmail + "'"
    client.query(query3, function(err, res){
        if (err) {  //  Errore durante la query
            console.log("Inserimento [1] fallito: " + err);
            result.redirect("http://localhost:5500/error_general.html");
            client.end();
            return;
        } else if (res.rowCount > 0){   //  Utente già registrato
            console.log("Utente già registrato");
            result.redirect("http://localhost:5500/error_register.html");
            client.end();
            return;
        } else {    //  Utente ancora non presente nel database
            const query4 = "INSERT INTO users VALUES ('" + req.body.inputEmail + "','" + req.body.inputPassword + "')";
            client.query(query4, function(err, res){
                if (err) {  //  Errore durante la query
                    console.log("Inserimento [2] fallito: " + err);
                    result.redirect("http://localhost:5500/error_general.html");
                    return;
                } else {    //  Inserimento avvenuto con successo
                    console.log("Inserimento avvenuto con successo: " + req.body.inputEmail);

                    req.session.loggedin = true;
                    req.session.email = req.body.inputEmail;
                    console.log("Session: log_" + req.session.loggedin + " <> user_"+ req.session.email);
                    result.redirect('http://localhost:5500/request/request.html');

                    return;
                }
                client.end();
            });
        }
    });

    console.log("email: " + req.body.inputEmail);
    console.log("password: " + req.body.inputPassword);
});


// Manual Login
app.post("/login", function(req, result){

    console.log("Login manuale");
    var isRegister = false;
    const client = new Client({
        user: 'postgres',
        host: process.env.HOST,
        database: process.env.DATABASE,
        password: process.env.PASSWORD,
        port: process.env.PORT,
    });

    client.connect(function(err){
        if (err) {
            console.log('Connessione non stabilita - error: ', err.stack);
            return;
        } else {
          console.log('Connessione al DB stabilita');
        }
    });


    const query3 = "SELECT * FROM users WHERE email='" + req.body.inputEmail + "' and password='" + req.body.inputPassword + "'";
    client.query(query3, function(err, res){
        if (err) {
            console.log("Ricerca in DB fallita: " + err);
            result.redirect("http://localhost:5500/error_general.html");
            client.end();
            return;
        } else if (res.rowCount > 0){
            console.log("Utente trovato");
            req.session.loggedin = true;
            req.session.email = req.body.inputEmail;
            console.log("Session: log_" + req.session.loggedin + " <> user_"+ req.session.email);
            result.redirect('http://localhost:5500/request/request.html');

            client.end();
            return;
        } else {
            console.log("Utente non trovato");
            result.redirect("http://localhost:5500/error_login.html");
        }
    });
});

var server = app.listen(port, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server in ascolto su http://%s:%s', host, port);
});

