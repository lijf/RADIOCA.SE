(function() {
  var authcallback, change_url, converter, editfunctions, filter2, getTitle, getfeedback, lastY, newcase, newpage, pageMeta, rendermd, samp, savepage, sessionButton, spiderpage, touchscroll, visimg, zebrarows;

  lastY = 0;

  samp = 0;

  visimg = $(".stack_image");

  change_url = function(url) {
    return document.location = url;
  };

  newpage = function(type) {
    var json;
    json = {};
    json.title = getTitle();
    json.private = $("#private").is(":checked");
    json.created = $("#created").val();
    json.pagetype = type;
    json.modalities = $(".modality:checked").map(function() {
      return $(this).val();
    }).get();
    json.description = $(".description:checked").map(function() {
      return $(this).val();
    }).get();
    return $.ajax({
      url: window.location.pathname + "/newpage",
      type: "POST",
      data: json,
      statusCode: {
        404: function() {
          return alert("Page not found");
        },
        200: function(url) {
          $("#save").trigger("click");
          return document.location.href = url;
        },
        403: function() {
          return alert("Forbidden, no new page created");
        }
      }
    });
  };

  newcase = function(type) {
    var json;
    json = {};
    json.pagetype = type;
    json.title = "untitled";
    return $.ajax({
      url: "/newcase",
      type: "POST",
      data: json,
      statusCode: {
        403: function() {
          return alert("Forbidden - are you logged in?");
        },
        200: function(url) {
          return document.location = url;
        }
      }
    });
  };

  editfunctions = function() {
    $('#locked').toggle();
    $('#open').toggle();
    $('.removeradio').toggle();
    $(".textedit").toggle();
    $("#addstack").toggle();
    $("#controls").toggle();
    $(".moveradioup").toggle();
    $(".moveradiodown").toggle();
    $("#boxit_dialog").hide();
    return $("#addstack_dialog").hide();
  };

  zebrarows = function(selector, className) {
    return $(selector).removeClass(className).addClass(className);
  };

  filter2 = function(selector, query) {
    query = $.trim(query);
    query = query.replace(/\ /gi, '|');
    return $(selector).each(function() {
      if ($(this).text().search(new RegExp(query, "i")) < 0) {
        return $(this).hide().removeClass('visible');
      } else {
        return $(this).show().addClass('visible');
      }
    });
  };

  getfeedback = function() {
    return $.ajax({
      type: "GET",
      url: window.location.pathname + '/feedback',
      statusCode: {
        200: function(data) {
          return $("#feedbacktext").html(data);
        },
        403: function() {
          return document.location = '/';
        }
      }
    });
  };

  touchscroll = function() {
    return $(".stack > .stack_image").each(function() {
      this.ontouchstart = function(e) {
        return visimg = $(this);
      };
      return this.ontouchmove = function(e) {
        var touch;
        if (e.targetTouches.length === 1) {
          samp++;
          if (samp === 3) {
            samp = 0;
            touch = e.touches[0];
            if (parseInt(touch.pageY, 10) > lastY && visimg.prev().length > 0) {
              visimg.prev().show();
              visimg.next().hide();
              visimg.hide();
              visimg = visimg.prev();
            } else if (visimg.next().length > 0) {
              visimg.next().show();
              visimg.prev().hide();
              visimg.hide();
              visimg = visimg.next();
            }
            return lastY = parseInt(touch.pageY, 10);
          }
          return e.preventDefault();
        }
      };
    });
  };

  rendermd = function() {
    return $(".md").html(function() {
      var markdown;
      markdown = $(this).siblings(".mdtxt").val();
      return converter.makeHtml(markdown);
    });
  };

  getTitle = function() {
    var pattern;
    pattern = /[^#+].+/;
    return $("#title>.txt>.mdtxt").val().match(pattern);
  };

  pageMeta = function() {
    var json;
    json = {};
    json.title = getTitle();
    json.private = $("#private").is(":checked");
    json.created = $("#created").val();
    return json;
  };

  spiderpage = function() {
    var json;
    json = pageMeta();
    json.radios = $(".radio").map(function() {
      var radio;
      radio = {};
      radio.id = $(this).attr("id");
      radio.caption = $(this).children(".caption").children(".mdtxt").val();
      return radio;
    }).get();
    json.texts = $("#texts>.txt>.mdtxt").map(function() {
      return $(this).val();
    }).get();
    json.modalities = $(".modality:checked").map(function() {
      return $(this).val();
    }).get();
    json.description = $(".description:checked").map(function() {
      return $(this).val();
    }).get();
    json.language = $("input:radio[name=language]:checked").val();
    return json;
  };

  sessionButton = function(user) {
    return $("#session").html("<button id=\"sign_out\">Sign out " + user + "</button>");
  };

  converter = Markdown.getSanitizingConverter();

  authcallback = function(data) {
    return $.ajax({
      url: "/signed_in",
      statusCode: {
        200: function() {
          return $("#session").html("<a class=\"session\" id=\"user_settings\">" + data.user.username + " ▼ </a>");
        },
        403: function(data) {
          return alert("not allowed - if you feel that this is an error, please write to info@radioca.se");
        }
      }
    });
  };

  savepage = function() {
    return $.ajax({
      type: "PUT",
      url: window.location.pathname,
      data: spiderpage(),
      statusCode: {
        200: function(msg) {
          document.title = "RADIOCA.SE - " + getTitle();
          return $('#savepage_dialog').hide();
        },
        403: function(data) {
          return alert("Cannot save - Maybe your session has timed out?");
        }
      }
    });
  };

  $(function() {
    rendermd();
    touchscroll();
    $(".stack").children(":first-child").show();
    $('tbody tr').addClass('visible');
    zebrarows('tbody tr:odd td', 'odd');
    $(document).on("click", ".bookmark", function() {
      $(this).removeClass('bookmark');
      $(this).addClass('rmbookmark');
      $(this).attr('src', '/icons/bookmark.png');
      return $.ajax({
        type: "POST",
        url: "/bookmark/" + $(this).attr("ID")
      });
    }).on("click", ".rmbookmark", function() {
      $(this).removeClass('rmbookmark');
      $(this).addClass('bookmark');
      $(this).attr('src', '/icons/bookmark_bw.png');
      return $.ajax({
        type: "POST",
        url: "/rmbookmark/" + $(this).attr("ID")
      });
    }).on("focus", "#filter", function() {
      if ($(this).val() === 'Type to filter') return $(this).val('');
    }).on("keyup", "#filter", function() {
      if (event.keyCode === 27 || $(this).val() === '') {
        $(this).val('');
        return $('tbody tr').removeClass('visible').show().addClass('visible');
      } else {
        return filter2('tbody tr', $(this).val());
      }
    }).on("click", ".textedit", function() {
      var src;
      src = $(this).attr('src') === '/icons/pencil.png' ? '/icons/tick.png' : '/icons/pencil.png';
      $(this).attr('src', src);
      $(this).siblings(".mdtxt").toggle().focus().autogrow();
      $(this).siblings(".md").toggle();
      return rendermd();
    }).on("blur", ".mdtxt", function() {
      return event.preventDefault();
    }).on("mousewheel", ".stack > .stack_image", function(e) {
      var delta;
      delta = e.originalEvent.detail;
      if (!delta) delta = e.originalEvent.wheelDelta;
      if (delta > 0 && $(this).next().length > 0) {
        $(this).next().show();
        $(this).hide();
        $(this).prev().hide();
      } else if (delta < 0 && $(this).prev().length > 0) {
        $(this).prev().show();
        $(this).hide();
        $(this).next().hide();
      }
      return e.preventDefault();
    }).on("click", "#user_settings", function() {
      return $("#userinfo").toggle();
    }).on("click", "#sign_in", function() {
      return openEasyOAuthBox("twitter", authcallback);
    }).on("click", "#sign_out", function() {
      window.open("http://twitter.com/#!/logout");
      $.ajax({
        url: "/sign_out",
        statusCode: {
          200: function(data) {
            return window.location.href = '/';
          }
        }
      });
      return $("#userinfo").hide();
    }).on("click", "#boxit", function() {
      return $("#boxit_dialog").toggle();
    }).on("click", "#newpage", function() {
      return $("#newpage_dialog").show();
    }).on("click", "#newpage_cancel", function() {
      return $("#newpage_dialog").hide();
    }).on("click", "#newpage_standard", function() {
      return newpage("standardpage");
    }).on("click", "#newpage_image", function() {
      return newpage("imagepage");
    }).on("click", "#newpage_text", function() {
      return newpage("textpage");
    }).on("click", "#newcase", function() {
      var json;
      json = {};
      json.title = "Untitled";
      return $.ajax({
        url: "/newcase",
        type: "POST",
        data: json,
        statusCode: {
          403: function() {
            return alert("Forbidden - are you logged in?");
          },
          200: function(url) {
            return document.location = url;
          }
        }
      });
    }).on("click", "#casestandardpage", function() {
      return newcase("standardpage");
    }).on("click", "#casetextpage", function() {
      return newcase("textpage");
    }).on("click", "#caseimagepage", function() {
      return newcase("imagepage");
    }).on("click", "#createcase", function() {
      var json;
      json = {};
      json.title = $("#title").val();
      json.listed = $("#listed").is(":checked");
      json.icd = $("#icd").val();
      return $.ajax({
        url: "/newcase",
        type: "POST",
        data: json,
        statusCode: {
          403: function() {
            return alert("Forbidden - are you logged in?");
          },
          200: function(url) {
            return document.location = url;
          }
        }
      });
    }).on("click", "#savepage", function() {
      return $("#savepage_dialog").toggle();
    }).on("click", "#savepage_confirm", function() {
      return savepage();
    }).on("click", "#savepage_cancel", function() {
      return $("#savepage_dialog").hide();
    }).on("click", "#open", function() {
      return editfunctions();
    }).on("click", "#locked", function() {
      return editfunctions();
    }).on("click", "#feedbackbutton", function() {
      $("#feedbackarea").toggle();
      return getfeedback();
    }).on("click", "#feedback_confirm", function() {
      var data, feedbackurl;
      feedbackurl = window.location.pathname + '/feedback';
      data = {};
      data.feedback = $("#feedbackbox").val();
      return $.ajax({
        url: feedbackurl,
        type: "POST",
        data: data,
        statusCode: {
          404: function() {
            return alert("Page not found");
          },
          200: function() {
            return getfeedback();
          },
          403: function() {
            return alert("Forbidden, maybe your session timed out?");
          }
        }
      });
    }).on("click", "#help", function() {
      return $("#markdown-help").toggle();
    }).on("change", "#private", function() {
      return $("#savepage_confirm").trigger('click');
    }).on("click", "#private_page", function() {
      if ($("#private").is(':checked')) {
        return $("#private").attr('checked', false);
      } else {
        return $("#private").attr('checked', true);
      }
    }).on("click", "#help_cancel", function() {
      return $("#markdown-help").hide();
    }).on("click", "#deletepage", function() {
      return $("#deletepage_dialog").toggle();
    }).on("click", "#deletepage_cancel", function() {
      return $("#deletepage_dialog").hide();
    }).on("click", "#deletepage_confirm", function() {
      return $.ajax({
        type: "DELETE",
        url: top.document.location.pathname,
        statusCode: {
          200: function() {
            return window.location.replace($("#prevpage").attr("href"));
          }
        }
      });
    }).on("click", "#cleanupbutton", function() {
      return $.ajax({
        type: "DELETE",
        url: '/sys/deletedcases',
        statusCode: {
          200: function() {
            return alert("OK, cases deleted");
          }
        }
      });
    }).on("click", "#addstack", function() {
      return $("#addstack_dialog").show();
    }).on("click", "#addstack_cancel", function() {
      event.preventDefault();
      return $("#addstack_dialog").hide();
    }).on("click", "#addstack_confirm", function() {
      var userFile;
      $("#addstack_dialog").hide();
      userFile = $("#userfile").val();
      $("#uploadform").attr({
        action: "/image/" + $("#meta_cid").html() + "/" + $("#meta_page").html(),
        method: "POST",
        userfile: userFile,
        enctype: "multipart/form-data",
        encoding: "multipart/form-data",
        target: "postframe"
      });
      $("#uploadform").submit();
      $("<div class=\"radio\"><div class=\"stack\"></div>" + "<div class=\"caption\">" + "<textarea class=\"mdtxt\" style=\"display:none\">" + "edit caption </textarea>" + "<div class=\"md\"></div></div></div>").insertBefore("#addstack");
      rendermd();
      $(".radio:last", top.document).append($("<img class=\"control removeradio\" src=\'/icons/cross.png\'>"));
      return $(".caption:last", top.document).append($("<img class=\"control textedit\" src=\'/icons/pencil.png\' style=\'display:inline\'>"));
    }).on("click", ".hidecase", function() {
      var targeturl;
      targeturl = "/hide/" + $(this).attr("ID");
      $(this).addClass("showcase");
      $(this).removeClass("hidecase");
      $(this).attr('src', '/icons/eye-prohibition.png');
      return $.ajax({
        url: targeturl,
        type: "POST"
      });
    }).on("click", ".showcase", function() {
      var targeturl;
      targeturl = "/show/" + $(this).attr("ID");
      $(this).addClass("hidecase");
      $(this).removeClass("showcase");
      $(this).attr('src', '/icons/eye.png');
      return $.ajax({
        url: targeturl,
        type: "POST"
      });
    }).on("click", ".deletecase", function() {
      $(this).parent().parent().addClass("selected");
      return $("#deletecase_dialog").show();
    }).on("click", "#deletecase_cancel", function() {
      $(".selected").removeClass("selected");
      return $("#deletecase_dialog").hide();
    }).on("click", "#deletecase_confirm", function() {
      var targeturl;
      targeturl = "/case/" + $(".selected").attr("ID");
      return $.ajax({
        url: targeturl,
        type: "DELETE",
        statusCode: {
          200: function() {
            return window.location.href = window.location.href;
          },
          405: function() {
            alert("NOT ALLOWED");
            $(".selected").removeClass("selected");
            return $("#deletecase_dialog").hide();
          }
        }
      });
    }).on("click", ".moveradioup", function() {
      return $(this).parent().insertBefore($(this).parent().prev());
    }).on("click", ".moveradiodown", function() {
      return $(this).parent().insertAfter($(this).parent().next());
    }).on("click", ".removeradio", function() {
      $(this).parent().addClass("selected");
      return $("#removeradio_dialog").show();
    }).on("click", "#removeradio_cancel", function() {
      $(".selected").removeClass("selected");
      return $("#removeradio_dialog").hide();
    }).on("click", "#removeradio_confirm", function() {
      var pathname, targeturl;
      pathname = window.location.pathname.split("/");
      targeturl = "/case/" + pathname[2] + "/" + pathname[3] + "/" + $(".selected").attr("ID");
      return $.ajax({
        url: targeturl,
        type: "DELETE",
        statusCode: {
          200: function() {
            $(".selected").remove();
            return $("#removeradio_dialog").hide();
          },
          404: function() {
            alert("NOT FOUND");
            $(".selected").removeClass("selected");
            return $("#removeradio_dialog").hide();
          },
          403: function() {
            alert("FORBIDDEN");
            $(".selected").removeClass("selected");
            return $("#removeradio_dialog").hide();
          }
        }
      });
    });
    $('#postframe').bind('load', function() {
      var radioID;
      radioID = $("iframe")[1].contentDocument.body.innerHTML;
      $(".radio:last", top.document).attr("ID", radioID);
      return $.ajax({
        type: "GET",
        url: "/radio/" + radioID,
        statusCode: {
          200: function(data) {
            $(".stack:last", top.document).html(data);
            $(".stack:last", top.document).children(":first").show();
            return touchscroll();
          }
        }
      });
    });
    $.fn.autogrow = function(options) {
      this.filter("textarea", top.document).each(function() {
        var $this, lineHeight, minHeight, shadow, update;
        $this = $(this);
        minHeight = $this.height();
        lineHeight = $this.css("lineHeight");
        shadow = $("<div></div>").css({
          position: "absolute",
          top: -10000,
          left: -10000,
          width: $(this).width() - parseInt($this.css("paddingLeft")) - parseInt($this.css("paddingRight")),
          fontSize: $this.css("fontSize"),
          fontFamily: $this.css("fontFamily"),
          lineHeight: $this.css("lineHeight"),
          resize: "none"
        }).appendTo(document.body);
        update = function() {
          var times, val;
          times = function(string, number) {
            var i, r;
            i = 0;
            r = "";
            while (i < number) {
              r += string;
              i++;
            }
            return r;
          };
          val = this.value.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;").replace(/\n$/, "<br/>&nbsp;").replace(/\n/g, "<br/>").replace(RegExp(" {2,}", "g"), function(space) {
            return times("&nbsp;", space.length - 1) + " ";
          });
          shadow.html(val);
          return $(this).css("height", Math.max(shadow.height() + 20, minHeight));
        };
        $(this).change(update).keyup(update).keydown(update);
        return update.apply(this);
      });
      return this;
    };
    return jQuery.fn.autoGrow = function() {
      return this.each(function() {
        var characterWidth, colsDefault, grow, growByRef, rowsDefault;
        colsDefault = this.cols;
        rowsDefault = this.rows;
        grow = function() {
          return growByRef(this);
        };
        growByRef = function(obj) {
          var i, lines, linesCount;
          linesCount = 0;
          lines = obj.value.split("\n");
          i = lines.length - 1;
          while (i >= 0) {
            linesCount += Math.floor((lines[i].length / colsDefault) + 1);
            --i;
          }
          if (linesCount >= rowsDefault) {
            return obj.rows = linesCount + 1;
          } else {
            return obj.rows = rowsDefault;
          }
        };
        characterWidth = function(obj) {
          var temp1, temp2, tempCols;
          characterWidth = 0;
          temp1 = 0;
          temp2 = 0;
          tempCols = obj.cols;
          obj.cols = 1;
          temp1 = obj.offsetWidth;
          obj.cols = 2;
          temp2 = obj.offsetWidth;
          characterWidth = temp2 - temp1;
          obj.cols = tempCols;
          return characterWidth;
        };
        this.style.width = "auto";
        this.style.height = "auto";
        this.style.overflow = "hidden";
        this.style.width = ((characterWidth(this) * this.cols) + 6) + "px";
        this.onkeyup = grow;
        this.onfocus = grow;
        this.onblur = grow;
        return growByRef(this);
      });
    };
  });

}).call(this);
