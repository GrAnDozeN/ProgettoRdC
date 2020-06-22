require('dotenv').config();
var express = require('express');
var app = express();
var request2server = require('request');
var bodyparser = require('body-parser');

app.get('/search', function(req, res){
    var quer = "";
    if (req.query.title)
        quer+= ("+intitle:" + req.query.title);
    if (req.query.author)
        quer+= ("+inauthor:" + req.query.author);

    request2server ({
        url:'https://www.googleapis.com/books/v1/volumes?q=' + quer + '&maxResults=40&key=' + process.env.KEY,
        method: 'GET',
    }, function(error, response, body){
        if(error) console.log(error);
        else {
            var jsonBody = JSON.parse(body);
            var imageLists = '';
            
            if (jsonBody.totalItems > 0) {
                console.log(jsonBody.totalItems);
                for (var i=0; (jsonBody.totalItems && i<40); i++) {
                    console.log(i);
                    var link = jsonBody.items[i].volumeInfo.infoLink;
                    var img = jsonBody.items[i].volumeInfo.imageLinks.thumbnail;
                    imageLists += '<a href="' + link + '"><img src="' + img + '"></a>';
                }
                //imageLists += '</ul>';
                //var link = jsonBody.items[0].volumeInfo.infoLink
                //res.redirect(link);
                console.log("Libri trovati");
                res.send(imageLists);
            }
            else {
                console.log("errore");
                res.redirect('http://localhost:5500/error.html');
            }
        }
    });
});

var server = app.listen(8888, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server in ascolto su http://%s:%s', host, port);
});