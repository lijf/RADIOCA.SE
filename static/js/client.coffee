#these variables are for touchscroll,
lastY = 0
flickY = 0
samp = 0
visimg = $(".stack_image")
icdquery = ""

String.prototype.toProperCase = ->
  this.replace(/\w\S*/g, (txt) ->
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())

changeZoomLevel = (width) ->
  sViewport = '<meta name="viewport" content="width=' + width + '">'
  jViewport = $('meta[name="viewport"]')
  if jViewport.length > 0
    jViewport.replaceWith sViewport
  else
    $('head').append sViewport

isiPhone = ->
  return ((navigator.platform.indexOf "iPhone" !=  -1) || (navigator.platform.indexOf "iPod" != -1))

findICD = (icdquery) ->
  json = {}
  json.qs = icdquery
  $.ajax
    type: "POST"
    url: "/icd"
    data: json
    cache: false
    statusCode:
      200: (data) ->
        data=data.replace /"\]/g,''
        data=data.replace /","/g,''
        data=data.replace /\["/,''
        data=data.replace /\[\]/,''
        $("#icd_res").append data

change_url = (url) ->
  document.location = url

maximizeradio = (radio) ->
  radio.clone(true).appendTo('#maximized')
  $('#maximized>.radio').removeClass("radioimagepage")
  $('#maximized').show()
  touchscroll()
  $('#footer').hide()
  $('#maximized>.radio>.maximizeradio').hide()
  $('#maximized>.radio>.minimizeradio').show()
  #window.scrollTo(0,0)

minimizeradio = (radio) ->
  radio.remove()
  $('#maximized').hide()
  $('#footer').show()

newpage  = (type) ->
  json = {}
  json.title = getTitle()
  json.private = $("#private").is(":checked")
  json.created = $("#created").val()
  json.pagetype = type
  json.modalities = $(".modality:checked").map(->
    $(this).val()
  ).get()
  json.description = $(".description:checked").map(->
    $(this).val()
  ).get()
  json.icd = $("#icd").map(->
    $(this).val()
  ).get()
  $.ajax
    url: window.location.pathname + "/newpage"
    type: "POST"
    data: json
    statusCode:
      404: ->
        alert "Page not found"
      200: (url) ->
        $("#save").trigger "click"
        document.location.href = url
      403: ->
        alert "Forbidden, no new page created"

newcase = (type) ->
  json = {}
  json.pagetype = type
  json.title = "untitled"
  $.ajax
    url: "/newcase"
    type: "POST"
    data: json
    statusCode:
      403: ->
        alert "Forbidden - if you want to add cases please write to info@radioca.se"
      200: (url) ->
        document.location = url
      500: ->
        alert "Error - Please log in"

editfunctions = ->
  $(".postdcm").toggle()
  $(".nodcm").toggle()
  $('#locked').toggle()
  $('#open').toggle()
  $('.removeradio').toggle()
  $(".textedit").toggle()
  $("#addstack").toggle()
  $("#controls").toggle()
  $(".moveradioup").toggle()
  $(".moveradiodown").toggle()
  $("#boxit_dialog").hide()
  $("#addstack_dialog").hide()
  $("#addtext").toggle()
  $(".deletetext").toggle()

zebrarows = (selector, className) ->
  $(selector).removeClass(className).addClass(className)

filter2 = (selector, query) ->
  query = $.trim(query)
  $(selector).each ->
    if ($(this).text().search(new RegExp(query, "i")) < 0)
      $(this).hide().removeClass('visible')
    else
      $(this).show().addClass('visible')

getfeedback = ->
  $.ajax
    type: "GET"
    url: window.location.pathname + '/feedback'
    statusCode:
      200: (data) ->
        $("#feedbacktext").html data
      403: ->
        document.location = '/'
        
playradio = -> 
  setInterval ->
    visimg = $('#frontradio > .radio > .stack > .stack_image:visible')
    visimg.next().show()
    visimg.prev().hide()
  , 500

touchscroll = ->
  $(".stack > .stack_image").each ->
    @ontouchstart = (e) ->
      visimg = $(this)
    @ontouchmove = (e) ->
      if e.targetTouches.length is 1
        samp++
        e.preventDefault()
        if samp >2
          samp = 0
          touch = e.touches[0]
          if parseInt(touch.pageY, 10) > lastY and visimg.prev().length > 0
            visimg.prev().show()
            visimg.hide()
            visimg.next().hide()
            visimg = visimg.prev()
          else if parseInt(touch.pageY, 10) < lastY and visimg.nextAll().length > 2
            visimg.next().show()
            visimg.hide()
            visimg.prev().hide()
            visimg = visimg.next()
          return lastY = parseInt(touch.pageY, 10)
      if e.targetTouches.length is 3
        samp++
        e.preventDefault()
        if samp > 20
          samp = 0
          touch = e.touches[1]
          if parseInt(touch.pageY, 10) > lastY and visimg.prev().length > 0
            visimg.prev().show()
            visimg.hide()
            visimg.next().hide()
            visimg = visimg.prev()
          else if parseInt(touch.pageY, 10) < lastY and visimg.nextAll().length > 2
            visimg.next().show()
            visimg.hide()
            visimg.prev().hide()
            visimg = visimg.next()
          return lastY = parseInt(touch.pageY, 10)

rendermd = ->
  $(".md").html ->
    markdown = $(this).siblings(".mdtxt").val()
    converter.makeHtml markdown

getTitle = ->
  pattern = ///
    [^#+] # match the hashes, and ignore them
    .+  #match what comes after the hashes
    ///
  $("#title>.txt>.mdtxt").val().match(pattern)

pageMeta = ->
  json = {}
  json.title = getTitle()
#  json.private = $("#private").is(":checked")
  json.created = $("#created").val()
  json.pagetype = $("#meta_pagetype").html()
  json.nextpage = $("#meta_nextpage").html()
  json.prevpage = $("#meta_prevpage").html()
  json

deletepage = (lastpage) ->
  if lastpage == 'last'
    #alert lastpage
    $.ajax
      type: "DELETE"
      url: "/case/" + $("#meta_cid").html() + "/lastpage"
      statusCode:
        200: ->
          window.location.replace '/cases/0/-1'
  else
    $.ajax
      type: "DELETE"
      url: top.document.location.pathname
      statusCode:
        200: (redir) ->
          #alert(redir)
          window.location.replace redir
#          window.location.replace $("#prevpage").attr("href")

spiderpage = ->
  json = pageMeta()
  json.radios = $(".radio").map(->
    radio = {}
    radio.id = $(this).attr("id")
    radio.caption = $(this).children(".caption").children(".mdtxt").val()
    radio
  ).get()
  json.texts = $("#texts>.text>.txt>.mdtxt").map(->
    text = {}
    text.val = $(this).val()
    text.caption = $(this).closest(".text").find(".toggletext>.txt>.mdtxt").val()
    text
  ).get()
  if(!json.texts)
    json.texts = [""]
  json.modalities = $(".modality:checked").map(->
    $(this).val()
  ).get()
  json.description = $(".description:checked").map(->
    $(this).val()
  ).get()
  json.language = $("input:radio[name=language]:checked").val()
  json.icds = $(".ICDCode>.icdt").map(->
    icd = {}
    icd.code = $(this).text()
    icd
  ).get()
  if(!json.icds)
    json.icds = [""]
  #alert JSON.stringify json
  json

sessionButton = (user) ->
  $("#session").html "<button id=\"sign_out\">Sign out " + user + "</button>"

converter = Markdown.getSanitizingConverter()

authcallback = (data) ->
  #alert data
  $.ajax
    url: "/signed_in"
    statusCode:
      500: ->
        window.location.pathname = window.location.pathname
      200: ->
        $("#sign_in").attr('id','user_settings').html " \u25c4 " + data.user.username
        #window.location.pathname = window.location.pathname
      403: (data) ->
        alert "not allowed - if you feel that this is an error, please write to info@radioca.se"

savepage = ->
  $.ajax
    type: "PUT"
    url: window.location.pathname
    data: spiderpage()
    statusCode:
      200: (msg) ->
        document.title = "RADIOCA.SE - " + getTitle()
        $('#savepage_dialog').hide()
      403: (data)->
        alert "Cannot save - Maybe your session has timed out?"

$ ->
  rendermd()
  touchscroll()
  $(".stack").children(":first-child").show()
  $('tbody tr').addClass('visible')
  zebrarows('tbody tr:odd td', 'odd')
  #socket = io.connect('http://localhost')
  #socket.on 'uploadprogress', (data) ->
  #  alert data
  #  progress = JSON.parse data
  #  $('#progressbar').innerHTML progress.bytesReceived
  $("thead th.sortable").each (column) ->
    $(this).click ->
      findSortKey = ($cell) ->
        $cell.find('.sort-key').text().toUpperCase() + ' ' + $cell.text().toUpperCase()
      sortDirection = (if $(this).is('.sorted-asc') then -1 else 1)
      
      #step back up the tree and get the rows with data for sorting

      $rows = $(this).parent().parent().parent().find('tbody tr').get()

      #loop through all the rows and find
      $.each $rows, (index, row) ->
        row.sortKey = findSortKey($(row).children('td').eq(column))

      #compare and sort the rows alphabetically
      $rows.sort (a,b) ->
        return -sortDirection if a.sortKey < b.sortKey
        return sortDirection if a.sortKey > b.sortKey
        0

      #add the rows in the correct order to the bottom of the table
      $.each $rows, (index, row) ->
        $('tbody').append row
        row.sortKey = null

      #identify the column sort order
      $('th').removeClass('sorted-asc sorted-desc')
      $sortHead = $('th').filter(':nth-child(' + (column + 1) + ')')
      (if sortDirection is 1 then $sortHead.addClass("sorted-asc") else $sortHead.addClass("sorted-desc"))

      #identify the column to be sorted by
      $("td").removeClass("sorted").filter(":nth-child(" + (column + 1) + ")").addClass "sorted"

      $(".visible td").removeClass "odd"
      zebrarows ".visible:even td", "odd"

  $(document
  
  ).on("mouseover", ".control", ->
    #alert $(this).attr('src').slice(-7,-1)
    if $(this).attr('src').slice(-7,-1) == '_bw.pn'
      $(this).attr 'src', $(this).attr('src').slice(0,-7) + '.png'

  ).on("mouseout", ".control", ->
    #alert $(this).attr('src').slice(-7,-1)
    unless $(this).attr('src').slice(-7,-1) == '_bw.pn'
      $(this).attr 'src', $(this).attr('src').slice(0,-4) + '_bw.png'

  ).on("dblclick", ".radio", ->
    if ($("#maximized").is(":visible")) then minimizeradio($(this)) else maximizeradio($(this))
  
  ).on("click", "#newcase", ->
    $('#newcase_dialog').toggle()

  ).on("click", "#newcase_cancel", ->
    $('#newcase_dialog').hide()

  ).on("click", ".maximizeradio", ->
    maximizeradio($(this).parent())
    
  ).on("click", ".minimizeradio", ->
    minimizeradio($(this).parent())

  ).on("click", ".completed", ->
    $(this).removeClass('completed')
    $(this).addClass('rmcompleted')
    $(this).attr('src', '/static/ico/ui-color-picker.png')
    $.ajax
      type: "POST"
      url: "/completed/" + $(this).attr("ID")

  ).on("click", ".Cancel", ->
    $(this).parent().hide()
    $('.selected').removeClass('selected')
    $('.selectedtext').removeClass('selectedtext')

  ).on("click", ".rmcompleted", ->
    $(this).removeClass('rmcompleted')
    $(this).addClass('completed')
    $(this).attr('src', '/static/ico/ui-color-picker-tick.png')
    $.ajax
      type: "POST"
      url: "/rmcompleted/" + $(this).attr("ID")
    
  ).on("click", ".bookmark", ->
    star = $(this)
    $.ajax
      type: "POST"
      url: "/bookmark/" + $(this).attr("ID")
      statusCode:
        200: ->
          star.addClass('rmbookmark')
          star.removeClass('bookmark')
          star.attr('src', '/static/ico/star.png')
        444: ->
          alert "Error, are you logged in?"

  ).on("click", ".rmbookmark", ->
    star = $(this)
    $.ajax
      type: "POST"
      url: "/rmbookmark/" + $(this).attr("ID")
      statusCode:
        200: ->
          star.addClass('bookmark')
          star.removeClass('rmbookmark')
          star.attr('src','/static/ico/star-empty.png')
        444: ->
          alert "Error, are you logged in?"
          
  ).on("keyup", "#icd_req", (event) ->
    if (event.keyCode == 27 || $(this).val() == '')
      $(this).val('')
      $("#icd_res").html ""
    else
      icdquery2 = $(this).val().split("\ ")
      if icdquery != icdquery2[0]
        icdquery = icdquery2[0]
        icdqueryPropercase = icdquery.charAt(0).toUpperCase() + icdquery.substr(1)
        $("#icd_res").html ""
        findICD icdquery
        findICD icdqueryPropercase
      $('.icdcode').addClass('visible')
      icdquery2.forEach (query) ->
        filter2('.icdcode', query)

  ).on("click", "#chooseICD", ->
    $("#icd").append("<div class='ICDCode'><a class='icdt'>" + $("#icd_req").val() + "</a><img class='removeICD control' src='/static/ico/small_minus_bw.png'></a></div><br>")

  ).on("click", ".removeICD", ->
    $(this).parent().remove()

  ).on("click", ".icdt", ->
    $("#icd_res").html ""
    $('#icd_req').val($(this).parent().text())
    findICD $(this).text()
    #$('#icd_req').keyup()

  ).on("click", "#toggleDiagnosis", ->
    $('.diagnosis').toggleClass('invisible')
    if $('.diagnosis').hasClass 'invisible'
      $(this).text ">"
#      if isiPhone()
#        changeZoomLevel "320"
    else
        $(this).text "<"
#      if isiPhone()
#        changeZoomLevel "320"

  ).on("focus", "#filter", ->
    if $(this).val()=='Type to filter' then $(this).val('')

  ).on("keyup", "#filter", (event) ->
    # if esc is pressed or nothing is entered 
    if (event.keyCode == 27 || $(this).val() == '')
      # if esc is pressed we want to clear the value of search box
      $(this).val('')
      # we want each row to be visible because if nothing is entered then all rows are matched
      $('tbody tr').removeClass('visible').show().addClass('visible')
      #zebrarows('tbody tr:odd td', 'odd')
    # if there is text, let's filter
    else
      #$('tbody tr').removeClass('visible').show().addClass('visible')
      $('tbody tr').addClass('visible')
      querys = $(this).val().split("\ ")
      #console.log querys
      querys.forEach (query) ->
        filter2('tbody tr.visible', query )
        #zebrarows ".visible:even td", "odd"

  ).on("click", ".textedit", ->
    src = if $(this).attr('src') == '/static/ico/pencil.png' then '/static/ico/tick.png' else '/static/ico/pencil.png'
    $(this).attr('src', src)
    $(this).siblings(".mdtxt").toggle().focus().autogrow()
    $(this).siblings(".md").toggle()
    rendermd()

  ).on("blur", ".mdtxt", ->
    event.preventDefault()
  
  ).on("mousewheel", ".stack", (e, delta) ->
    image = $(this).find('.stack_image:visible')
    if delta > 0 and image.nextAll().length > 2
      image.next().show()
      image.hide()
    else if delta < 0 and image.prev().length > 0
      image.prev().show()
      image.hide()
    return false

  ).on("click", "#user_settings", ->
    #$("#sign_out").toggle("slide", {direction: "right"}, 200)
    $("#sign_out").toggle()

  ).on("click", "#sign_in", ->
    (openEasyOAuthBox "twitter", authcallback)

  ).on("click", "#sign_out", ->
    window.open "http://twitter.com/#!/logout"
    $.ajax
      url: "/sign_out"
      statusCode:
        200: ->
          $("#usercontrols").html "<a class=\"session\" id=\"sign_in\"><img src=\"/static/img/sign-in-with-twitter-d.png\"></a>"
          window.location.href = window.location.href

      $("#userinfo").hide()

  ).on("click", "#boxit", ->
    $("#boxit_dialog").toggle()

  ).on("click", "#newpage", ->
    $("#newpage_dialog").show()

  ).on("click", "#newpage_cancel", ->
    $("#newpage_dialog").hide()

  ).on("click", "#newpage_standard", ->
    newpage("standardpage")

  ).on("click", "#newpage_image", ->
    newpage("imagepage")

  ).on("click", "#newpage_text", ->
    newpage("textpage")

  ).on("click", "#casestandardpage", ->
    newcase("standardpage")

  ).on("click", "#casetextpage", ->
    newcase("textpage")

  ).on("click", "#caseimagepage", ->
    newcase("imagepage")
    
  ).on("click", "#createcase", ->
    json = {}
    json.title = $("#title").val()
    json.listed = $("#listed").is(":checked")
    json.icd = $("#icd").val()
    $.ajax
      url: "/newcase"
      type: "POST"
      data: json
      statusCode:
        403: ->
          alert "Forbidden - are you logged in?"
        200: (url) ->
          document.location = url

  ).on("click", "#savepage", ->
    $("#savepage_dialog").toggle()

  ).on("click", "#savepage_confirm", ->
    savepage()
  
  ).on("click", "#savepage_cancel", ->
    $("#savepage_dialog").hide()
    
  ).on("click", "#open", ->
    editfunctions()

  ).on("click", "#locked", ->
    editfunctions()

  ).on("click", "#feedbackbutton", ->
    $("#feedbackarea").toggle()
    getfeedback()

  ).on("click", "#feedback_confirm", ->
    feedbackurl = window.location.pathname + '/feedback'
    data = {}
    data.feedback = $("#feedbackbox").val()
    $.ajax
      url: feedbackurl
      type: "POST"
      data: data
      statusCode:
        404: ->
          alert "Page not found"
        200: ->
          getfeedback()
        403: ->
          alert "Forbidden, maybe your session timed out?"
        444: ->
          alert "Error, maybe you're not logged in?"

  ).on("click", "#help", ->
    $("#markdown-help").toggle()

  ).on("change", "#private", ->
    $("#savepage_confirm").trigger('click')

  ).on("click", "#private_page", ->
    if $("#private").is(':checked') then $("#private").attr('checked', false) else $("#private").attr('checked', true)

  ).on("click", "#help_cancel", ->
    $("#markdown-help").hide()

  ).on("click", "#deletepage", ->
    $("#deletepage_dialog").toggle()

  ).on("click", "#deletepage_cancel", ->
    $("#deletepage_dialog").hide()

  ).on("click", "#deletepage_confirm", ->
    if $('#nextpage').attr('pageno') == '0' and $('#prevpage').attr('pageno') == '0'
      $('#lastpage_dialog').show()
    else
      deletepage()

  ).on("click", "#lastpage_confirm", ->
    deletepage('last')

  ).on("click", "#cleanupbutton", ->
    $.ajax
      type: "DELETE"
      url: '/sys/deletedcases'
      statusCode:
        200: ->
          alert "OK, cases deleted"

  ).on("click", "#addtext", ->
    $("#addtext_dialog").show()

  ).on("click", "#togglabletext", ->
    $("<div class='text'>
        <a class='toggletext'>
          <div class='txt'>
            <textarea class='mdtxt' style='display:none'>Toggle textarea</textarea>
            <div class='md'></div>
            <img src='/static/ico/pencil_bw.png' class='control textedit session' style='display: inline'>
          </div>
        </a>
        <div class='txt invisible togglable'>
          <textarea class='mdtxt' style='display:none'></textarea>
          <div class='md'></div>
          <img src='/static/ico/pencil_bw.png' class='control textedit session' style='display: inline'>
        </div>
       </div>
      <br>").insertBefore "#addtext"
    $(this).parent().hide()
    rendermd()

  ).on("click", ".deletetext", ->
    $(this).parent().parent().addClass "selectedtext"
    $("#deletetext_dialog").show()

  ).on("click", "#deletetext_confirm", ->
    #$(".selectedtext").prev().remove()
    $(".selectedtext").remove()
    $("#deletetext_dialog").hide()

  ).on("click", ".toggletext", ->
    $(this).next().toggleClass('invisible')
  
  ).on("click", ".postdcm", ->
    $(this).parent().parent().addClass "selected"
    $("#adddcm_dialog").show()
 
  ).on("click", "#adddcm_confirm", ->
    $("#adddcm_dialog").hide()
    #alert "/dicom" + document.location.pathname + "/" + $(".selected").attr("ID")
    dicom = $("#userFileDcm").val()
    #alert dicom
    #alert document.location
    $("#uploadformdcm").attr
      action: "/dicom" + document.location.pathname + "/" + $(".selected").attr("ID")
      method: "POST"
      dicom: dicom
      enctype: "multipart/form-data"
      encoding: "multipart/form-data"
      target: "postdcm"
      statusCode:
        200: ->
          alert "Upload Done"
        444: ->
          alert "Server dropped connection - are you logged in?"
        500 :->
          alert "Internal server error - maybe the server is busy"
          

    $("#uploadformdcm").submit()
    $(".selected").removeClass "selected"

  ).on("click", ".getdicom", (e) ->
    thisurl = $(this).attr('href')
    $.ajax
      action: thisurl
      method: "GET"
      statusCode:
        200: ->
          $("#getdcm").attr("src",thisurl)
        444: ->
          return alert "DICOM cannot be downloaded - are you logged in?"
    return false

  ).on("click", "#addstack", ->
    $("#addstack_dialog").show()

  ).on("click", "#addstack_confirm", ->
    $("#addstack_dialog").hide()
    userFile = $("#userfile").val()
    $("#uploadform").attr
      action: "/image/" + $("#meta_cid").html() + "/" + $("#meta_page").html()
      method: "POST"
      userfile: userFile
      enctype: "multipart/form-data"
      encoding: "multipart/form-data"
      target: "postframe"

    $("#uploadform").submit()
    d = new Date().getTime().toString()
    $("<div class=\"radio\" id=\"temp" + d + "\"><div class=\"stack\"></div>" + "<div class=\"caption\">" + "<textarea class=\"mdtxt\" style=\"display:none\">" + "edit caption </textarea>" + "<div class=\"md\"></div></div></div>").insertBefore "#addstack"
    rendermd()
    $(".radio:last", top.document).append $("<img class=\"control removeradio\" src=\'/static/ico/cross.png\'>")
    $(".caption:last", top.document).append $("<img class=\"control textedit\" src=\'/static/ico/pencil.png\' style=\'display:inline\'>")

  ).on("click", ".hidecase", ->
    targeturl = "/hide/" + $(this).attr("ID")
    $(this).addClass("showcase")
    $(this).removeClass("hidecase")
    $(this).attr('src', '/static/ico/eye-prohibition.png')
    $.ajax
      url: targeturl
      type: "POST"

  ).on("click", ".showcase", ->
    targeturl = "/show/" + $(this).attr("ID")
    $(this).addClass("hidecase")
    $(this).removeClass("showcase")
    $(this).attr('src', '/static/ico/eye.png')
    $.ajax
      url: targeturl
      type: "POST"

  ).on("click", ".deletecase", ->
    $(this).parent().parent().addClass "selected"
    $("#deletecase_dialog").show()

  ).on("click", "#deletecase_cancel", ->
    $(".selected").removeClass "selected"
    $("#deletecase_dialog").hide()

  ).on("click", "#deletecase_confirm", ->
    targeturl = "/case/" + $(".selected").attr("ID")
    $.ajax
      url: targeturl
      type: "DELETE"
      statusCode:
        200: ->
          window.location.href = window.location.href
        405: ->
          alert "NOT ALLOWED"
          $(".selected").removeClass "selected"
          $("#deletecase_dialog").hide()
  
  ).on("click", ".moveradioup", ->
    if $(this).parent().parent().prev().length
      $(this).parent().parent().insertBefore($(this).parent().parent().prev())
      $(this).trigger "mouseout"

  ).on("click", ".moveradiodown", ->
    if $(this).parent().parent().next().length
      $(this).parent().parent().insertAfter($(this).parent().parent().next())
      $(this).trigger "mouseout"
  
  ).on("click", ".removeradio", ->
    $(this).parent().addClass "selected"
    $("#removeradio_dialog").show()

  ).on("click", "#removeradio_cancel", ->
    $(".selected").removeClass "selected"
    $("#removeradio_dialog").hide()

  ).on("click", "#removeradio_confirm", ->
    pathname = window.location.pathname.split("/")
    targeturl = "/case/" + pathname[2] + "/" + pathname[3] + "/" + $(".selected").attr("ID")
    $.ajax
      url: targeturl
      type: "DELETE"
      statusCode:
        200: ->
          $(".selected").remove()
          $("#removeradio_dialog").hide()
        404: ->
          alert "NOT FOUND"
          $(".selected").removeClass "selected"
          $("#removeradio_dialog").hide()
        403: ->
          alert "FORBIDDEN"
          $(".selected").removeClass "selected"
          $("#removeradio_dialog").hide()
  )

  $('#putdcm').bind('load', ->
    radioID = $("iframe")[2].contentDocument.body.innerHTML
    alert radioID
  )

  $('#postframe').bind('load', -> #for some reason this could not be changed to an 'on' event - working with bind though
    alert "radio uploaded!"
    radioID = $("#postframe")[0].contentDocument.body.innerHTML
    $(".radio:last", top.document).attr "ID", radioID
    $.ajax
      type: "GET"
      url: "/radio/" + radioID
      statusCode:
        200: (data) ->
          $(".stack:last", top.document).html data
          $(".stack:last", top.document).children(":first").show()
          #scrollfunction_mw()
          touchscroll()
  )

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

  jQuery.fn.autoGrow = ->
    @each ->
      colsDefault = @cols
      rowsDefault = @rows
      grow = ->
        growByRef this
      growByRef = (obj) ->
        linesCount = 0
        lines = obj.value.split("\n")
        i = lines.length - 1
        while i >= 0
          linesCount += Math.floor((lines[i].length / colsDefault) + 1)
          --i
        if linesCount >= rowsDefault
          obj.rows = linesCount + 1
        else
          obj.rows = rowsDefault
      characterWidth = (obj) ->
        characterWidth = 0
        temp1 = 0
        temp2 = 0
        tempCols = obj.cols
        obj.cols = 1
        temp1 = obj.offsetWidth
        obj.cols = 2
        temp2 = obj.offsetWidth
        characterWidth = temp2 - temp1
        obj.cols = tempCols
        characterWidth
      @style.width = "auto"
      @style.height = "auto"
      @style.overflow = "hidden"
      @style.width = ((characterWidth(this) * @cols) + 6) + "px"
      @onkeyup = grow
      @onfocus = grow
      @onblur = grow
      growByRef this
