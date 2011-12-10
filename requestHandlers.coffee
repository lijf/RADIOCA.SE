formidable = require("formidable")
url = require("url")
form = require("connect-form")
redis = require("redis")
db = redis.createClient()

render = (req, res, theCase, editor) ->
  #console.log theCase.pagetype
  res.render theCase.pagetype,
    title: theCase.title or " - untitled"
    radios: theCase.radios or ""
    texts: [ theCase.texts ] or ""
    creator: theCase.creator or ""
    created: theCase.created
    mdhelp: theCase.mdhelp
    signed_in: req.isAuthenticated()
    user: req.getAuthDetails().user.username
    cid: req.params.id
    prevpage: theCase.prevpage
    nextpage: theCase.nextpage
    page: req.params.page
    editor: editor
    private: theCase.private or 0
    feedback: theCase.feedback or ''
    style: theCase.style

rendercase = (req, res, theCase, editor) ->
  db.get "markdown-help", (err, data) ->
    theCase.mdhelp = JSON.parse(data)
    db.lrange "case:" + req.params.id + ":page:" + req.params.page + ":radios", 0, -1, (err, radioIDs) ->
      return render(req, res, theCase, editor)  if radioIDs.length < 1
      theCase.radios = []
      radioIDs.forEach (radioID, ID) ->
        db.get "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + radioID + ":caption", (err, caption) ->
          theCase.radios[ID] = []
          theCase.radios[ID].ID = radioID
          theCase.radios[ID].caption = caption  if caption
          db.lrange "radio:" + radioID, 0, -1, (err, images) ->
            theCase.radios[ID].images = []
            images.forEach (image, imgID) ->
              theCase.radios[ID].images[imgID] = image
            theCase.feedback = []
            db.lrange "case:" + req.params.id + ":page:" + req.params.page + ":feedback", 0, -1, (err, feedback) ->
              feedback.forEach (fb, fbID) ->
                theCase.feedback[fbID] = fb
              render req, res, theCase, editor  unless radioIDs[ID + 1]

postImage = (req, res, db) ->
  req.form.on "progress", (bytesReceived, bytesExpected) ->
    percent = (bytexReceived / bytesExpected * 100) or 0
    console.log "Uploading: %" + percent + "\r"

removeRadio = (cid, page, radio) ->
  db.del "case:" + cid + ":page:" + page + ":radio:" + radio + ":caption"
  db.lrem "case:" + cid + ":page:" + page + ":radios", 0, radio
  db.srem "image:" + radio, cid
  #res.send "OK", 200

postImage2 = (req, res, db) ->
  d = new Date().getTime().toString()
  i = 0
  #console.log "postimage 2"
  form = new formidable.IncomingForm()
  #console.dir form
  files = []
  fields = []
  form.on("field", (field, value) ->
    fields.push [ field, value ]
  ).on("fileBegin", (field, file) ->
    if file.type = "image/jpeg"
      #console.log "image"
      file.path = __dirname + "/img/" + d + "." + i + ".jpg"
      db.rpush "radio:" + d, "/img/" + d + "." + i + ".jpg"
      i++
    files.push [ field, file ]
  ).on "end", ->
    db.sadd "image:" + d, req.params.id
    db.sadd "radio:" + d + ":users", req.getAuthDetails().user_id
    db.rpush "case:" + req.params.id + ":page:" + req.params.page + ":radios", d
    db.rpush "user:" + req.getAuthDetails().user.username + ":radios", d
    db.set "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + d + ":caption", "double click to add caption"
    res.send d, 200
    console.log "-> upload done"

  form.parse req, (err, fields, files) ->
    if err
      console.log err

deletePage (cid, page) ->
  db.lrange "case:" + cid + ":page:" + page + ":radios", 0, -1, (err, radioIDs) ->
    removeRadio cid, page, radio for radio in radioIDs
  db.hgetall "case:" + cid + ":page:" + page, (err, theCase) ->
    db.set "case:" + cid + ":firstpage", theCase.nextpage  if theCase.prevpage is "0"
    db.hset "case:" + cid + ":page:" + theCase.prevpage, "nextpage", theCase.nextpage
    db.hset "case:" + cid + ":page:" + theCase.nextpage, "prevpage", theCase.prevpage
    db.del "case:" + cid + ":page:" + page
  #res.send "OK", 200

putPage (req, res) ->
  data = req.body
  console.dir data
  data.cid = req.params.id
  data.lastEdit = new Date().getTime()
  data.creator = req.getAuthDetails().user.username
  db.zadd "casesLastEdit", data.lastEdit, data.cid
  if data.private is "false"
    db.zadd "cases", data.created, data.cid
  else
    db.zrem "cases", data.cid
  db.hmset "case:" + req.params.id + ":page:" + req.params.page, data
  data.radios.forEach (r, rID) ->
    db.set "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + r.id + ":caption", r.caption
  console.log "saved page"
  res.send "OK", 200

postNewpage = (req, res) ->
  cid = req.params.id
  pagedata = req.body
  pagedata.texts = "Edit text"
  pagedata.creator = req.getAuthDetails().user.username
  pagedata.cid = req.params.id
  db.incr "case:" + cid + ":pages", (err, page) ->
    prevpage = req.params.page
    db.hget "case:" + cid + ":page:" + prevpage, "nextpage", (err, nextpage) ->
      pagedata.prevpage = prevpage
      pagedata.nextpage = nextpage
      db.hmset "case:" + cid + ":page:" + page, pagedata
      db.hset "case:" + cid + ":page:" + prevpage, "nextpage", page
      db.hset "case:" + cid + ":page:" + nextpage, "prevpage", page
      res.send "/case/" + cid + "/" + page, 200

newpage = (req, res, cid, page, db, pagedata) ->
  trypage = "case:" + cid + ":page:" + page
  db.get trypage, (err, data) ->
    if data
      page++
      newpage req, res, cid, page, db, pagedata
    else
      db.hmset trypage, pagedata
      res.send "/case/" + cid + "/" + page, 200

exports.postNewpage = postNewpage
exports.putPage = putPage
exports.deletePage = deletePage
exports.rendercase = rendercase
exports.newpage = newpage
exports.postImage2 = postImage2
exports.postImage = postImage