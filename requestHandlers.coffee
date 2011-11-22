render = (req, res, theCase, editor) ->
  res.render "case",
    title: theCase.title or " - untitled"
    radios: theCase.radios or ""
    texts: [ theCase.texts ] or ""
    creator: theCase.creator or ""
    created: theCase.created
    mdhelp: mdhelp
    signed_in: req.isAuthenticated()
    user: req.getAuthDetails().user.username
    cid: req.params.id
    prevpage: theCase.prevpage
    nextpage: theCase.nextpage
    page: req.params.page
    editor: editor
    private: theCase.private or 0
rendercase = (req, res, theCase, editor, db) ->
  db.get "markdown-help", (err, data) ->
    mdhelp = JSON.parse(data)
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

            render req, res, theCase, editor  unless radioIDs[ID + 1]
postImage2 = (req, res, db) ->
  d = new Date().getTime().toString()
  i = 0
  form = new formidable.IncomingForm()
  files = []
  fields = []
  form.on("field", (field, value) ->
    fields.push [ field, value ]
  ).on("fileBegin", (field, file) ->
    if file.type = "image/jpeg"
      file.path = __dirname + "/img/" + d + "." + i + ".jpg"
      db.rpush "radio:" + d, "/img/" + d + "." + i + ".jpg"
      i++
    files.push [ field, file ]
  ).on "end", ->
    db.sadd "image:" + d, req.params.id
    db.rpush "case:" + req.params.id + ":page:" + req.params.page + ":radios", d
    db.rpush "user:" + req.getAuthDetails().user.username + ":radios", d
    db.set "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + d + ":caption", "double click to add caption"
    res.send d, 200
    console.log "-> upload done"

  form.parse req, (err, fields, files) ->
newpage = (req, res, cid, page, db, pagedata) ->
  trypage = "case:" + cid + ":page:" + page
  db.get trypage, (err, data) ->
    if data
      page++
      newpage req, res, cid, page, db, pagedata
    else
      db.hmset trypage, pagedata
      res.send "/case/" + cid + "/" + page, 200
formidable = require("formidable")
url = require("url")
exports.rendercase = rendercase
exports.newpage = newpage
exports.postImage2 = postImage2