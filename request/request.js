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

//  Var locali
var port = 8888;
var code = "";
var token = "";
var client_id = process.env.ID_APP_G; 			
var client_secret = process.env.CLIENT_SECRET_G; 	
var getEmail = "https://accounts.google.com/o/oauth2/auth?client_id="+client_id+"&scope=https://www.googleapis.com/auth/userinfo.email&redirect_uri=http://localhost:8888/code&response_type=code";
var user="";


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

/*app.use(session({ secret: "cats" }));
app.use(passport.initialize());
app.use(passport.session());*/

/*passport.use('local-token', new LocalStrategy(
    function(token, done) {
        AccessToken.findOne({
            id: token
        }, function(error, accessToken) {
            if (error) {
                console.log("errore all'authentication");
                return done(error);
            }
  
            if (accessToken) {
                console.log("entro in authentication...");
                if (!token.isValid(accessToken)) {
                    return done(null, false);
                }
  
                User.findOne({
                    id: accessToken.userId
                }, function(error, user) {
                    if (error) {
                        console.log("errore [2] all'authentication");
                        return done(error);
                    }
  
                    if (!user) {
                        return done(null, false);
                    }
                    console.log("errore [3] all'authentication");
                    
                    return done(null, user);
                });
            } else {
                console.log("Errore completo");
                return done(null);
            }
        });
    }
));*/


//  Parte di autenticazione
/*app.post('/passport/auth',
    passport.authenticate('local-token', {
        session: false,
        optional: false
    }),
    function(req, res) {
        console.log("authenticated!");
        res.redirect('homePage/homepage.html');
    }
);*/


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
            /*passport.authenticate('local-token', {
                tokenField: my_obj.access_token,
                session: false,
                optional: false,
                successRedirect: 'http://localhost:5500/homePage/homepage.html',
                failureRedirect: 'http://localhost:5500/loginPage/loginPage.html',
                failureFlash: true,
            }),*/
            
            //done(null, false, { message: 'Incorrect password.' });
            /*new LocalStrategy(function(token, done) {
                AccessToken.findOne({
                    id: my_obj.access_token
                }, function(error, accessToken) {
                    if (error) {
                        console.log("errore all'authentication");
                        return done(error);
                    }
            
                    if (accessToken) {
                        console.log("entro in authentication...");
                        if (!token.isValid(accessToken)) {
                            return done(null, false);
                        }
            
                        User.findOne({
                            id: accessToken.userId
                        }, function(error, user) {
                            if (error) {
                                console.log("errore [2] all'authentication");
                                return done(error);
                            }
            
                            if (!user) {
                                return done(null, false);
                            }
                            console.log("errore [3] all'authentication");
                            
                            return done(null, user);
                        });
                    } else {
                        console.log("Errore completo");
                        return done(null);
                    }
                });
            });*/



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
                    const queryy = "INSERT INTO users (email, password) SELECT * FROM (SELECT '" + email + "', 'null') AS Tmp WHERE NOT EXISTS (SELECT email FROM users WHERE email = '" + email + "') LIMIT 1;"
                    client.query(queryy, function(err, res) {

                        if (err) {
                            console.error("Inserimento fallito: " + err);
                            return;
                        } else 
                            console.error("Inserimento avvenuto con successo: " + email);
                        client.end();
                    });
                });
            //res.redirect("/passport/auth?token=" + token);
        });

});

var server = app.listen(port, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server in ascolto su http://%s:%s', host, port);
});

/*
//-----------------------------------------------------------------

var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(1337, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      // process WebSocket message
    }
  });

  connection.on('close', function(connection) {
    // close user connection
  });
});

//---------------------------------------------------------------

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

//HTTP server
 
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server,
    // not HTTP server
  });
  server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port "
        + webSocketsServerPort);
  });

  //WebSocket server
  var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket
    // request is just an enhanced HTTP request. For more info 
    // http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
  });
  // This callback function is called every time someone
  // tries to connect to the WebSocket server
  wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin '
        + request.origin + '.');
  });

  // accept connection - you should check 'request.origin' to
  // make sure that client is connecting from your website
  // (http://en.wikipedia.org/wiki/Same_origin_policy)
  var connection = request.accept(null, request.origin); 
  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;
  var userName = false;
  console.log((new Date()) + ' Connection accepted.');
*/

