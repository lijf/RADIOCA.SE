#these variables are for touchscroll,
lastY = 0
samp = 0
visimg = $(".stack_image")

change_url = (url) ->
  document.location = url

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
        alert "Forbidden - are you logged in?"
      200: (url) ->
        document.location = url

editfunctions = ->
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
        
touchscroll = ->
  $(".stack > .stack_image").each ->
    @ontouchstart = (e) ->
      visimg = $(this)
    @ontouchmove = (e) ->
      if e.targetTouches.length is 1
        samp++
        if samp is 3
          samp = 0
          touch = e.touches[0]
          if parseInt(touch.pageY, 10) > lastY and visimg.prev().length > 0
            visimg.prev().show()
            visimg.next().hide()
            visimg.hide()
            visimg = visimg.prev()
          else if visimg.next().length > 0
            visimg.next().show()
            visimg.prev().hide()
            visimg.hide()
            visimg = visimg.next()
          return lastY = parseInt(touch.pageY, 10)
        e.preventDefault()

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
  json.private = $("#private").is(":checked")
  json.created = $("#created").val()
  json

spiderpage = ->
  json = pageMeta()
  json.radios = $(".radio").map(->
    radio = {}
    radio.id = $(this).attr("id")
    radio.caption = $(this).children(".caption").children(".mdtxt").val()
    radio
  ).get()
  json.texts = $("#texts>.txt>.mdtxt").map(->
    $(this).val()
  ).get()
  json.modalities = $(".modality:checked").map(->
    $(this).val()
  ).get()
  json.description = $(".description:checked").map(->
    $(this).val()
  ).get()
  json.language = $("input:radio[name=language]:checked").val() 
  #  alert JSON.stringify json
  json

sessionButton = (user) ->
  $("#session").html "<button id=\"sign_out\">Sign out " + user + "</button>"

converter = Markdown.getSanitizingConverter()

authcallback = (data) ->
  $.ajax
    url: "/signed_in"
    statusCode:
      200: ->
        $("#session").html "<a class=\"session\" id=\"user_settings\">" + data.user.username + " ▼ </a>"
        #$("#feedbackbutton").attr("id", "editbutton").html "Edit"
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

    touchscroll()
    $(".stack").children(":first-child").show()
    $('tbody tr').addClass('visible')
    zebrarows('tbody tr:odd td', 'odd')

  $(document
  
  
  ).on("click", ".bookmark", ->
    $(this).removeClass('bookmark')
    $(this).addClass('rmbookmark')
    $(this).attr('src', '/icons/bookmark.png')
    $.ajax
      type: "POST"
      url: "/bookmark/" + $(this).attr("ID")

  ).on("click", ".rmbookmark", ->
    $(this).removeClass('rmbookmark')
    $(this).addClass('bookmark')
    $(this).attr('src','/icons/bookmark_bw.png')
    $.ajax
      type: "POST"
      url: "/rmbookmark/" + $(this).attr("ID")
  
  ).on("focus", "#filter", ->
    if $(this).val()=='Type to filter' then $(this).val('')

  ).on("keyup", "#filter", (event) ->
    # if esc is pressed or nothing is entered 
    if (event.keyCode == 27 || $(this).val() == '')
      # if esc is pressed we want to clear the value of search box
      $(this).val('')
      # we want each row to be visible because if nothing is entered then all rows are matched
      $('tbody tr').removeClass('visible').show().addClass('visible')
    # if there is text, let's filter
    else
      #$('tbody tr').removeClass('visible').show().addClass('visible')
      $('tbody tr').addClass('visible')
      querys = $(this).val().split("\ ")
      console.log querys
      querys.forEach (query) ->
        filter2('tbody tr.visible', query )

  ).on("click", ".textedit", ->
    src = if $(this).attr('src') == '/icons/pencil.png' then '/icons/tick.png' else '/icons/pencil.png'
    $(this).attr('src', src)
    $(this).siblings(".mdtxt").toggle().focus().autogrow()
    $(this).siblings(".md").toggle()
    rendermd()

  ).on("blur", ".mdtxt", ->
    event.preventDefault()

  ).on("mousewheel", ".stack > .stack_image", (e) ->
    delta = e.originalEvent.detail
    if !delta
      delta = e.originalEvent.wheelDelta
    if delta > 0 and $(this).next().length > 0
      $(this).next().show()
      $(this).hide()
      $(this).prev().hide()
    else if delta < 0 and $(this).prev().length > 0
      $(this).prev().show()
      $(this).hide()
      $(this).next().hide()
    e.preventDefault()

  ).on("click", "#user_settings", ->
    $("#userinfo").toggle()

  ).on("click", "#sign_in", ->
    openEasyOAuthBox "twitter", authcallback

  ).on("click", "#sign_out", ->
    window.open "http://twitter.com/#!/logout"
    $.ajax
      url: "/sign_out"
      statusCode:
        200: (data) ->
          window.location.href = '/'
          #$("#session").html "<a class=\"session\" id=\"sign_in\">Sign in with twitter</a>"

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

  ).on("click", "#newcase", ->
    json = {}
    json.title = "Untitled"
    $.ajax
      url: "/newcase"
      type: "POST"
      data: json
      statusCode:
        403: ->
          alert "Forbidden - are you logged in?"
        200: (url) ->
          document.location = url

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
    $.ajax
      type: "DELETE"
      url: top.document.location.pathname
      statusCode:
        200: ->
          window.location.replace $("#prevpage").attr("href")

  ).on("click", "#cleanupbutton", ->
    $.ajax
      type: "DELETE"
      url: '/sys/deletedcases'
      statusCode:
        200: ->
          alert "OK, cases deleted"

  ).on("click", "#addstack", ->
    $("#addstack_dialog").show()

  ).on("click", "#addstack_cancel", ->
    event.preventDefault()
    $("#addstack_dialog").hide()

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
    $("<div class=\"radio\"><div class=\"stack\"></div>" + "<div class=\"caption\">" + "<textarea class=\"mdtxt\" style=\"display:none\">" + "edit caption </textarea>" + "<div class=\"md\"></div></div></div>").insertBefore "#addstack"
    rendermd()
    $(".radio:last", top.document).append $("<img class=\"control removeradio\" src=\'/icons/cross.png\'>")
    $(".caption:last", top.document).append $("<img class=\"control textedit\" src=\'/icons/pencil.png\' style=\'display:inline\'>")

  ).on("click", ".hidecase", ->
    targeturl = "/hide/" + $(this).attr("ID")
    $(this).addClass("showcase")
    $(this).removeClass("hidecase")
    $(this).attr('src', '/icons/eye-prohibition.png')
    $.ajax
      url: targeturl
      type: "POST"

  ).on("click", ".showcase", ->
    targeturl = "/show/" + $(this).attr("ID")
    $(this).addClass("hidecase")
    $(this).removeClass("showcase")
    $(this).attr('src', '/icons/eye.png')
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
    $(this).parent().insertBefore($(this).parent().prev())

  ).on("click", ".moveradiodown", ->
    $(this).parent().insertAfter($(this).parent().next())
  
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

  $('#postframe').bind('load', -> #for some reason this could not be changed to an 'on' event - working with bind though
    radioID = $("iframe")[1].contentDocument.body.innerHTML
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