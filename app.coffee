username = (req, res) ->
  (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
String.prototype.toProperCase = ->
  this.replace /\w\S*/g, (txt) ->
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()

express = require("express")
#Cookies = require("cookies")
http = require("http")
https = require("https")
#app = require("connect")
app = express()
#io = require("socket.io").listen(app)
silent = 'test' == process.env.NODE_ENV
#formidable = require("formidable")
multiparty = require("multiparty")
exec = require("child_process").exec
execFile = require("child_process").execFile
spawn = require("child_process").spawn
url = require("url")
fs = require("fs")
requestHandlers = require("./requestHandlers")
favicon = require("static-favicon")
sys = require("sys")
util = require("util")
redis = require("redis")
session = require("express-session")
#db = redis.createClient(process.env.DB_PORT)
db = redis.createClient(6379)
icd = redis.createClient(4444)
util = require("util")
#easyoauth = require("easy-oauth")
#everyauth = require("everyauth")
passport = require("passport")
toobusy = require("toobusy")
app.set "views", __dirname + "/views"
app.engine "jade", require("jade").__express
app.set "view engine", "jade"

#app.set "view options",
#  layout: false
app.use require("body-parser")()
app.use require("method-override")()
#app.use express.json() # these two substitute bodyParser
#app.use express.urlencoded() # minus the multipart
#app.use express.bodyParser()
app.enable("verbose errors")
if "production" == app.settings.env
  app.disable("verbose errors")
#silent or app.use(express.logger('dev'))
app.use require("cookie-parser")()
#app.use express.session(secret: process.env.SSECRET)
app.use session({secret: 'ssecret', key: 'dog', cookie: {secure: true}})
app.use require("stylus").middleware(src: __dirname + "/public/")
app.use require("connect-assets")()
#app.use easyoauth(require("./keys_file"))
#app.use app.router
#app.use error
app.use favicon(__dirname + "/public/favicon.ico")
app.use express.static(__dirname + "/public")

app.use (req,res, next) ->
  if toobusy()
    res.send 503, "I'm busy right now, sorry."
  else next()

#app.use (req,res,next) ->
#  res.status(404)
#  if req.accepts("html")
#    res.render "404",
#      url: req.url
#
#    return
#  if req.accepts("json")
#    res.send error: "Not found"
#    return
#  res.type("txt").send "Not found"

app.use (err, req, res, next) ->
  res.status err.status or 500
  res.render "500",
    error: err

db.on "error", (err) ->
  console.log "Redis Error " + err

app.get "/", (req, res) ->
  #if req.isAuthenticated() then res.redirect "/cases/0/-1"
  console.log "root"
  requestHandlers.renderNewRoot req, res

app.get "/newindex2", (req, res) ->
  requestHandlers.renderNewRoot2 req,res

app.get "/newindex", (req, res) ->
  requestHandlers.renderNewRoot req, res

app.get "/signed_in", (req, res) ->
  userdata = req.getAuthDetails()
  console.log userdata
  db.sismember "users", userdata.user.user_id (err, registered) ->
    if registered
      db.set "user:" + userdata.user.user_id, JSON.stringify userdata
      db.set "user:" + userdata.user.username, userdata.user.user_id
      res.send "OK", 200
    else
      db.sadd "users", userdata.user.user_id
      db.set "user:" + userdata.user.user_id, JSON.stringify userdata
      db.set "user:" + userdata.user.username, userdata.user.user_id
      res.send "OK, new user", 200

app.get "/sign_out", (req, res) ->
  req.logout()
  res.send "OK", 200

app.get "/stat/:pagename", (req, res) -> # this may be to much of a 'catch all'
  res.render req.params.pagename,
    title: req.params.pagename
    signed_in: req.isAuthenticated()
    user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
    icds: ""
    creator: ""
    created: ""

app.post "/newcase", (req, res) ->
  db.sismember "userCanAdd", req.getAuthDetails().user.user_id, (err, canAdd) ->
    return res.send "FORBIDDEN", 403 unless canAdd
    if canAdd
      data = req.body
      data.creator = req.getAuthDetails().user.username
#      data.texts = JSON.stringfy '[""]'
      data.modalities = "[]"
      data.created = new Date().getTime()
      data.listed = "true"
      data.nextpage = "0"
      data.prevpage = "0"
      db.incr "numberOfCases", (err, cid) ->
        casepage = "case:" + cid + ":page:1"
        db.hset "case:" + cid, "hidden", "false"
        db.hset "case:" + cid, "title", data.title
        db.hset "case:" + cid, "creator", data.creator
        db.hset casepage, "cid", cid
        db.hset casepage, "pagetype", data.pagetype
        db.hset casepage, "creator", data.creator
        db.hset casepage, "created", data.created
        db.hset casepage, "lastEdit", data.created
        db.hset casepage, "listed", data.listed
        db.hset casepage, "nextpage", data.nextpage
        db.hset casepage, "prevpage", data.prevpage
        db.incr "case:" + cid + ":pages"
        db.zadd "casesLastEdit", data.created, cid
        db.zadd "listed", data.created, cid
        db.zadd "cases:" + data.creator, data.created, cid
        db.set "case:" + cid + ":firstpage", "1"
        db.sadd "case:" + cid + ":users", req.getAuthDetails().user.user_id
        res.send "/case/" + cid + "/1", 200
#        console.dir data
#        db.hmset "case:" + cid + ":page:1", data, (err, data) ->
#          db.sadd "case:" + cid + ":users", req.getAuthDetails().user.user_id, (err, data) ->
#            #console.log "created case: " + cid
#            res.send "/case/" + cid + "/1", 200

  

app.post "/icd", (req, res) ->
  body = req.body.qs
  body = '*' + body + '*'
  icd.keys body, (err, codes) ->
    unless err
      #console.dir codes
      codes = JSON.stringify codes, null, '\t'
      if codes.length < 10000
        res.send codes, 200
      else
        res.send 444

app.get "/cases/:start/:finish", (req, res) ->
  start = parseInt(req.params.start, 10)
  end = parseInt(req.params.finish, 10)
  requestHandlers.rendercases req, res, start, end

app.get "/case/:id/:page", (req, res) ->
  if req.isAuthenticated()
    userid = req.getAuthDetails().user.user_id
  else
    userid = '0'
  #console.log userid
  db.sismember "case:" + req.params.id + ":users", userid, (err, editor) ->
    #db.get "case:" + req.params.id + ":page:" + req.params.page + ":stringified", (error, theCase_stringified) ->
    #  unless !theCase_stringified
    #    theCase = JSON.parse theCase_stringified
    #    requestHandlers.rendercase req, res, theCase, editor
    #  if !theCase_stringified or error
    db.hgetall "case:" + req.params.id + ":page:" + req.params.page, (error, theCase) ->
      if error or !theCase
        return res.redirect "back"
      requestHandlers.rendercase req, res, theCase, editor

app.get "/case/:id/:page/feedback", (req, res) ->
  db.lrange "case:" + req.params.id + ":page:" + req.params.page + ":feedback", 0, -1, (err, feedback) ->
    feedbacktext = ""
    pagefeedback = []
    feedback.forEach (fb, fbID) ->
      fbi = JSON.parse fb
      feedbacktext += "<p><a href=https://twitter.com/intent/user?screen_name='" + fbi.user + "' title='Link to twitter' target='_blank'>@" + fbi.user + "</a> - " + fbi.feedback + "<br><span id='timestamp'>" + fbi.time
    res.send 200, feedbacktext

app.post "/completed/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  #send a 403? (denied) unless user is in list of users permitted to create cases.
  #db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
  #  if editor
  #    requestHandlers.postNewpage req, res
  db.sadd "completed:" + req.getAuthDetails().user.user_id, req.params.id
  db.sadd "case:" + req.params.id + ":completed", req.getAuthDetails().user.user_id

app.post "/rmcompleted/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  #send a 403? (denied) unless user is in list of users permitted to create cases.
  #db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
  #  if editor
  #    requestHandlers.postNewpage req, res
  db.srem "completed:" + req.getAuthDetails().user.user_id, req.params.id
  db.srem "case:" + req.params.id + ":completed", req.getAuthDetails().user.user_id

app.post "/bookmark/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  db.sadd "bookmarks:" + req.getAuthDetails().user.user_id, req.params.id
  db.sadd "case:" + req.params.id + ":bookmarked", req.getAuthDetails().user.user_id
  res.send 200

app.post "/rmbookmark/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  db.srem "bookmarks:" + req.getAuthDetails().user.user_id, req.params.id
  db.srem "case:" + req.params.id + ":bookmarked", req.getAuthDetails().user.user_id
  res.send 200

app.post "/case/:id/:page/newpage", (req, res) ->
  #console.log "newpage triggered"
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      requestHandlers.postNewpage req, res

app.post "/case/:id/:page/feedback", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  storefeedback = {}
  storefeedback.feedback = req.body.feedback
  storefeedback.uid = req.getAuthDetails().user.user_id
  storefeedback.user = req.getAuthDetails().user.username
  storefeedback.time = new Date().toString()
  fb = JSON.stringify storefeedback
  db.rpush "case:" + req.params.id + ":page:" + req.params.page + ":feedback", fb, (err) ->
    if err
      console.log err
  res.send "OK", 200

app.put "/case/:id/:page", (req, res) ->
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      requestHandlers.putPage req, res

app.post "/hide/:id", (req, res) ->
  #console.log "Hide case " + req.params.id + " called"
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, owner) ->
    if owner || req.getAuthDetails().user.username == 'radioca1se'
      db.hset "case:" + req.params.id, "hidden", "true", (err) ->
        if err
          console.log err
        else res.send "OK", 200

app.post "/show/:id", (req, res) ->
  #console.log "Show case " + req.params.id + " called"
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, owner) ->
    if owner || req.getAuthDetails().user.username == 'radioca1se'
      db.hset "case:" + req.params.id, "hidden", "false", (err) ->
        if err
          console.log err
        else res.send "OK", 200

app.delete "/case/:id", (req, res) ->
  #console.log "DELETE /case/" + req.params.id + " called"
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, owner) ->
    if owner
      return requestHandlers.deleteCase req, res

app.delete "/sys/deletedcases", (req, res) ->
  #console.log "DELETE CASES, CLEANUP CALLED"
  return res.send "FORBIDDEN", 403 unless req.getAuthDetails().user.username == 'radioca1se'
  if req.getAuthDetails().user.username == 'radioca1se'
    return requestHandlers.cleanupCases req, res

app.get "/sys/admin", (req, res) ->
  #console.log "ADMINPAGE CALLED"
  return res.send "FORBIDDEN", 403 unless req.getAuthDetails().user.username == 'radioca1se'
  if req.getAuthDetails().user.username == 'radioca1se'
    #console.log "rendering adminpage"
    return res.render "admin",
      title: "ADMINPAGE"
      signed_in: req.isAuthenticated()
      user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
      icds: ""

app.delete "/case/:id/lastpage", (req, res) ->
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      #console.log "editor - removing case"
      requestHandlers.removeCase req, res
      #res.send "OK", 200

app.delete "/case/:id/:page", (req, res) ->
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      #console.log "editor - removing page"
      requestHandlers.deletePage req, res, req.params.id, req.params.page
      #res.send "OK", 200

app.delete "/case/:id/:page/:radio", (req, res) ->
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      #console.log "editor - removing radio"
      requestHandlers.removeRadio2 req.params.id, req.params.page, req.params.radio
      res.send "OK", 200

app.get "/dicom/:dicom", (req, res) ->
  #return res.send 444 unless req.isAuthenticated()
  dicom = __dirname + "/dicom/" + req.params.dicom
  fs.readFile dicom, "binary", (err, file) ->
    return res.send 444 if err
    res.statusCode = 200
    res.setHeader "Content-Type", "application/osirixzip"
    res.write file, "binary"
    res.end()

app.post "/dicom/case/:case/:page/:imgid", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  dicomID = new Date().getTime().toString()
  #(exports? this).radioIDforDICOM = req.params.imgid
  #form2 = new formidable.IncomingForm()
  form2 = new multiparty.Form()
  files = []
  fields = []
    
  form2.on("field", (field, value) ->
    fields.push [field, value]
    #console.log field + " " + value
  ).on("fileBegin", (field, file) ->
    #console.log file.type
    #console.log "fileBegin"
    if file.type == "application/zip" || "application/octet-stream"
      #console.log "zip posted?"
      file.path = __dirname + "/incoming/" + dicomID + ".zip"
    files.push [field, file]
  ).on "end", ->
    console.log "file recieved"
    console.log req.params.imgid
    exec "ruby -rubygems anonymizer.rb " + dicomID + " " + req.params.case + " " + req.params.page + " " + req.params.imgid, (error, stdout, stderr) ->
      if error
        return res.send 500
      else
        db.lpush "radio:" + req.params.imgid + ":dicom", dicomID
        return res.send 200
      console.log "error " + error
      console.log "stdout " + stdout
      console.log "stderr " + stderr
      

  form2.parse req, (err, fields, files) ->
    if err
      console.log err

app.get "/img/:img", (req, res) ->
  image = __dirname + "/img/" + req.params.img
  fs.readFile image, "binary", (err, file) ->
    return res.send 444  if err
    res.statusCode = 200
    res.setHeader "Content-Type", "image/jpeg"
    res.write file, "binary"
    res.end()


app.post "/image/:id/:page", (req, res) ->
  #console.log "POST /image/ called"
  return res.send 444 unless req.isAuthenticated()
  requestHandlers.postImage2 req, res

#console.log JSON.stringify process.env
port = process.env.PORT || 3333
unless module.parent
  server = http.createServer(app).listen(port)
  silent or console.log "Express server listening on port %d in %s mode", server.address().port, app.settings.env
