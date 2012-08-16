username = (req, res) ->
  (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
String.prototype.toProperCase = ->
  this.replace /\w\S*/g, (txt) ->
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()

express = require("express")
formidable = require("formidable")
exec = require("child_process").exec
spawn = require("child_process").spawn
url = require("url")
fs = require("fs")
requestHandlers = require("./requestHandlers")
sys = require("sys")
util = require("util")
redis = require("redis")
#db = redis.createClient()
db = redis.createClient(6666)
icd = redis.createClient(4444)
easyoauth = require("easy-oauth")
app = module.exports = express.createServer()
app.configure ->
  app.set "views", __dirname + "/views"
  app.set "view engine", "jade"
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use express.cookieParser()
  app.use express.session(secret: "eventuallycloseduringnative")
  app.use require("stylus").middleware(src: __dirname + "/public/")
  app.use easyoauth(require("./keys_file"))
  app.use app.router
  app.use express.favicon(__dirname + "/public/favicon.ico")
  app.use express.static(__dirname + "/public")

delete express.bodyParser.parse['multipart/form-data']

app.configure "development", ->
  app.use express.errorHandler(
    dumpExceptions: true
    showStack: true
  )

app.configure "production", ->
  app.use express.errorHandler()

app.error (err, req, res, next) ->
  sys.puts "APP.ERROR:" + sys.inspect(err)
  next err

db.on "error", (err) ->
  console.log "Redis Error " + err

app.get "/", (req, res) ->
  if req.isAuthenticated() then res.redirect "/cases/0/-1"
  else requestHandlers.renderRoot req, res

app.get "/signed_in", (req, res) ->
  uid = req.getAuthDetails().user.user_id
  userdata = req.getAuthDetails()
  userdata.user_id = userdata.user.user_id
  userdata.username = userdata.user.username
  db.sismember "users", uid, (err, registered) ->
    if registered
      db.hmset "user:" + uid, userdata
      db.set "user:" + userdata.username, uid
      res.send "OK", 200
    else
      db.sadd "users", uid
      db.hmset "user:" + uid, userdata
      db.set "user:" + userdata.username, uid
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

app.post "/newcase", (req, res) ->
  db.sismember "userCanAdd", req.getAuthDetails().user.user_id, (err, canAdd) ->
    return res.send "FORBIDDEN", 403 unless canAdd
    if canAdd
      data = req.body
      data.creator = req.getAuthDetails().user.username
      data.texts = [""]
      data.created = new Date().getTime()
      data.lastEdit = data.created
      data.listed = "true"
      data.nextpage = "0"
      data.prevpage = "0"
      db.incr "numberOfCases", (err, cid) ->
        data.cid = cid
        db.incr "case:" + cid + ":pages"
        db.zadd "casesLastEdit", data.lastEdit, cid
        db.zadd "listed", data.created, cid  if data.listed is "true"
        db.zadd "cases:" + data.creator, data.created, cid
        db.set "case:" + cid + ":firstpage", "1"
        db.hmset "case:" + cid + ":page:1", data, (err, data) ->
          db.sadd "case:" + cid + ":users", req.getAuthDetails().user.user_id, (err, data) ->
            #console.log "created case: " + cid
            res.send "/case/" + cid + "/1", 200

app.post "/icd", (req, res) ->
  body = req.body.qs
  body = '*' + body + '*'
  icd.keys body, (err, codes) ->
    unless err
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
    db.hgetall "case:" + req.params.id + ":page:" + req.params.page, (error, theCase) ->
      return res.redirect "back"  if error or not theCase.cid
      #console.log "rendering case"
      requestHandlers.rendercase req, res, theCase, editor

app.get "/case/:id/:page/feedback", (req, res) ->
  db.lrange "case:" + req.params.id + ":page:" + req.params.page + ":feedback", 0, -1, (err, feedback) ->
    pagefeedback = []
    feedback.forEach (fb, fbID) ->
      pagefeedback[fbID] = JSON.parse fb
    res.partial "feedback",
    object: pagefeedback

app.post "/completed/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  #send a 403? (denied) unless user is in list of users permitted to create cases.
  #db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
  #  if editor
  #    requestHandlers.postNewpage req, res
  db.sadd "completed:" + req.getAuthDetails().user_id, req.params.id
  db.sadd "case:" + req.params.id + ":completed", req.getAuthDetails().user_id

app.post "/rmcompleted/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  #send a 403? (denied) unless user is in list of users permitted to create cases.
  #db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
  #  if editor
  #    requestHandlers.postNewpage req, res
  db.srem "completed:" + req.getAuthDetails().user_id, req.params.id
  db.srem "case:" + req.params.id + ":completed", req.getAuthDetails().user_id

app.post "/bookmark/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  db.sadd "bookmarks:" + req.getAuthDetails().user_id, req.params.id
  db.sadd "case:" + req.params.id + ":bookmarked", req.getAuthDetails().user_id
  res.send 200

app.post "/rmbookmark/:id", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  db.srem "bookmarks:" + req.getAuthDetails().user_id, req.params.id
  db.srem "case:" + req.params.id + ":bookmarked", req.getAuthDetails().user_id
  res.send 200

app.post "/case/:id/:page/newpage", (req, res) ->
  #console.log "newpage triggered"
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      requestHandlers.postNewpage req, res

app.post "/case/:id/:page/feedback", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  storefeedback = {}
  #send a 403? (denied) unless user is in list of users permitted to create cases.
  #db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
  #  if editor
  #    requestHandlers.postNewpage req, res
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
      db.hset "case:" + req.params.id, "hidden", true, (err) ->
        if err
          console.log err
        else res.send "OK", 200

app.post "/show/:id", (req, res) ->
  #console.log "Show case " + req.params.id + " called"
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, owner) ->
    if owner || req.getAuthDetails().user.username == 'radioca1se'
      db.hset "case:" + req.params.id, "hidden", false, (err) ->
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

app.delete "/case/:id/:page", (req, res) ->
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      #console.log "editor - removing page"
      requestHandlers.deletePage req.params.id, req.params.page
      res.send "OK", 200

app.delete "/case/:id/:page/:radio", (req, res) ->
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      #console.log "editor - removing radio"
      requestHandlers.removeRadio2 req.params.id, req.params.page, req.params.radio 
      res.send "OK", 200

app.get "/radio/:id", (req, res) ->
  radio = {}
  radio.ID = req.params.id
  db.lrange "radio:" + req.params.id, 0, -1, (err, images) ->
    radio.images = []
    images.forEach (image, imgID) ->
      radio.images[imgID] = image

    res.partial "radio",
    object: radio

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
  requestHandlers.postImage2 req, res, db

port = process.env.PORT or 3333
app.listen port, ->
  console.log process.env.NODE_ENV
  console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env
