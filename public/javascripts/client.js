(function() {
  var authcallback, change_url, converter, lastY, pageMeta, rendermd, samp, sessionButton, spiderpage, touchscroll;
  change_url = function(url) {
    return document.location = url;
  };
  touchscroll = function() {
    return $(".stack > .stack_image").each(function() {
      var visimg;
      visimg = $(this);
      this.ontouchstart = function(e) {
        return visimg = $(this);
      };
      return this.ontouchmove = function(e) {
        var lastY, samp, touch;
        if (e.targetTouches.length === 1) {
          samp++;
          if (samp === 3) {
            samp = 0;
            touch = e.touches[0];
            if (parseInt(touch.pageY, 10) > lastY && visimg.prev().length > 0) {
              visimg.prev().show();
              visimg.hide();
              visimg.next().hide();
              visimg = visimg.prev();
            } else if (visimg.next().length > 0) {
              visimg.next().show();
              visimg.hide();
              visimg.prev().hide();
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
  pageMeta = function() {
    var json;
    json = {};
    json.title = $("#meta_title").val();
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
      return radio.caption = $(this).children(".caption").children(".mdtxt").val();
    }).get();
    json.texts = $(".txt>.mdtxt").map(function() {
      return $(this).val();
    }).get();
    return json;
  };
  sessionButton = function(user) {
    return $("#session").html("<button id=\"sign_out\">Sign out " + user + "</button>");
  };
  converter = new Showdown.converter();
  lastY = 0;
  samp = 0;
  authcallback = function(data) {
    return $.ajax({
      url: "/signed_in",
      statusCode: {
        200: function() {
          $("#session").html("<a class=\"session\" id=\"user_settings\">" + data.user.username + " ▼ </a>");
          return $("#feedbackbutton").attr("id", "editbutton").html("Edit");
        },
        403: function(data) {
          return alert("not allowed - if you feel that this is an error, please write to info@radioca.se");
        }
      }
    });
  };
  $(function() {
    rendermd();
    touchscroll();
    $(".stack").children(":first-child").show();
    $(document).on("click", ".textedit", function() {
      $(this).siblings(".mdtxt").toggle().focus().autogrow();
      $(this).siblings(".md").toggle();
      rendermd();
      if ($(this).html() === "Edit") {
        return $(this).html("Save");
      } else {
        return $(this).html("Edit");
      }
    }).on("blur", ".mdtxt", function() {
      return event.preventDefault();
    }).on("mousewheel", ".stack > .stack_image", function(e) {
      var delta;
      delta = e.originalEvent.detail;
      if (!delta) {
        delta = e.originalEvent.wheelDelta;
      }
      if (delta > 0 && $(this).next().length > 0) {
        $(this).prev().css("display", "none");
        $(this).css("display", "none");
        $(this).next().css("display", "inline");
      } else if (delta < 0 && $(this).prev().length > 0) {
        $(this).next().css("display", "none");
        $(this).css("display", "none");
        $(this).prev().css("display", "inline");
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
            return $("#session").html("<a class=\"session\" id=\"sign_in\">Sign in with twitter</a>");
          }
        }
      });
      return $("#userinfo").hide();
    }).on("click", "#newpage", function() {
      return $("#newpage_dialog").show();
    }).on("click", "#newpage_cancel", function() {
      return $("#newpage_dialog").hide();
    }).on("click", "#newpage_confirm", function() {
      return $.ajax({
        url: window.location.pathname + "/newpage",
        type: "POST",
        data: pageMeta(),
        statusCode: {
          404: function() {
            return alert("Page not found");
          },
          200: function(url) {
            $("#save").trigger("click");
            return document.location.href = url;
          },
          403: function() {
            return alert("Forbidden, page not saved");
          }
        }
      });
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
    }).on("click", "#savepage_confirm", function() {
      event.preventDefault();
      return $.ajax({
        type: "PUT",
        url: window.location.pathname,
        data: spiderpage(),
        statusCode: {
          200: function(msg) {
            alert("Page Saved: " + msg);
            return $("#save_dialog").hide();
          },
          403: function() {
            return alert("FORBIDDEN");
          }
        }
      });
    }).on("click", "#feedback", function() {
      return $("#feedback_dialog").show();
    }).on("click", "#feedback_cancel", function() {
      return $("#feedback_dialog").hide();
    }).on("click", "#feedback_confirm", function() {
      var feedback, pathname, targeturl;
      pathname = window.location.pathname.split("/");
      feedback = {};
      targeturl = "/case/" + pathname[2] + "/feedback";
      feedback.text = $("#feedback_text").val();
      feedback.toAuthor = $("#feedback_author").is(":checked");
      feedback.toCurator = $("#feedback_curator").is(":checked");
      return $.ajax({
        url: targeturl,
        type: "POST",
        data: feedback,
        statusCode: {
          404: function() {
            return alert("page not found");
          },
          200: function(response) {
            alert(response);
            return $("#feedback_dialog").hide();
          },
          403: function() {
            return alert("Forbidden");
          }
        }
      });
    }).on("click", "#meta", function() {
      return $("#meta_dialog").show();
    }).on("click", "#meta_cancel", function() {
      return $("#meta_dialog").hide();
    }).on("click", "#meta_confirm", function() {
      return $("#meta_dialog").hide();
    }).on("click", "#help", function() {
      return $("#markdown-help").show();
    }).on("click", "#help_cancel", function() {
      return $("#markdown-help").hide();
    }).on("click", "#deletepage", function() {
      return $("#deletepage_dialog").show();
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
        action: $("#uploadform").attr("action"),
        method: "POST",
        userfile: userFile,
        enctype: "multipart/form-data",
        encoding: "multipart/form-data",
        target: "postframe"
      });
      $("#uploadform").submit();
      $("<div class=\"radio\"><div class=\"stack\"></div>" + "<div class=\"caption\">" + "<textarea class=\"mdtxt\" style=\"display:none\">" + "placeholder </textarea>" + "<div class=\"md\"></div></div></div>").insertBefore("#addstack");
      rendermd();
      $(".radio:last").append($("<a class=\"deleteradio abutton\">&#x166d;<a>"));
      return $(".caption:last").append($("<a class=\"abutton session textedit\">Edit</a>"));
    }).on("click", ".deleteradio", function() {
      $(this).parent().addClass("selected");
      return $("#deleteradio_dialog").show();
    }).on("click", "deleteradio_cancel", function() {
      $(".selected").removeClass("selected");
      return $("#deleteradio_dialog").hide();
    }).on("click", "#deleteradio_confirm", function() {
      var pathname, targeturl;
      pathname = window.location.pathname.split("/");
      targeturl = "/case/" + pathname[2] + "/" + pathname[3] + "/" + $(".selected").attr("ID");
      return $.ajax({
        url: targeturl,
        type: "DELETE",
        statusCode: {
          200: function() {
            $(".selected").remove();
            return $("#deleteradio_dialog").hide();
          },
          404: function() {
            alert("NOT FOUND");
            $(".selected").removeClass("selected");
            return $("#deleteradio_dialog").hide();
          },
          403: function() {
            alert("FORBIDDEN");
            $(".selected").removeClass("selected");
            return $("#deleteradio_dialog").hide();
          }
        }
      });
    });
    $("#postframe").one("load", function() {
      var radioID;
      radioID = $("iframe")[0].contentDocument.body.innerHTML;
      $(".radio:last").attr("ID", radioID);
      return $.ajax({
        type: "GET",
        url: "/radio/" + radioID,
        statusCode: {
          200: function(data) {
            $(".stack:last", top.document).html(data);
            $(".stack:last", top.document).children(":first").show();
            scrollfunction_mw();
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
