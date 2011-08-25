http   = require('http')
fs     = require('fs')
url    = require('url')

require('./mimetypes')
req    = require('./request')
server = require('./node-router').getServer()
im     = require('./imagemagick')

function fetch(query,cb){
  google = 'http://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=8&q=' + query
  req({uri:google}, function (e, resp, body) {
    result = JSON.parse(body)['responseData']['results'][0]['unescapedUrl']
    cb(result)
  })
}

function download(match, output, addText){
  fetch(match, function(file){
    host = url.parse(file).hostname
    path = url.parse(file).pathname

    request = http.get({host: host, path: path}, function(res){
      res.setEncoding('binary')
      img = ''

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
  response.simpleText(200, "Hello World!");
})

server.get("/favicon.ico", function(request, response){
  return ""
})

server.get(new RegExp("^/(.*)$"), function(request, response, match) {
  match = escape(match)
  chars = match.length

  if(chars < 7)
    msg = '"FUCK YEAH ' + match.toUpperCase() + '"'
  else
    msg = '"FUCK YEAH \n' + match.toUpperCase() + '"'

  output = "/tmp/fuck-" + Math.floor(Math.random(10000000)*10000000) + '.jpg'
  download(match, output, function(){
    args = [
      output,
      '-strokewidth', '2',
      '-stroke', 'black',
      '-fill', 'white',
      '-pointsize', '50',
      '-gravity', 'center',
      '-resize', '500x',
      '-draw', 'text 0,100 ' + unescape(msg),
      output
    ]
  
    im.convert(args, function(){
      img = fs.readFileSync(output)
      response.writeHead(200, {'Content-Type': 'image/jpeg' })
      response.end(img)
    })
  })
})

server.listen(8080, "localhost")
