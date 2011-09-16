express = require("express")
formidable = require("formidable")
exec = require("child_process").exec
spawn = require("child_process").spawn
url = require("url")
fs = require("fs")
requestHandlers = require("./requestHandlers")
sys = require("sys")
db = require("redis").createClient()
zip = require("zip")
easyoauth = require("easy-oauth")
app = module.exports = express.createServer()
_twitterConsumerKey = ""
_twitterConsumerSecret = ""
app.configure ->
  app.set "views", __dirname + "/views"
  app.set "view engine", "jade"
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use express.cookieParser()
  app.use express.session(secret: "eventuallycloseduringnative")
  app.use require("stylus").middleware(src: __dirname + "/public")
  app.use easyoauth(require("./keys_file"))
  app.use app.router
  app.use express.static(__dirname + "/public")

app.configure "development", ->

app.configure "production", ->
  app.use express.errorHandler()

app.error (err, req, res, next) ->
  sys.puts "APP.ERROR:" + sys.inspect(err)
  next err

db.on_ "error", (err) ->
  console.log "Redis Error " + err


case1 =
  title: "case1"
  caseid: "1"
  page: "1"
  radios: [
    img: "1313337540668"
    caption: "EDH 1"
   ]
  texts: [ "---" ]
  users: [ "lijf" ]

app.get "/ziptest", (req, res) ->
  zipfile = fs.readFileSync(__dirname + "/SD.zip")
  reader = zip.Reader(zipfile)
  console.log reader.readLocalFileHeader()
  console.log reader.readDataDescriptor()
  i = 0
  reader.forEach (entry) ->
    matchimage = /\.(jpg|jpeg|png|gif)$/i
    console.log entry.getName()  if matchimage.test(entry.getName())
    console.log i++

app.get "/test", (req, res) ->
  res.send "<html><body><p>Test</body></html>"

app.get "/case/:id/:page", (req, res) ->
  console.log "GET case/" + req.params.id + "/" + req.params.page
  findCase = "case:" + req.params.id + ":page:" + req.params.page
  db.mget findCase, "markdown-help", (err, data) ->
    unless data[0]
      res.send "huh?", 404
    else
      theCase = JSON.parse(data[0].toString())
      mdhelp = JSON.parse(data[1].toString())
      res.render "case",
        title: theCase.title
        styles: [ "style.css" ]
        scripts: [ "jquery.mousewheel.min.js", "spin.js", "showdown.js", "client.js" ]
        radios: theCase.radios
        texts: theCase.texts
        users: theCase.users
        mdhelp: mdhelp

app.get "/signed_in", (req, res) ->
  uid = req.getAuthDetails().user.user_id
  userdata = JSON.stringify(req.getAuthDetails())
  db.set "user:" + uid, userdata, (err, data) ->
    db.sismember "users", uid, (err, data) ->
      unless data
        db.sadd "users", uid
        res.send "new user", 200

app.get "/case/:id/:page/edit", (req, res) ->
  console.dir req.isAuthenticated()
  console.dir req.getAuthDetails().user.user_id
  console.dir req.getAuthDetails()
  if req.isAuthenticated()
    db.get "case:" + req.params.id + ":page:" + req.params.page, (err, data) ->
      unless data[0]
        res.send "huh?", 404
      else if JSON.parse(data.toString()).users == req.getAuthDetails().user.username
        console.dir "user allowed"
        res.render "edit",
          title: "edit"
          styles: [ "style.css" ]
          scripts: [ "jquery.mousewheel.min.js", "spin.js", "showdown.js", "client.js" ]
          caseid: req.params.id
          page: req.params.page
      else
        res.send "You are not allowed to edit this page but you can ask the author to add you as an editor", 200
  else
    res.send "Please log in to edit pages", 200

app.put "/case/:id/:page", (req, res) ->
  console.log "PUT /case was called"
  data = req.body
  db.set "case:" + req.params.id + ":page:" + req.params.page, JSON.stringify(data)

app.get "/sign_out", (req, res, params) ->
  req.logout()
  res.send "<button id=\"twitbutt\">Sign in with twitter</button>"

app.get "/image/:id", (req, res) ->
  image = __dirname + "/img/" + req.params.id + ".jpg"
  fs.readFile image, "binary", (error, file) ->
    if error
      res.send "huh?", 404
    else
      res.statusCode = 200
      res.setHeader "Content-Type", "image/jpeg"
      res.write file, "binary"
      res.end()

app.post "/image/", (req, res) ->
  console.log "POST /image/ called"
  if req.isAuthenticated()
    requestHandlers.postImage2 req, res, db
  else
    res.send "not logged in", 200

port = process.env.PORT or 3000
app.listen port, ->
  console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env