(function() {
  var authcallback, change_url, converter, deletepage, editfunctions, filter2, findICD, flickY, getTitle, getfeedback, icdquery, lastY, maximizeradio, minimizeradio, newcase, newpage, pageMeta, rendermd, samp, savepage, sessionButton, spiderpage, touchscroll, visimg, zebrarows;

  lastY = 0;

  flickY = 0;

  samp = 0;

  visimg = $(".stack_image");

  icdquery = "";

  String.prototype.toProperCase = function() {
    return this.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  findICD = function(icdquery) {
    var json;
    json = {};
    json.qs = icdquery;
    return $.ajax({
      type: "POST",
      url: "/icd",
      data: json,
      cache: false,
      statusCode: {
        200: function(data) {
          data = data.replace(/"\]/g, '');
          data = data.replace(/","/g, '');
          data = data.replace(/\["/, '');
          data = data.replace(/\[\]/, '');
          return $("#icd_res").append(data);
        }
      }
    });
  };

  change_url = function(url) {
    return document.location = url;
  };

  maximizeradio = function(radio) {
    radio.clone(true).appendTo('#maximized');
    $('#maximized>.radio').removeClass("radioimagepage");
    $('#maximized').show();
    touchscroll();
    $('#footer').hide();
    $('#maximized>.radio>.maximizeradio').hide();
    return $('#maximized>.radio>.minimizeradio').show();
  };

  minimizeradio = function(radio) {
    radio.remove();
    $('#maximized').hide();
    return $('#footer').show();
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
    json.icd = $("#icd").map(function() {
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
          return alert("Forbidden - if you want to add cases please write to info@radioca.se");
        },
        200: function(url) {
          return document.location = url;
        },
        500: function() {
          return alert("Error - Please log in");
        }
      }
    });
  };

  editfunctions = function() {
    $(".postdcm").toggle();
    $(".nodcm").toggle();
    $('#locked').toggle();
    $('#open').toggle();
    $('.removeradio').toggle();
    $(".textedit").toggle();
    $("#addstack").toggle();
    $("#controls").toggle();
    $(".moveradioup").toggle();
    $(".moveradiodown").toggle();
    $("#boxit_dialog").hide();
    $("#addstack_dialog").hide();
    $("#addtext").toggle();
    return $(".deletetext").toggle();
  };

  zebrarows = function(selector, className) {
    return $(selector).removeClass(className).addClass(className);
  };

  filter2 = function(selector, query) {
    query = $.trim(query);
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
          e.preventDefault();
          if (samp > 2) {
            samp = 0;
            touch = e.touches[0];
            if (parseInt(touch.pageY, 10) > lastY && visimg.prev().length > 0) {
              visimg.prev().show();
              visimg.hide();
              visimg = visimg.prev();
            } else if (parseInt(touch.pageY, 10) < lastY && visimg.next().length > 0) {
              visimg.next().show();
              visimg.hide();
              visimg = visimg.next();
            }
            return lastY = parseInt(touch.pageY, 10);
          }
        }
        if (e.targetTouches.length === 3) {
          samp++;
          e.preventDefault();
          if (samp > 20) {
            samp = 0;
            touch = e.touches[1];
            if (parseInt(touch.pageY, 10) > lastY && visimg.prev().length > 0) {
              visimg.prev().show();
              visimg.hide();
              visimg = visimg.prev();
            } else if (parseInt(touch.pageY, 10) < lastY && visimg.next().length > 0) {
              visimg.next().show();
              visimg.hide();
              visimg = visimg.next();
            }
            return lastY = parseInt(touch.pageY, 10);
          }
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
    json.created = $("#created").val();
    json.pagetype = $("#meta_pagetype").html();
    json.nextpage = $("#meta_nextpage").html();
    json.prevpage = $("#meta_prevpage").html();
    return json;
  };

  deletepage = function(lastpage) {
    if (lastpage === 'last') {
      return $.ajax({
        type: "DELETE",
        url: "/case/" + $("#meta_cid").html() + "/lastpage",
        statusCode: {
          200: function() {
            return window.location.replace('/cases/0/-1');
          }
        }
      });
    } else {
      return $.ajax({
        type: "DELETE",
        url: top.document.location.pathname,
        statusCode: {
          200: function(redir) {
            return window.location.replace(redir);
          }
        }
      });
    }
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
    json.texts = $("#texts>.text>.txt>.mdtxt").map(function() {
      var text;
      text = {};
      text.val = $(this).val();
      text.caption = $(this).closest(".text").find(".toggletext>.txt>.mdtxt").val();
      return text;
    }).get();
    if (!json.texts) json.texts = [""];
    json.modalities = $(".modality:checked").map(function() {
      return $(this).val();
    }).get();
    json.description = $(".description:checked").map(function() {
      return $(this).val();
    }).get();
    json.language = $("input:radio[name=language]:checked").val();
    json.icds = $(".ICDCode>.icdt").map(function() {
      var icd;
      icd = {};
      icd.code = $(this).text();
      return icd;
    }).get();
    if (!json.icds) json.icds = [""];
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
        500: function() {
          return window.location.pathname = window.location.pathname;
        },
        200: function() {
          return window.location.pathname = window.location.pathname;
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
    $("thead th.sortable").each(function(column) {
      return $(this).click(function() {
        var $rows, $sortHead, findSortKey, sortDirection;
        findSortKey = function($cell) {
          return $cell.find('.sort-key').text().toUpperCase() + ' ' + $cell.text().toUpperCase();
        };
        sortDirection = ($(this).is('.sorted-asc') ? -1 : 1);
        $rows = $(this).parent().parent().parent().find('tbody tr').get();
        $.each($rows, function(index, row) {
          return row.sortKey = findSortKey($(row).children('td').eq(column));
        });
        $rows.sort(function(a, b) {
          if (a.sortKey < b.sortKey) return -sortDirection;
          if (a.sortKey > b.sortKey) return sortDirection;
          return 0;
        });
        $.each($rows, function(index, row) {
          $('tbody').append(row);
          return row.sortKey = null;
        });
        $('th').removeClass('sorted-asc sorted-desc');
        $sortHead = $('th').filter(':nth-child(' + (column + 1) + ')');
        if (sortDirection === 1) {
          $sortHead.addClass("sorted-asc");
        } else {
          $sortHead.addClass("sorted-desc");
        }
        $("td").removeClass("sorted").filter(":nth-child(" + (column + 1) + ")").addClass("sorted");
        $(".visible td").removeClass("odd");
        return zebrarows(".visible:even td", "odd");
      });
    });
    $(document).on("mouseover", ".control", function() {
      return $(this).attr('src', $(this).attr('src').slice(0, -7) + '.png');
    }).on("mouseout", ".control", function() {
      return $(this).attr('src', $(this).attr('src').slice(0, -4) + '_bw.png');
    }).on("dblclick", ".radio", function() {
      if ($("#maximized").is(":visible")) {
        return minimizeradio($(this));
      } else {
        return maximizeradio($(this));
      }
    }).on("click", "#newcase", function() {
      return $('#newcase_dialog').toggle();
    }).on("click", "#newcase_cancel", function() {
      return $('#newcase_dialog').hide();
    }).on("click", ".maximizeradio", function() {
      return maximizeradio($(this).parent());
    }).on("click", ".minimizeradio", function() {
      return minimizeradio($(this).parent());
    }).on("click", ".completed", function() {
      $(this).removeClass('completed');
      $(this).addClass('rmcompleted');
      $(this).attr('src', '/static/ico/ui-color-picker.png');
      return $.ajax({
        type: "POST",
        url: "/completed/" + $(this).attr("ID")
      });
    }).on("click", ".Cancel", function() {
      $(this).parent().hide();
      $('.selected').removeClass('selected');
      return $('.selectedtext').removeClass('selectedtext');
    }).on("click", ".rmcompleted", function() {
      $(this).removeClass('rmcompleted');
      $(this).addClass('completed');
      $(this).attr('src', '/static/ico/ui-color-picker-tick.png');
      return $.ajax({
        type: "POST",
        url: "/rmcompleted/" + $(this).attr("ID")
      });
    }).on("click", ".bookmark", function() {
      var star;
      star = $(this);
      return $.ajax({
        type: "POST",
        url: "/bookmark/" + $(this).attr("ID"),
        statusCode: {
          200: function() {
            star.removeClass('bookmark');
            star.addClass('rmbookmark');
            return star.attr('src', '/static/ico/star.png');
          },
          444: function() {
            return alert("Error, are you logged in?");
          }
        }
      });
    }).on("click", ".rmbookmark", function() {
      var star;
      star = $(this);
      return $.ajax({
        type: "POST",
        url: "/rmbookmark/" + $(this).attr("ID"),
        statusCode: {
          200: function() {
            star.removeClass('rmbookmark');
            star.addClass('bookmark');
            return star.attr('src', '/static/ico/star-empty.png');
          },
          444: function() {
            return alert("Error, are you logged in?");
          }
        }
      });
    }).on("keyup", "#icd_req", function(event) {
      var icdquery2, icdqueryPropercase;
      if (event.keyCode === 27 || $(this).val() === '') {
        $(this).val('');
        return $("#icd_res").html("");
      } else {
        icdquery2 = $(this).val().split("\ ");
        if (icdquery !== icdquery2[0]) {
          icdquery = icdquery2[0];
          icdqueryPropercase = icdquery.charAt(0).toUpperCase() + icdquery.substr(1);
          $("#icd_res").html("");
          findICD(icdquery);
          findICD(icdqueryPropercase);
        }
        $('.icdcode').addClass('visible');
        return icdquery2.forEach(function(query) {
          return filter2('.icdcode', query);
        });
      }
    }).on("click", "#chooseICD", function() {
      return $("#icd").append("<div class='ICDCode'><a class='icdt'>" + $("#icd_req").val() + "</a><a class='removeICD'><img class='control' src='/static/ico/small_minus_bw.png'></a></div><br>");
    }).on("click", ".removeICD", function() {
      return $(this).parent().remove();
    }).on("click", ".icdt", function() {
      $("#icd_res").html("");
      $('#icd_req').val($(this).parent().text());
      return findICD($(this).text());
    }).on("click", "#toggleDiagnosis", function() {
      $('.diagnosis').toggleClass('invisible');
      if ($('.diagnosis').hasClass('invisible')) {
        return $(this).text("Show dx");
      } else {
        return $(this).text("Hide dx");
      }
    }).on("focus", "#filter", function() {
      if ($(this).val() === 'Type to filter') return $(this).val('');
    }).on("keyup", "#filter", function(event) {
      var querys;
      if (event.keyCode === 27 || $(this).val() === '') {
        $(this).val('');
        return $('tbody tr').removeClass('visible').show().addClass('visible');
      } else {
        $('tbody tr').addClass('visible');
        querys = $(this).val().split("\ ");
        return querys.forEach(function(query) {
          return filter2('tbody tr.visible', query);
        });
      }
    }).on("click", ".textedit", function() {
      var src;
      src = $(this).attr('src') === '/static/ico/pencil.png' ? '/static/ico/tick.png' : '/static/ico/pencil.png';
      $(this).attr('src', src);
      $(this).siblings(".mdtxt").toggle().focus().autogrow();
      $(this).siblings(".md").toggle();
      return rendermd();
    }).on("blur", ".mdtxt", function() {
      return event.preventDefault();
    }).on("mousewheel", ".stack", function(e) {
      var delta, image;
      e.preventDefault();
      e.stopPropagation();
      image = $(this).find('.stack_image:visible');
      delta = e.originalEvent.wheelDelta || e.originalEvent.detail;
      if (delta > 0 && image.next().length > 0) {
        image.next().show();
        return image.hide();
      } else if (delta < 0 && image.prev().length > 0) {
        image.prev().show();
        return image.hide();
      }
    }).on("click", "#user_settings", function() {
      return $("#userinfo").toggle("slide", {
        direction: "right"
      }, 300);
    }).on("click", "#sign_in", function() {
      return openEasyOAuthBox("twitter", authcallback);
    }).on("click", "#sign_out", function() {
      window.open("http://twitter.com/#!/logout");
      return $.ajax({
        url: "/sign_out",
        statusCode: {
          200: function() {
            $("#usercontrols").html("<a class=\"session\" id=\"sign_in\"><img src=\"/static/img/sign-in-with-twitter-d.png\"></a>");
            return window.location.href = window.location.href;
          }
        }
      }, $("#userinfo").hide());
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
          },
          444: function() {
            return alert("Error, maybe you're not logged in?");
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
      if ($('#nextpage').attr('pageno') === '0' && $('#prevpage').attr('pageno') === '0') {
        return $('#lastpage_dialog').show();
      } else {
        return deletepage();
      }
    }).on("click", "#lastpage_confirm", function() {
      return deletepage('last');
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
    }).on("click", "#addtext", function() {
      return $("#addtext_dialog").show();
    }).on("click", "#togglabletext", function() {
      $("<div class='text'>        <a class='toggletext'>          <div class='txt'>            <textarea class='mdtxt' style='display:none'>Toggle textarea</textarea>            <div class='md'></div>            <img src='/static/ico/pencil_bw.png' class='control textedit session' style='display: inline'>          </div>        </a>        <div class='txt invisible togglable'>          <textarea class='mdtxt' style='display:none'></textarea>          <div class='md'></div>          <img src='/static/ico/pencil_bw.png' class='control textedit session' style='display: inline'>        </div>       </div>      <br>").insertBefore("#addtext");
      $(this).parent().hide();
      return rendermd();
    }).on("click", ".deletetext", function() {
      $(this).parent().parent().addClass("selectedtext");
      return $("#deletetext_dialog").show();
    }).on("click", "#deletetext_confirm", function() {
      $(".selectedtext").remove();
      return $("#deletetext_dialog").hide();
    }).on("click", ".toggletext", function() {
      return $(this).next().toggleClass('invisible');
    }).on("click", ".postdcm", function() {
      $(this).parent().addClass("selected");
      return $("#adddcm_dialog").show();
    }).on("click", "#adddcm_confirm", function() {
      var dicom;
      $("#adddcm_dialog").hide();
      dicom = $("#userFileDcm").val();
      $("#uploadformdcm").attr({
        action: "/dicom/" + $(".selected").attr("ID"),
        method: "POST",
        dicom: dicom,
        enctype: "multipart/form-data",
        encoding: "multipart/form-data",
        target: "postdcm"
      });
      return $("#uploadformdcm").submit();
    }).on("click", ".getdicom", function(e) {
      var thisurl;
      e.preventDefault();
      thisurl = $(this).attr('href');
      return $.ajax({
        action: thisurl,
        method: "GET",
        statusCode: {
          403: function() {
            return alert("DICOM cannot be downloaded - are you logged in?");
          },
          200: function() {
            return $("#getdcm").attr("src", thisurl);
          }
        }
      });
    }).on("click", "#addstack", function() {
      return $("#addstack_dialog").show();
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
      $(".radio:last", top.document).append($("<img class=\"control removeradio\" src=\'/static/ico/cross.png\'>"));
      return $(".caption:last", top.document).append($("<img class=\"control textedit\" src=\'/static/ico/pencil.png\' style=\'display:inline\'>"));
    }).on("click", ".hidecase", function() {
      var targeturl;
      targeturl = "/hide/" + $(this).attr("ID");
      $(this).addClass("showcase");
      $(this).removeClass("hidecase");
      $(this).attr('src', '/static/ico/eye-prohibition.png');
      return $.ajax({
        url: targeturl,
        type: "POST"
      });
    }).on("click", ".showcase", function() {
      var targeturl;
      targeturl = "/show/" + $(this).attr("ID");
      $(this).addClass("hidecase");
      $(this).removeClass("showcase");
      $(this).attr('src', '/static/ico/eye.png');
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
    $('#putdcm').bind('load', function() {
      var radioID;
      radioID = $("iframe")[2].contentDocument.body.innerHTML;
      return alert(radioID);
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
