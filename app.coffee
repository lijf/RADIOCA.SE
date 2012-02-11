username = (req, res) ->
  (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")

loadUser = (req, res, next) ->
  unless req.isAuthenticated()
    res.redirect "back"
  else
    next()

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
db = redis.createClient()
easyoauth = require("easy-oauth")
app = module.exports = express.createServer()
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
  res.render "index",
    title: "Home"
    signed_in: req.isAuthenticated()
    user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")

app.get "/signed_in", (req, res) ->
  uid = req.getAuthDetails().user.user_id
  userdata = req.getAuthDetails()
  userdata.user_id = userdata.user.user_id
  userdata.username = userdata.user.username
  db.sismember "users", uid, (err, registered) ->
    if registered
      db.hmset "user:" + uid, userdata, (err, data) ->
      res.send "OK", 200
    else
      db.sismember "invitees", req.getAuthDetails().user.username, (err, invited) ->
        if invited
          db.sadd "users", uid
          db.hmset "user:" + uid, userdata, (err, data) ->

          res.send "new user, first login", 200
        else
          req.logout()
          res.send "not allowed", 403

app.get "/sign_out", (req, res) ->
  req.logout()
  res.send "<button id=\"twitbutt\">Sign in with twitter</button>"

app.get "/stat/:pagename", (req, res) -> # this may be to much of a 'catch all'
  res.render req.params.pagename,
    title: req.params.pagename
    signed_in: req.isAuthenticated()
    user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")

app.get "/newcase", (req, res) ->
  return res.redirect "/" unless req.isAuthenticated()
  res.render "newcase",
    title: "Create new case"
    signed_in: req.isAuthenticated()
    user: req.getAuthDetails().user.username

app.post "/newcase", (req, res) ->
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
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
        console.log "created case: " + cid
        res.send "/case/" + cid + "/1", 200

app.get "/cases/:start/:finish", (req, res) ->
  return res.redirect "back" unless req.isAuthenticated()
  start = parseInt(req.params.start, 10)
  end = parseInt(req.params.finish, 10)
  db.zrange "listed", start, end, (err, cases) ->
    res.send 444  if err or not cases[0]
    sendcases = []
    cases.forEach (theCase, iteration) ->
      db.get "case:" + theCase + ":firstpage", (err, firstpage) ->
        db.hgetall "case:" + theCase + ":page:" + firstpage, (err, sendcase) ->
          sendcases[iteration] = sendcase
          unless cases[iteration + 1]
            console.log "rendering cases"
            res.render "cases",
              title: "Cases"
              signed_in: req.isAuthenticated()
              user: req.getAuthDetails().user.username
              cases: sendcases

app.get "/case/:id/:page", (req, res) ->
  return res.redirect "back" unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    db.hgetall "case:" + req.params.id + ":page:" + req.params.page, (error, theCase) ->
      #console.dir theCase
      return res.redirect "back"  if error or not theCase.cid
      #return res.redirect "back" unless theCase.listed is "true" or (theCase.listed is "false" and editor)
      console.log "rendering case"
      requestHandlers.rendercase req, res, theCase, editor, db

app.get "/case/:id/:page/feedback", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  db.lrange "case:" + req.params.id + ":page:" + req.params.page + ":feedback", 0, -1, (err, feedback) ->
    pagefeedback = []
    feedback.forEach (fb, fbID) ->
      pagefeedback[fbID] = JSON.parse fb
    res.partial "feedback",
    object: pagefeedback

app.post "/case/:id/:page/newpage", (req, res) ->
  console.log "newpage triggered"
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

app.delete "/case/:id", (req, res) ->
  console.log "DELETE /case/" + req.params.id + " called"
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, owner) ->
    if owner
      return requestHandlers.deleteCase req, res

app.delete "/sys/deletedcases", (req, res) ->
  console.log "DELETE CASES, CLEANUP CALLED"
  return res.send "FORBIDDEN", 403 unless req.getAuthDetails().user.username == 'radioca1se'
  if req.getAuthDetails().user.username == 'radioca1se'
    return requestHandlers.cleanupCases req, res

app.get "/sys/admin", (req, res) ->
  console.log "ADMINPAGE CALLED"
  return res.send "FORBIDDEN", 403 unless req.getAuthDetails().user.username == 'radioca1se'
  if req.getAuthDetails().user.username == 'radioca1se'
    console.log "rendering adminpage"
    return res.render "admin",
      title: "ADMINPAGE"
      signed_in: req.isAuthenticated()
      user: req.getAuthDetails().user.username

app.delete "/case/:id/:page", (req, res) ->
  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      console.log "editor"
      requestHandlers.deletePage req.params.id, req.params.page
      res.send "OK", 200

app.delete "/case/:id/:page/:radio", (req, res) ->
  db.sismember "case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, editor) ->
    if editor
      db.del "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + req.params.radio + ":caption"
      db.lrem "case:" + req.params.id + ":page:" + req.params.page + ":radios", 0, req.params.radio
#      db.srem "image:" + req.params.radio, req.params.id
      db.lpush "removedRadios", req.params.radio
      res.send "OK", 200

#app.get "/radios/:user", (req, res) ->
#  return res.redirect("/")  unless req.isAuthenticated()
#  unless not req.getAuthDetails().user.username is req.params.user
#    sendradios = []
#    db.lrange "user:" + req.params.user + ":radios", 0, -1, (err, radios) ->
#      radios.forEach (radio, id) ->
#        #console.log radio
#        sendradios[id] = {}
#        sendradios[id].ID = radio
#        db.lrange "radio:" + radio, 0, -1, (err, images) ->
#          sendradios[id].images = []
#          images.forEach (image, imgID) ->
#            sendradios[id].images[imgID] = image
#
#          unless radios[id + 1]
#            #console.dir sendradios
#            res.render "userradios",
#              title: "Radios - " + req.params.user
#              user: req.getAuthDetails().user.username
#              signed_in: req.isAuthenticated()
#              radios: sendradios

app.get "/radio/:id", (req, res) ->
  return res.redirect("/")  unless req.isAuthenticated()
  radio = {}
  radio.ID = req.params.id
  db.lrange "radio:" + req.params.id, 0, -1, (err, images) ->
    radio.images = []
    images.forEach (image, imgID) ->
      radio.images[imgID] = image

    res.partial "radio",
    object: radio

app.get "/img/:img", (req, res) ->
  return res.send 444 unless req.isAuthenticated()
  image = __dirname + "/img/" + req.params.img
  fs.readFile image, "binary", (err, file) ->
    return res.send 444  if err
    res.statusCode = 200
    res.setHeader "Content-Type", "image/jpeg"
    res.write file, "binary"
    res.end()

app.post "/image/:id/:page", (req, res) ->
  console.log "POST /image/ called"
  return res.send 444 unless req.isAuthenticated()
  requestHandlers.postImage2 req, res, db

#app.delete "/image/:id", (req, res) ->
#  console.log "DELETE /image/" + req.params.id + " called"
#  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
#  db.sismember "radio:" + req.params.id + ":users", req.getAuthDetails().user.user_id, (err, owner) ->
#    if owner
#      db.smembers "image:" + req.params.id, (err, pages) ->
#        console.log pages
#        return res.send "radio still connected to page", 403 unless pages.length == 0
#        db.del "radio:" + req.params.id
#        db.del "image:" + req.params.id
#        db.del "image:" + req.params.id + ":users"
#        db.lrem "user:" + req.getAuthDetails().user.username + ":radios", 0, req.params.id
#        db.sadd "deleted_radios", req.params.id
#        res.send "OK, radio removed", 200


#app.post "/image/:id/:page/old", (req, res) ->
#  console.log "POST /image/ called"
#  d = new Date().getTime().toString()
#  return res.send "FORBIDDEN", 403 unless req.isAuthenticated()
#  console.dir req.body
#  i = 0
#  req.body.userfile.forEach (file, fid) ->
#    if file.type = "image/jpeg"
#      filename = "/img/" + d + "." + i + ".jpg"
#      console.log file.name
#      fs.rename file.path, __dirname + filename
#      db.rpush "radio:" + d, filename
#      console.log filename, i
#      i++
#  db.sadd "image:" + d, req.params.id
#  db.rpush "case:" + req.params.id + ":page:" + req.params.page + ":radios", d
#  db.rpush "user:" + req.getAuthDetails().user.username + ":radios", d
#  db.set "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + d + ":caption", "caption"
#  res.send d, 200
#  console.log "-> upload done"
#  requestHandlers.postImage2 req, res, db

port = process.env.PORT or 3000
app.listen port, ->
  console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env
