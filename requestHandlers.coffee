#formidable = require("formidable")
url = require("url")
#form = require("connect-form")
multiparty = require("multiparty")
redis = require("redis")
db = redis.createClient(6379)
#db = redis.createClient(process.env.DB_PORT)
sys = require("sys")
exec = require("child_process").exec

renderRoot = (req, res) ->
  res.render "index",
    title: "Home"
    signed_in: req.isAuthenticated()
    user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
    icds: ""
    creator: ""
    created: ""

renderNewRoot = (req, res) ->
  index = {}
  index.radios = []
  index.radios[0] = []
  db.lrange "radio:1329820725600", 0, -1, (err, images) ->
    index.radios[0].images = []
    images.forEach (image, imgID) ->
      index.radios[0].images[imgID] = image
      console.dir index.radios
    res.render "newindex",
      title: "Home"
      signed_in: req.isAuthenticated()
      user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
      icds: ""
      radios: index.radios or ""
      creator: ""
      created: ""

renderNewRoot2 = (req, res) ->
  index = {}
  index.radios = []
  index.radios[0] = []
  db.lrange "radio:1329820725600", 0, -1, (err, images) ->
    index.radios[0].images = []
    images.forEach (image, imgID) ->
      index.radios[0].images[imgID] = image
      console.dir index.radios
    res.render "newindex2",
      title: "Home"
      signed_in: req.isAuthenticated()
      user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
      icds: ""
      radios: index.radios or ""
      creator: ""
      created: ""
      
rendercases = (req, res, start, end) ->
  if req.isAuthenticated()
    userid = req.getAuthDetails().user_id
  else
    userid = "0"
  db.zrange "listed", start, end, (err, cases) ->
    if err or !cases[0]
      return res.send 444, "Error!"
    #console.log cases[0]
    sendcases = []
    db.smembers "bookmarks:" + userid, (err, bookmarks) ->
      db.smembers "completed:" + userid, (err, completed) ->
        cases.forEach (theCase, iteration) ->
          db.get "case:" + theCase + ":firstpage", (err, firstpage) ->
            db.hgetall "case:" + theCase, (err, sendcase) ->
              sendcase = {} unless sendcase
              if sendcase.icds
                #console.log sendcase.icds
                sendcase.icds = JSON.parse sendcase.icds
              sendcase.cid = theCase
              sendcase.firstpage = firstpage
              sendcases[iteration] = sendcase
              #console.dir sendcase
              unless cases[iteration + 1]
                #console.dir sendcases
                res.render "cases",
                  title: "Cases"
                  signed_in: req.isAuthenticated()
                  user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
                  cases: sendcases
                  bookmarks: bookmarks
                  completed: completed
                  icds: ""
                  creator: ""
                  created: ""

render = (req, res, theCase, editor) ->
  #console.dir theCase
  #console.log theCase.pagetype
  res.render theCase.pagetype,
    title: theCase.title or " - untitled"
    radios: theCase.radios or ""
    texts: theCase.texts or ""
    creator: theCase.creator or ""
    created: theCase.created
    mdhelp: theCase.mdhelp
    signed_in: req.isAuthenticated()
    user: (if req.isAuthenticated() then req.getAuthDetails().user.username else "0")
    cid: req.params.id
    modalities: theCase.modalities or ""
    description: theCase.description or ""
    icds: theCase.icds  or ""
    language: theCase.language or ""
    prevpage: theCase.prevpage
    nextpage: theCase.nextpage
    bookmarked: theCase.bookmarked
    completed: theCase.completed
    page: req.params.page
    pagetype: theCase.pagetype
    editor: editor
    private: theCase.private or 0
    feedback: theCase.feedback or ''
    style: theCase.style

rendercase = (req, res, theCase, editor) ->
  db.get "markdown-help", (err, data) ->
    if req.isAuthenticated()
      username = req.getAuthDetails().username
      userid = req.getAuthDetails().user_id
    else
      username = ""
      userid = "0"
    theCase.mdhelp = data
    if theCase.texts
      theCase.texts = JSON.parse theCase.texts
      #console.dir theCase.texts
    #db.get "case:" + req.params.id + ":stringified", (err, casedata_stringified) ->
#      if casedata_stringified
#        casedata = JSON.parse casedata_stringified
    db.hgetall "case:" + req.params.id, (err, casedata) ->
      theCase.modalities = casedata.modalities
      theCase.description = casedata.description
      theCase.creator = casedata.creator
      theCase.title = casedata.title
      if casedata.hidden == 'true' && !editor && username != 'radioca1se'
        res.redirect '/'
      db.sismember "bookmarks:" + userid, req.params.id, (err, bookmarked) ->
        unless err
          theCase.bookmarked = bookmarked
        db.sismember "completed:" + userid, req.params.id, (err, completed) ->
          unless err
            theCase.completed = completed
          db.lrange "case:" + req.params.id + ":icds", 0, -1, (err, ICDCodes) ->
            unless err
              delete theCase.icds
              theCase.icds = []
              ICDCodes.forEach (ICDCode, iID) ->
                theCase.icds[iID] = ICDCode
            db.lrange "case:" + req.params.id + ":page:" + req.params.page + ":radios", 0, -1, (err, radioIDs) ->
              return render(req, res, theCase, editor)  if radioIDs.length < 1
              theCase.radios = []
              radioIDs.forEach (radioID, ID) ->
                db.get "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + radioID + ":caption", (err, caption) ->
                  db.lindex "radio:" + radioID + ":dicom", 0, (err, dicom) ->
                    theCase.radios[ID] = []
                    theCase.radios[ID].ID = radioID
                    theCase.radios[ID].caption = caption  if caption
                    theCase.radios[ID].dcm = dicom if dicom
                    db.lrange "radio:" + radioID, 0, -1, (err, images) ->
                      theCase.radios[ID].images = []
                      images.forEach (image, imgID) ->
                        theCase.radios[ID].images[imgID] = image
                      theCase.feedback = []
                      db.lrange "case:" + req.params.id + ":page:" + req.params.page + ":feedback", 0, -1, (err, feedback) ->
                        feedback.forEach (fb, fbID) ->
                          theCase.feedback[fbID] = fb
                        #console.log theCase
                        render req, res, theCase, editor  unless radioIDs[ID + 1]

#backgroundRadios = (req,res) ->
#  db.lrange "radios", "0", "-1", (err, radios) ->
#    Math.random() * radios.length
      

postImage = (req, res, db) ->
  req.form.on "progress", (bytesReceived, bytesExpected) ->
    percent = (bytexReceived / bytesExpected * 100) or 0
    #console.log "Uploading: %" + percent + "\r"

postDicomAlt = (req, res) ->
  console.dir req.files
  if req.files.dicom.type == "application/zip"
    console.log "zip posted"
    req.files.dicom.path = __dirname + "/incoming" + req.params.id + ".zip"

postImage2alt = (req,res) ->
  d = new Date().getTime().toString()
  i = 0
  console.dir req.files
  if req.files.image.type == "image/jpg"
    req.files.image.path = __dirname + "/img/" + d + "." + i + ".jpg"
    db.rpush "radio:" + d, "/img/" + d + "." + i ".jpg"
    i++
    files.push

postImage2 = (req, res) ->
  db.incr "images", (err, imageno) ->
    d = new Date().getTime().toString() + imageno
    i = 0
    #console.log "postimage 2"
    form = new multiparty.Form()
    form = new formidable.IncomingForm()
    console.dir form
    files = []
    fields = []
    form.on("field", (field, value) ->
      fields.push [ field, value ]
    ).on("fileBegin", (field, file) ->
      if file.type == "image/jpeg"
        #console.log "image"
        file.path = __dirname + "/img/" + d + "." + i + ".jpg"
        db.rpush "radio:" + d, "/img/" + d + "." + i + ".jpg"
        i++
      files.push [ field, file ]
    ).on "end", ->
#    db.sadd "image:" + d, req.params.id
#    db.sadd "radio:" + d + ":users", req.getAuthDetails().user_id
      db.rpush "case:" + req.params.id + ":page:" + req.params.page + ":radios", d
      db.rpush "user:" + req.getAuthDetails().user.username + ":radios", d
      db.set "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + d + ":caption", "edit caption"
      res.send 200, {d}
      #console.log "-> upload done"

  form.parse req, (err, fields, files) ->
    if err
      console.log err

deletePage = (req, res, cid, page) ->
  db.lrange "case:" + cid + ":page:" + page + ":radios", 0, -1, (err, radioIDs) ->
    unless err
      removeRadio2 cid, page, radioID for radioID in radioIDs
  db.hgetall "case:" + cid + ":page:" + page, (err, thePage) ->
    unless err
      if thePage.prevpage == "0"
        db.set "case:" + cid + ":firstpage", thePage.nextpage
        redir = thePage.nextpage
      unless thePage.prevpage == "0"
        db.hset "case:" + cid + ":page:" + thePage.prevpage, "nextpage", thePage.nextpage
        redir = thePage.prevpage
      unless thePage.nextpage == "0"
        db.hset "case:" + cid + ":page:" + thePage.nextpage, "prevpage", thePage.prevpage
      db.del "case:" + cid + ":page:" + page
      #console.log redir
      res.send 200, redir

removeRadio2 = (cid, page, radio) ->
  db.del "case:" + cid + ":page:" + page + ":radio:" + radio + ":caption"
  db.lrem "case:" + cid + ":page:" + page + ":radios", 0, radio
#  db.srem "image:" + radio, cid
  db.lpush "removedRadios", radio

deletePage2 = (cid, page) ->
  db.lrange "case:" + cid + ":page:" + page + ":radios", 0, -1, (err, radioIDs) ->
    unless err or !radioIDs
      removeRadio2 cid, page, radioID for radioID in radioIDs
    db.del "case:" + cid + ":page:" + page
    db.del "case:" + cid + ":page:" + page + ":radios"

deleteCaseID = (cid) ->
  db.lrem "removedCases", 0, cid
  db.zrem "listed", cid
  db.get "case:" + cid + ":pages", (err, pages) ->
    unless err or !pages
      deletePage2 cid, page for page in [0..pages]
      db.del "case:" + cid
      db.del "case:" + cid + ":pages"
      db.del "case:" + cid + ":users"
      db.del "case:" + cid + ":firstpage"

cleanupCases = (req, res) ->
  db.lrange 'removedCases', 0, -1, (err, caseIDs) ->
    unless err or !caseIDs
      deleteCaseID caseID for caseID in caseIDs

putPage = (req, res) ->
  data = req.body
  data.cid = req.params.id
  data.lastEdit = new Date().getTime()
  data.creator = req.getAuthDetails().user.username
  db.zadd "casesLastEdit", data.lastEdit, data.cid
  db.zadd "cases", data.created, data.cid
  data.lastEdit = data.lastEdit.toString()
  db.hset "case:" + data.cid, "title", data.title
  #data_stringified = JSON.stringify data
  #console.dir data
  #console.dir data_stringified
  #db.set "case:" + req.params.id + ":page:" + req.params.page + ":stringified", data_stringified
  #db.set "case:" + req.params.id + ":stringified", data_stringified
  if data.texts
    savetext = JSON.stringify data.texts
    db.hset "case:" + req.params.id + ":page:" + req.params.page, "texts", savetext
  db.del "case:" + req.params.id + ":page:" + req.params.page + ":radios"
  if data.modalities
    db.hset "case:" + req.params.id, "modalities", data.modalities
  if data.description
    db.hset "case:" + req.params.id, "description", data.description
  if data.radios
    db.del "case:" + req.params.id + ":page:" + req.params.page + ":radios"
    data.radios.forEach (r, rID) ->
      console.log r.caption
      if r.caption
        db.set "case:" + req.params.id + ":page:" + req.params.page + ":radio:" + r.id + ":caption", r.caption
      db.rpush "case:" + req.params.id + ":page:" + req.params.page + ":radios", r.id
  #console.log "saved page"
  if data.icds
    db.del "case:" + req.params.id + ":icds"
    data.icds.forEach (i, iID) ->
      db.rpush "case:" + req.params.id + ":icds", i.code
    icdsString = JSON.stringify data.icds
    db.hset "case:" + req.params.id, "icds", icdsString
  res.send 200, "OK"

postNewpage = (req, res) ->
  cid = req.params.id
  pagedata = req.body
  pagedata.texts = "Edit text"
  pagedata.creator = req.getAuthDetails().user.username
  pagedata.cid = req.params.id
  db.incr "case:" + cid + ":pages", (err, page) ->
    prevpage = req.params.page
    db.hget "case:" + cid + ":page:" + prevpage, "nextpage", (err, nextpage) ->
#      pagedata.prevpage = prevpage
#      pagedata.nextpage = nextpage
      db.hset "case:" + cid + ":page:" + page, "nextpage", nextpage
      db.hset "case:" + cid + ":page:" + page, "prevpage", prevpage
      db.hset "case:" + cid + ":page:" + page, "pagetype", req.body.pagetype
#      db.hset "case:" + cid, "title", pagedata.title
#      db.hmset "case:" + cid, pagedata
#      console.dir pagedata
#      db.hmset "case:" + cid + ":page:" + page, pagedata
      unless prevpage == "0"
        db.hset "case:" + cid + ":page:" + prevpage, "nextpage", page
      unless nextpage == "0"
        db.hset "case:" + cid + ":page:" + nextpage, "prevpage", page
      res.send 200, "/case/" + cid + "/" + page

#newpage = (req, res, cid, page, db, pagedata) ->
#  trypage = "case:" + cid + ":page:" + page
#  db.get trypage, (err, data) ->
#    if data
#      page++
#      newpage req, res, cid, page, db, pagedata
#    else
#      db.hmset trypage, pagedata
#      res.send "/case/" + cid + "/" + page, 200

removeCase = (req, res) ->
  cid = req.params.id
  #console.log "removeCase called"
  db.zrem "listed", cid
  db.rpush "removedCases", cid
  return res.send 200, "OK, removed case"
    
exports.removeCase = removeCase
exports.postNewpage = postNewpage
exports.putPage = putPage
exports.deletePage = deletePage
exports.rendercase = rendercase
#exports.newpage = newpage
exports.postImage2 = postImage2
exports.postImage = postImage
exports.cleanupCases = cleanupCases
exports.rendercases = rendercases
exports.renderRoot = renderRoot
exports.renderNewRoot = renderNewRoot
exports.renderNewRoot2 = renderNewRoot2
exports.removeRadio2 = removeRadio2
#exports.postDicom = postDicom
