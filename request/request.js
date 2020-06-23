require('dotenv').config();

var express = require('express');
var app = express();
var request2server = require('request');
var bodyparser = require('body-parser');

//  Var locali
var port = 8888;
var code = "";
var token = "";
var client_id = process.env.ID_APP_G; 			// fill-in
var client_secret = process.env.CLIENT_SECRET_G; 	// fill-in
var getEmail = "https://accounts.google.com/o/oauth2/auth?client_id="+client_id+"&scope=https://www.googleapis.com/auth/userinfo.email&redirect_uri=http://localhost:8888/code&response_type=code";
var user="";

//  Ricerca libro
app.get('/search', function(req, res){
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

//  Authentication

//app.get('/', function(req, res){
//
//	var info = "gesù cristo"
//    res.send(info+"<br><br><button onclick='window.location.href=\""+ getEmail +"\"'>Log in with Picasa</button>");
//
//});

//  Callback (Get Token from Code)
app.get('/code', function (req, res) {

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
			res.redirect('http://localhost:5500/request/request.html');
			my_obj=JSON.parse(body);
			token = my_obj.access_token;
            console.log("The token is: "+token);
            
            //  Richiesta per la email dell'utente appena loggato
            request2server.get({
                headers: 	headers,	    //informazioni che invio all’Authorization Server
                url:     	"https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + token,
        
                }, function(error, response, body){
                    //console.log(body);		
                    
                    my_obj=JSON.parse(body);
                    user = my_obj.email;
                    console.log("Email utente loggato: " + user);
                });
        });
});

var server = app.listen(8888, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server in ascolto su http://%s:%s', host, port);
});