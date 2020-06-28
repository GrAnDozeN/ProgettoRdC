require('dotenv').config();

var request2server = require('request');
var express = require('express');
var router = express.Router();
var bodyparser = require('body-parser');

router.use(bodyparser.json());


var client_id = process.env.ID_APP_G; 			
var client_secret = process.env.CLIENT_SECRET_G; 	
var getEmail = "https://accounts.google.com/o/oauth2/auth?client_id="+client_id+"&scope=https://www.googleapis.com/auth/userinfo.email&redirect_uri=http://localhost:8888/code&response_type=code";


//  Callback (Get Token from Code)
router.get('/code', function (req, res) {

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
            var token = (JSON.parse(body)).access_token;
            console.log("\n");

            //  Richiesta per la email dell'utente appena loggato
            request2server.get({

                //informazioni che invio all’Authorization Server
                headers: 	headers,	    
                url:     	"https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + token,
        
                }, function(error, response, body) {
                    
                    email = (JSON.parse(body)).email;
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
        });
});

module.exports = router;