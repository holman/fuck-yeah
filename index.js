http   = require('http')
https   = require('https')
fs     = require('fs')
url    = require('url')

req    = require('request')
server = require('node-router').getServer()
im     = require('imagemagick')

function fetch(query,cb){
  var google = 'http://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=8&q=' + query
  req({uri:google}, function (e, resp, body) {
    result = JSON.parse(body)['responseData']['results'][0];
    
    if(result)
      cb(result['unescapedUrl']);
    else
      cb("https://img.skitch.com/20110825-ewsegnrsen2ry6nakd7cw2ed1m.png");
  });
}

function download(match, output, addText){
  fetch(match, function(file){
    if(!match) {
      
    }
    var uri = url.parse(file)
    var host = uri.hostname
      , path = uri.pathname
    
    if(uri.protocol == "https:")
      var r = https;
    else 
      var r = http;
      
    request = r.get({host: host, path: path}, function(res){
      res.setEncoding('binary')
      var img = ''

      res.on('data', function(chunk) {
        img += chunk
      })

      res.on('end', function(){
        fs.writeFile(output, img, 'binary', function (err) {
          if (err) throw err
        })
        addText()
      })
    })
  })
}

server.get("/", function(request, response){
  response.simpleHtml(200, 'fuck yeah / by <a href="http://twitter.com/holman">@holman</a>.'+
    '<p>api: use <b>fuckyeah.herokuapp.com/[your-query]</b> and shit.</p>'
  );
})

server.get("/favicon.ico", function(request, response){
  return ""
})

server.get(new RegExp("^/(.*)$"), function(request, response, match) {
  var msg   = ""
    , match = escape(match)
    , chars = match.length

  if(chars < 7)
    msg = '"FUCK YEAH ' + match.toUpperCase() + '"'
  else
    msg = '"FUCK YEAH \n' + match.toUpperCase() + '"'

  var output = "/tmp/fuck-" + Math.floor(Math.random(10000000)*10000000) + '.jpg'
  download(match, output, function(){
    var args = [
      output,
      '-strokewidth', '2',
      '-stroke', 'black',
      '-fill', 'white',
      '-pointsize', '50',
      '-gravity', 'center',
      '-weight', '800',
      '-resize', '500x',
      '-draw', 'text 0,100 ' + unescape(msg),
      output
    ]

    im.convert(args, function(){
      fs.readFile(output, function (err, data) {
        if (err) throw err;
        response.writeHead(200, {'Content-Type': 'image/jpeg' })
        response.end(data)
      });
    })
  })
})

server.listen(process.env.PORT || 8080, '0.0.0.0')
