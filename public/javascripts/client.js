(function() {
  var authcallback, converter, editclose, editfunctions, opts, rendermd, scrollfunction, spiderpage;
  scrollfunction = function() {
    return $(".stack", top.document).mousewheel(function(event, delta) {
      if (delta > 0) {
        $(this).css("background-position", parseInt($(this).css("background-position"), 10) - parseInt($(this).css("width"), 10));
      } else {
        if (delta < 0) {
          $(this).css("background-position", parseInt($(this).css("background-position"), 10) + parseInt($(this).css("width"), 10));
        }
      }
      return event.preventDefault();
    });
  };
  rendermd = function() {
    return $(".md", top.document).html(function() {
      var markdown;
      markdown = $(this).siblings(".mdtxt").val();
      return converter.makeHtml(markdown);
    });
  };
  editfunctions = function() {
    $(".md", top.document).live({
      dblclick: function() {
        $(this).hide();
        return $(this).siblings(".mdtxt").show().focus().autogrow();
      }
    });
    $(".mdtxt", top.document).live({
      blur: function() {
        $(this).hide();
        rendermd();
        return $(this).siblings(".md").show();
      }
    });
    $(".stack", top.document).append($("<button type=\"button\" class=\"deletebutton\">X</button>"));
    return $("#addstack", top.document).show();
  };
  editclose = function() {
    $(".md", top.document).die();
    $(".mdtxt", top.document).die();
    $("#markdown-help", top.document).hide();
    $("#addstack", top.document).hide();
    $("#uploadarea", top.document).hide();
    $("#editbar", top.document).hide().attr("src", "about:none");
    $(".stack>.deletebutton", top.document).remove();
    return $("#editbutton", top.document).show();
  };
  spiderpage = function() {
    var jsonpage;
    jsonpage = {};
    jsonpage.title = $("title", top.document).html();
    jsonpage.radios = $(".radio", top.document).map(function() {
      var radio;
      radio = {};
      radio.img = $(this).children(".stack").attr("url");
      radio.caption = $(this).children(".caption").children(".mdtxt").val();
      return radio;
    }).get();
    jsonpage.texts = $(".txt>.mdtxt", top.document).map(function() {
      return $(this).val();
    }).get();
    return jsonpage;
  };
  converter = new Showdown.converter();
  opts = {
    lines: 12,
    length: 7,
    width: 4,
    radius: 10,
    color: "#fff",
    speed: 1,
    trail: 33,
    shadow: true
  };
  $.fn.spin = function(opts) {
    this.each(function() {
      var $this, data;
      $this = $(this);
      data = $this.data();
      if (data.spinner) {
        data.spinner.stop();
        delete data.spinner;
      }
      if (opts !== false) {
        return data.spinner = new Spinner($.extend({
          color: $this.css("color")
        }, opts)).spin(this);
      }
    });
    return this;
  };
  authcallback = function(data) {
    $("#session").html("<button id=\"sign_out\">Sign out " + data.user.username + "</button>");
    $.ajax({
      url: "/signed_in",
      success: function(data) {
        if (data === "new user") {
          return $("#info").html("new user").show();
        }
      }
    });
    return $("#editbutton").show();
  };
  $(function() {
    scrollfunction();
    $("#sign_out").live({
      click: function() {
        window.open("http://twitter.com/#!/logout");
        return $.ajax({
          url: "/sign_out",
          success: function(data) {
            editclose();
            $("#editbutton").hide();
            return $("#session").html(data);
          }
        });
      }
    });
    $("#addstack", top.document).live({
      click: function() {
        return $("#uploadarea").show();
      }
    });
    $("#twitbutt").live({
      click: function() {
        openEasyOAuthBox("twitter", authcallback);
        return $(this).hide();
      }
    });
    $("#cancelupload").live({
      click: function() {
        return $("#uploadarea").hide();
      }
    });
    $("#facebutt").click(function() {
      return openEasyOAuthBox("facebook", authcallback);
    });
    $(".deletebutton").live({
      click: function() {
        return $(this).parent().parent().remove();
      }
    });
    $(".stack").live("toggleSpinner", function() {
      alert("toggleSpinner triggered");
      return $(this).spin(opts);
    });
    $("#save").click(function(event) {
      var data, url;
      event.preventDefault();
      data = spiderpage();
      url = $("#savepage").attr("action").toString();
      return $.ajax({
        type: "PUT",
        url: url,
        dataType: "json",
        data: data,
        success: function(msg) {
          return alert("Page Saved: " + msg);
        }
      });
    });
    $("#help").click(function() {
      return $("#markdown-help", top.document).show();
    });
    $("#closehelp").live({
      click: function() {
        return $("#markdown-help", top.document).hide();
      }
    });
    $("#sendstring").live({
      click: function() {
        return $.ajax({
          url: "/put-test",
          method: "put"
        });
      }
    });
    $("#editbutton").live({
      click: function() {
        var path;
        path = top.document.location.pathname.split("/");
        $("#editbar", top.document).attr("src", "/" + path[1] + "/" + path[2] + "/" + path[3] + "/edit").show();
        return $(this).hide();
      }
    });
    $("#done").live({
      click: function() {
        return editclose();
      }
    });
    $("#upload").live({
      click: function() {
        var iframe, userFile;
        $("#uploadarea").hide();
        userFile = $("#userfile").val();
        iframe = $("<iframe name=\"postframe\" id=\"postframe\" class=\"hidden\" src=\"about:none\" />");
        $("#iframe").append(iframe);
        $("#uploadform").attr({
          action: "/image/",
          method: "POST",
          userfile: $("#userfile").val(),
          enctype: "multipart/form-data",
          encoding: "multipart/form-data",
          target: "postframe"
        });
        $("#uploadform").submit();
        $("#radios", top.document).append("<div class='radio'><div url='', class='stack img512'></div>" + "<div class='caption'>" + "<textarea class='mdtxt' style='display:none'>" + "(double-click to change caption) </textarea>" + "<div class='md'></div></div></div>");
        rendermd();
        $(".radio:last>.stack", top.document).append($("<button type=\"button\" class=\"deletebutton\">X</button>"));
        $(".radio:last>.stack", top.document).spin();
        return $("#postframe").load(function() {
          var url;
          url = $("iframe")[0].contentDocument.body.innerHTML;
          $(".radio:last>.stack", top.document).attr("url", url);
          return scrollfunction();
        });
      }
    });
    return $.fn.autogrow = function(options) {
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
  });
}).call(this);
