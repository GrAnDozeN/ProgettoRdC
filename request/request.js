require('dotenv').config();
var express = require('express');
var app = express();
var request2server = require('request');
var bodyparser = require('body-parser');

app.get('/search', function(req, res){
    request2server ({
        url:'https://www.googleapis.com/books/v1/volumes?q=' + (req.query.title) + '&key=' + process.env.KEY,
        method: 'GET',
    }, function(error, response, body){
        if(error) console.log(error);
        else {
            var jsonBody = JSON.parse(body);
            var link = jsonBody.items[0].volumeInfo.infoLink;
            //res.send(jsonBody.kind);
            res.redirect(link);


            //var kind = JSON.parse(body).kind;
            //res.send(kind);

            console.log(response.statusCode, jsonBody.items.volumeInfo.infoLink);
            //console.log(response.statusCode, jsonBody["items"]["0"]["volumeInfo"]["infoLink"]);
            
        }
    });
});

var server = app.listen(8888, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server in ascolto su http://%s:%s', host, port);
});