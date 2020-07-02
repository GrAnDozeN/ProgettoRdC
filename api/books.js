require('dotenv').config();

var express = require('express');
var request2server = require('request');
var express = require('express');
var router = express.Router();
var bodyparser = require('body-parser');

router.use(bodyparser.json());



//  Ricerca libro
router.get('/search', function(req, res){    
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
                        var link = jsonBody.items[i].volumeInfo.infoLink;
                        var img = jsonBody.items[i].volumeInfo.imageLinks.thumbnail;
                        imageLists += '<a href="' + link + '"><img style="height:200px; margin-right:30px; margin-bottom:30px; border:solid black 1px; border-radius:5px" src="' + img + '"></a>';
                    }
                }

                res.send(imageLists);

            } else {
                console.log("Libri non trovati");
                res.redirect('http://localhost:5500/error.html');
            }
        }
    });
});

module.exports = router;