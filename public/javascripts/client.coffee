scrollfunction = ->
  $(".stack", top.document).mousewheel (event, delta) ->
    if delta > 0
      $(this).css "background-position", parseInt($(this).css("background-position"), 10) - parseInt($(this).css("width"), 10)
    else $(this).css "background-position", parseInt($(this).css("background-position"), 10) + parseInt($(this).css("width"), 10)  if delta < 0
    event.preventDefault()
rendermd = ->
  $(".md", top.document).html ->
    markdown = $(this).siblings(".mdtxt").val()
    converter.makeHtml markdown
editfunctions = ->
  $(".md", top.document).live dblclick: ->
    $(this).hide()
    $(this).siblings(".mdtxt").show().focus().autogrow()

  $(".mdtxt", top.document).live blur: ->
    $(this).hide()
    rendermd()
    $(this).siblings(".md").show()

  $(".stack", top.document).append $("<button type=\"button\" class=\"deletebutton\">X</button>")
  $("#addstack", top.document).show()
editclose = ->
  $(".md", top.document).die()
  $(".mdtxt", top.document).die()
  $("#markdown-help", top.document).hide()
  $("#addstack", top.document).hide()
  $("#uploadarea", top.document).hide()
  $("#editbar", top.document).hide().attr "src", "about:none"
  $(".stack>.deletebutton", top.document).remove()
  $("#editbutton", top.document).show()
spiderpage = ->
  jsonpage = {}
  jsonpage.title = $("title", top.document).html()
  jsonpage.radios = $(".radio", top.document).map(->
    radio = {}
    radio.img = $(this).children(".stack").attr("url")
    radio.caption = $(this).children(".caption").children(".mdtxt").val()
    radio
  ).get()
  jsonpage.texts = $(".txt>.mdtxt", top.document).map(->
    $(this).val()
  ).get()
  jsonpage
converter = new Showdown.converter()
opts =
  lines: 12
  length: 7
  width: 4
  radius: 10
  color: "#fff"
  speed: 1
  trail: 33
  shadow: true

$.fn.spin = (opts) ->
  @each ->
    $this = $(this)
    data = $this.data()
    if data.spinner
      data.spinner.stop()
      delete data.spinner
    data.spinner = new Spinner($.extend(color: $this.css("color"), opts)).spin(this)  if opts != false

  this

authcallback = (data) ->
  $("#session").html "<button id=\"sign_out\">Sign out " + data.user.username + "</button>"
  $.ajax
    url: "/signed_in"
    success: (data) ->
      $("#info").html("new user").show()  if data == "new user"

  $("#editbutton").show()

$ ->
  scrollfunction()
  $("#sign_out").live click: ->
    window.open "http://twitter.com/#!/logout"
    $.ajax
      url: "/sign_out"
      success: (data) ->
        editclose()
        $("#editbutton").hide()
        $("#session").html data

  $("#addstack", top.document).live click: ->
    $("#uploadarea").show()

  $("#twitbutt").live click: ->
    openEasyOAuthBox "twitter", authcallback
    $(this).hide()

  $("#cancelupload").live click: ->
    $("#uploadarea").hide()

  $("#facebutt").click ->
    openEasyOAuthBox "facebook", authcallback

  $(".deletebutton").live click: ->
    $(this).parent().parent().remove()

  $(".stack").live "toggleSpinner", ->
    alert "toggleSpinner triggered"
    $(this).spin opts

  $("#save").click (event) ->
    event.preventDefault()
    data = spiderpage()
    url = $("#savepage").attr("action").toString()
    $.ajax
      type: "PUT"
      url: url
      dataType: "json"
      data: data
      success: (msg) ->
        alert "Page Saved: " + msg

  $("#help").click ->
    $("#markdown-help", top.document).show()

  $("#closehelp").live click: ->
    $("#markdown-help", top.document).hide()

  $("#sendstring").live click: ->
    $.ajax
      url: "/put-test"
      method: "put"

  $("#editbutton").live click: ->
    path = top.document.location.pathname.split("/")
    $("#editbar", top.document).attr("src", "/" + path[1] + "/" + path[2] + "/" + path[3] + "/edit").show()
    $(this).hide()

  $("#done").live click: ->
    editclose()

  $("#upload").live click: ->
    $("#uploadarea").hide()
    userFile = $("#userfile").val()
    iframe = $("<iframe name=\"postframe\" id=\"postframe\" class=\"hidden\" src=\"about:none\" />")
    $("#iframe").append iframe
    $("#uploadform").attr
      action: "/image/"
      method: "POST"
      userfile: $("#userfile").val()
      enctype: "multipart/form-data"
      encoding: "multipart/form-data"
      target: "postframe"

    $("#uploadform").submit()
    $("#radios", top.document).append "<div class='radio'><div url='', class='stack img512'></div>" + "<div class='caption'>" + "<textarea class='mdtxt' style='display:none'>" + "(double-click to change caption) </textarea>" + "<div class='md'></div></div></div>"
    rendermd()
    $(".radio:last>.stack", top.document).append $("<button type=\"button\" class=\"deletebutton\">X</button>")
    $(".radio:last>.stack", top.document).spin()
    $("#postframe").load ->
      url = $("iframe")[0].contentDocument.body.innerHTML
      $(".radio:last>.stack", top.document).attr "url", url
      scrollfunction()

  $.fn.autogrow = (options) ->
    @filter("textarea", top.document).each ->
      $this = $(this)
      minHeight = $this.height()
      lineHeight = $this.css("lineHeight")
      shadow = $("<div></div>").css(
        position: "absolute"
        top: -10000
        left: -10000
        width: $(this).width() - parseInt($this.css("paddingLeft")) - parseInt($this.css("paddingRight"))
        fontSize: $this.css("fontSize")
        fontFamily: $this.css("fontFamily")
        lineHeight: $this.css("lineHeight")
        resize: "none"
      ).appendTo(document.body)
      update = ->
        times = (string, number) ->
          i = 0
          r = ""

          while i < number
            r += string
            i++
          r

        val = @value.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;").replace(/\n$/, "<br/>&nbsp;").replace(/\n/g, "<br/>").replace(RegExp(" {2,}", "g"), (space) ->
          times("&nbsp;", space.length - 1) + " "
        )
        shadow.html val
        $(this).css "height", Math.max(shadow.height() + 20, minHeight)

      $(this).change(update).keyup(update).keydown update
      update.apply this

    this