var converter = new Showdown.converter();

function change_url(url) { document.location = url; }

var lastY = 0;
var samp = 0;

function touchscroll() {
  $('.stack > .stack_image').each(function() {
    var visimg = $(this);
    this.ontouchstart = function(e) {
      return visimg = $(this);
    };
    this.ontouchmove = function(e) {
      if (e.targetTouches.length === 1) {
        samp++;
        if (samp === 3) {
          samp = 0;
          var touch = e.touches[0];
          if (parseInt(touch.pageY, 10) > lastY && visimg.prev().length > 0) {
            visimg.prev().show();
            visimg.hide();
            visimg.next().hide();
            visimg = visimg.prev();
          }
          else if (visimg.next().length > 0) {
            visimg.next().show();
            visimg.hide();
            visimg.prev().hide();
            visimg = visimg.next();
          }
          //log(parseInt(touch.pageY, 10));
          return lastY = parseInt(touch.pageY, 10);
        }
        e.preventDefault();
      }
    }
  });
}

function rendermd() {
  $('.md').html(function() {
    var markdown = $(this).siblings(".mdtxt").val();
    return converter.makeHtml(markdown);
  });
}

function pageMeta() {
  var json = {};
  json.title = $('#meta_title').val();
  json.private = $('#private').is(':checked');
  json.created = $('#created').val();
  return json;
}

function editfunctions() {
  $(document)
          .on('click', '.textedit', function() {
            $(this).siblings('.mdtxt').toggle().focus().autogrow();
            $(this).siblings('.md').toggle();
            $(this).html() == 'Edit' ? $(this).html('Save') : $(this).html('Edit');
          })
          .on('blur', '.mdtxt', function() {
            event.preventDefault();
          });
  $('.radio').append($('<a class="deleteradio abutton">&#x166d;<a>'))
}

function spiderpage() {
  var json = pageMeta();
  json.radios = $('.radio').map(
          function() {
            var radio = {};
            radio.id = $(this).attr('id');
            radio.caption = $(this).children('.caption').children('.mdtxt').val();
          }
  ).get();
  json.texts = $('.txt>.mdtxt').map(
          function() {
            return($(this).val());
          }
  ).get();
  return json;
}

function sessionButton(user) {
  $('#session').html('<button id="sign_out">Sign out ' + user + '</button>');
}

var authcallback = function(data) {
  $.ajax({
    url: '/signed_in',
    statusCode: {
      200: function() {
        $('#session').html('<a class="session" id="user_settings">' + data.user.username + ' ▼ </a>');
        $('#feedbackbutton').attr('id', 'editbutton').html('Edit');
      },
      403: function(data) {
        alert('not allowed - if you feel that this is an error, please write to info@radioca.se');
      }
    }
  });
};

$(function() {
  rendermd();
  touchscroll();
  $('.stack').children(':first-child').show();

  $(document)
          .on('mousewheel', '.stack > .stack_image', function(e) {
            var delta = e.originalEvent.wheelDelta;
            if (delta > 0 && $(this).next().length > 0) {
              $(this).css('display', 'none');
              $(this).prev().css('display', 'none');
              $(this).next().css('display', 'inline');
            } else if (delta < 0 && $(this).prev().length > 0) {
              $(this).css('display', 'none');
              $(this).next().css('display', 'none');
              $(this).prev().css('display', 'inline');
            }
            //console.log(delta);
            event.preventDefault();
          })
          .on('click', '#user_settings', function() {$('#userinfo').toggle()})
          .on('click', '#sign_in', function() {openEasyOAuthBox('twitter', authcallback)})
          .on('click', '#sign_out', function() {
            window.open('http://twitter.com/#!/logout');
            $.ajax({
              url: '/sign_out',
              statusCode: {
                200: function(data) {
                  $('#session').html('<a class="session" id="sign_in">Sign in with twitter</a>');
                }}
            });
            $('#userinfo').hide();
          })
          .on('click', '#newpage', function() {$('#newpage_dialog').show();})
          .on('click', '#newpage_cancel', function() {$('#newpage_dialog').hide()})
          .on('click', '#newpage_confirm', function() {
            $.ajax({
              url: window.location.pathname + '/newpage',
              type: 'POST',
              data: pageMeta(),
              statusCode: {
                404: function() {alert('page not found')},
                200: function(url) {
                  $('#save').trigger('click');
                  document.location.href = url;
                },
                403: function() {alert('Forbidden')}
              }
            });
          })
          .on('click', '#createcase', function() {
            var json = {};
            json.title = $('#title').val();
            json.listed = $('#listed').is(':checked');
            json.icd = $('#icd').val();
            $.ajax({
              url: '/newcase',
              type: 'POST',
              data: json,
              statusCode: {
                403 : function() {alert('Forbidden - are you logged in?')},
                200 : function(url) {document.location = url}
              }
            });
          })
          .on('click', '#savepage_confirm', function() {
            event.preventDefault();
            //var data = spiderpage();
            //alert(data);
            //var url = $('#savepage').attr('action').toString();
            $.ajax({
              type: 'PUT',
              url: window.location.pathname,
              data: spiderpage(),
              statusCode:{
                200: function(msg) {
                  alert("Page Saved: " + msg);
                  $('#save_dialog').hide();
                },
                403: function() {alert('FORBIDDEN')}
              }
            });
          })
          .on('click', '#feedback', function() {$('#feedback_dialog').show()})
          .on('click', '#feedback_cancel', function() {$('#feedback_dialog').hide()})
          .on('click', '#feedback_confirm', function() {
            var pathname = window.location.pathname.split('/');
            var feedback = {};
            var targeturl = '/case/' + pathname[2] + '/feedback';
            feedback.text = $('#feedback_text').val();
            feedback.toAuthor = $('#feedback_author').is(':checked');
//      feedback.toPublic = function() {
//        return $("#feedback_public", top.document).is(':checked') ? 1 : 0;
//      };
            feedback.toCurator = $('#feedback_curator').is(':checked');
            $.ajax({
              url: targeturl,
              type: 'POST',
              data: feedback,
              statusCode: {
                404: function() {alert('page not found')},
                200: function(response) {
                  alert(response);
                  $('#feedback_dialog').hide();
                },
                403: function() {alert('Forbidden')}
              }
            });
          })
          .on('click', '#meta', function() {$('#meta_dialog').show()})
          .on('click', '#meta_cancel', function() {$('#meta_dialog').hide()})
          .on('click', '#meta_confirm', function() {$('#meta_dialog').hide()})
          .on('click', '#help', function() {$('#markdown-help').show()})
          .on('click', '#help_cancel', function() {$('#markdown-help').hide()})
          .on('click', '#deletepage', function() {$('#deletepage_dialog').show()})
          .on('click', '#deletepage_cancel', function() {$('#deletepage_dialog').hide()})
          .on('click', '#deletepage_confirm', function() {
            $.ajax({
              type: 'DELETE',
              url: top.document.location.pathname,
              statusCode: {
                200: function() {
                  window.location.replace($('#prevpage').attr('href'));
                }
              }
            });
          })
          .on('click', '#addstack', function() {$('#addstack_dialog').show()})
          .on('click', '#addstack_cancel', function() {
            event.preventDefault();
            $('#addstack_dialog').hide();
          })
          .on('click', '#addstack_confirm', function() {
            $('#addstack_dialog').hide();
            var userFile = $('#userfile').val();
            //alert(userFile);
            $('#uploadform').attr({
              action: $('#uploadform').attr('action'),
              method: 'POST',
              userfile: userFile,
              enctype: 'multipart/form-data',
              encoding: 'multipart/form-data',
              target: 'postframe'
            });
            $('#uploadform').submit();
            $('<div class="radio"><div class="stack"></div>' +
                    '<div class="caption">' +
                    '<textarea class="mdtxt" style="display:none">' +
                    'placeholder </textarea>' +
                    '<div class="md"></div></div></div>').insertBefore('#addstack');
            rendermd();
            $('.radio:last').append($('<a class="deleteradio abutton">&#x166d;<a>'));
            $('.caption:last').append($('<a class="abutton session textedit">Edit</a>'));
          })
          .on('click', '.deleteradio', function() {
            $(this).parent().addClass('selected');
            $('#deleteradio_dialog').show();
          })
          .on('click', 'deleteradio_cancel', function() {
            $('.selected').removeClass('selected');
            $('#deleteradio_dialog').hide();
          })
          .on('click', '#deleteradio_confirm', function() {
            var pathname = window.location.pathname.split('/');
            var targeturl = '/case/' + pathname[2] + '/' + pathname[3] + '/' + $('.selected').attr('ID');
            //alert(targeturl);
            $.ajax({
              url: targeturl,
              type: 'DELETE',
              statusCode: {
                200: function() {
                  $('.selected').remove();
                  $('#deleteradio_dialog').hide();
                },
                404: function() {
                  alert('NOT FOUND');
                  $('.selected').removeClass('selected');
                  $('#deleteradio_dialog').hide();
                },
                403: function() {
                  alert('FORBIDDEN');
                  $('.selected').removeClass('selected');
                  $('#deleteradio_dialog').hide();
                }
              }
            });
          });

  $('#postframe').one('load', function() {
    var radioID = $('iframe')[0].contentDocument.body.innerHTML;
    $('.radio:last').attr('ID', radioID);
    $.ajax({
      type: 'GET',
      url: '/radio/' + radioID,
      statusCode:{
        200: function(data) {
          $('.stack:last', top.document).html(data);
          $('.stack:last', top.document).children(':first').show();
          scrollfunction_mw();
          touchscroll();
        }
      }
    });
  });
  /*
   * Auto-growing textareas; technique ripped from Facebook
   */
  $.fn.autogrow = function(options) {


    this.filter('textarea', top.document).each(function() {

      var $this = $(this),
              minHeight = $this.height(),
              lineHeight = $this.css('lineHeight');

      var shadow = $('<div></div>').css({
        position:   'absolute',
        top:        -10000,
        left:       -10000,
        width:      $(this).width() - parseInt($this.css('paddingLeft')) - parseInt($this.css('paddingRight')),
        fontSize:   $this.css('fontSize'),
        fontFamily: $this.css('fontFamily'),
        lineHeight: $this.css('lineHeight'),
        resize:     'none'
      }).appendTo(document.body);

      var update = function() {

        var times = function(string, number) {
          for (var i = 0, r = ''; i < number; i ++) r += string;
          return r;
        };

        var val = this.value.replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/&/g, '&amp;')
                .replace(/\n$/, '<br/>&nbsp;')
                .replace(/\n/g, '<br/>')
                .replace(/ {2,}/g, function(space) { return times('&nbsp;', space.length - 1) + ' ' });

        shadow.html(val);
        $(this).css('height', Math.max(shadow.height() + 20, minHeight));

      }

      $(this).change(update).keyup(update).keydown(update);

      update.apply(this);

    });

    return this;

  }
  /*!
   * Autogrow Textarea Plugin Version v2.0
   * http://www.technoreply.com/autogrow-textarea-plugin-version-2-0
   *
   * Copyright 2011, Jevin O. Sewaruth
   *
   * Date: March 13, 2011
   */
  jQuery.fn.autoGrow = function() {
    return this.each(function() {
      // Variables
      var colsDefault = this.cols;
      var rowsDefault = this.rows;

      //Functions
      var grow = function() {
        growByRef(this);
      }

      var growByRef = function(obj) {
        var linesCount = 0;
        var lines = obj.value.split('\n');

        for (var i = lines.length - 1; i >= 0; --i) {
          linesCount += Math.floor((lines[i].length / colsDefault) + 1);
        }

        if (linesCount >= rowsDefault)
          obj.rows = linesCount + 1;
        else
          obj.rows = rowsDefault;
      }

      var characterWidth = function (obj) {
        var characterWidth = 0;
        var temp1 = 0;
        var temp2 = 0;
        var tempCols = obj.cols;

        obj.cols = 1;
        temp1 = obj.offsetWidth;
        obj.cols = 2;
        temp2 = obj.offsetWidth;
        characterWidth = temp2 - temp1;
        obj.cols = tempCols;

        return characterWidth;
      }

      // Manipulations
      this.style.width = "auto";
      this.style.height = "auto";
      this.style.overflow = "hidden";
      this.style.width = ((characterWidth(this) * this.cols) + 6) + "px";
      this.onkeyup = grow;
      this.onfocus = grow;
      this.onblur = grow;
      growByRef(this);
    });
  };
});
