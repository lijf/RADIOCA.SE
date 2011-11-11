var converter = new Showdown.converter();

function change_url(url) { document.location = url; }

function scrollfunction_mw() {
  $('.stack > .stack_image', top.document).mousewheel(function(event, delta) {
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
  });
}

var lastY = 0;
var samp = 0;

function touchscroll() {
  $('.stack > .stack_image', top.document).each(function() {
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
  $('.md', top.document).html(function() {
    var markdown = $(this).siblings(".mdtxt").val();
    return converter.makeHtml(markdown);
  });
}

function pageMeta() {
  var json = {};
  json.title = $('#meta_title', top.document).val();
  json.icd = $('#meta_icd', top.document).val();
  json.private = $('#private', top.document).is(':checked');
  json.created = $('#created', top.document).val();
  return json;
}


function editfunctions() {
  $('.md', top.document).live({
    dblclick: function() {
      $(this).hide();
      $(this).siblings('.mdtxt').show().focus().autogrow();
    }
  }); // shows the textbox for editing on doubleclick

  $('.mdtxt', top.document).live({
    blur: function() {
      alert('hoho');
      $(this).hide();
      rendermd();
      $(this).siblings('.md').show();
      alert('hoho');
      $.ajax({
        type: 'PUT',
        url: window.location.pathname,
        data: spiderpage(),
        statusCode:{
          200: function(msg) {
            alert("Page Saved: " + msg);
            //$('#save_dialog', top.document).hide();
          },
          403: function() {alert('FORBIDDEN')}
        }
      });
    }
  }); // hides the textbox and renders the markdown

  $('.radio', top.document).append($('<button type="button" class="deletebutton">X</button>'));
  // adds deletebutton to radios
  $('#addstack', top.document).show();
  // $('#newpage', top.document).show();
}

function editclose() {
  $('.md', top.document).die();
  $('.mdtxt', top.document).die();
  $('#markdown-help', top.document).hide();
  $('#addstack', top.document).hide();
  $('#uploadarea', top.document).hide();
  $('#editbar', top.document).hide().attr('src', 'about:none');
  $('.radio>.deletebutton', top.document).remove();
  $('#editbutton', top.document).show();
}

// TODO rewrite spiderpage - radios are no longer stored as part of json-object, better ignore here? I would have to solve how reordering radios on a page should work. CAPTIONS?


function spiderpage() {
  var json = pageMeta();
//  json.radios = $('.radio', top.document).map(
//          function() {
//            var radio = {};
//            radio.images = $(this).children('.stack').children('.stack_image').map(
//                    function() {
//                      return($(this).attr('src'));
//                    }).get();
//            radio.caption = $(this).children('.caption').children('.mdtxt').val();
//            return radio;
//          }).get();
  json.radios = $('.radio', top.document).map(
          function() {
            var radio = {};
            radio.id = $(this).attr('id');
            radio.caption = $(this).children('.caption').children('.mdtxt').val();
          }
  ).get();
  json.texts = $('.txt>.mdtxt', top.document).map(
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

  touchscroll();
  scrollfunction_mw();
  $('.stack').children(':first-child').show();

  $('#user_settings').live({
    click: function() {
      $('#userinfo').toggle();
    }
  });

  $('#sign_out').live({
    click: function() {
      window.open('http://twitter.com/#!/logout');
      $.ajax({
        url: '/sign_out',
        statusCode: {
          200: function(data) {
            editclose();
            $('#editbutton').hide();
            $('#session').html('<a class="session" id="sign_in">Sign in with twitter</a>');
          }}
      });
      $('#userinfo').hide();
      $('#editbutton').attr('id', 'feedbackbutton').html('Feedback');
      $('#feedbackbutton').show();
    }
  });

  $('#newpage').click(function() {
    $('#newpage_dialog', top.document).show();
  });

  $('#newpage_cancel').live({
    click: function() {
      $('#newpage_dialog', top.document).hide();
    }
  });

  $('#newpage_last').live({
    click: function() {
      var pathname = parent.window.location.pathname.split('/');
      $.ajax({
        url: '/case/' + pathname[2] + '/newpage',
        type: 'POST',
        data: pageMeta(),
        statusCode: {
          404: function() {alert('page not found')},
          200: function(redirect) {
            alert(redirect);
            $('#save').trigger('click');
            parent.change_url(redirect);
          },
          403: function() {alert('Forbidden')}
        }
      });
    }
  });

  $('#createcase').click(function() {
//    var json = {};
//    json.title = $('#title').val();
//    json.icd = $('#ICD').val();
//    json.meta_private = $('#meta_private').is(':checked');
    $.ajax({
      url: '/newcase',
      type: 'POST',
      data: pageMeta(),
      statusCode: {
        403 : function() {alert('Forbidden - are you logged in?')},
        200 : function(msg) {document.location = msg}
      }
    });
  });

  $('#addstack', top.document).live({
    click: function() {
      $('#uploadarea').show();
    }
  });

  $('#sign_in').live({
    click: function() {
      openEasyOAuthBox('twitter', authcallback)
    }
  });

  $('#cancel_upload').live({
    click: function() {
      event.preventDefault();
      $('#uploadarea').hide();
    }
  });

  $('#feedbackbutton').live({
    click: function() {
      $('#feedback_dialog', top.document).show();
    }
  });

  $('#cancel_feedback').live({
    click: function() {
      $('#feedback_dialog', top.document).hide();
    }
  });

  $('#send_feedback').live({
    click: function() {
      var pathname = window.location.pathname.split('/');
      var feedback = {};
      var targeturl = '/case/' + pathname[2] + '/feedback';
      feedback.text = $('#feedback_text', top.document).val();
      feedback.toAuthor = $('#feedback_author', top.document).is(':checked');
//      feedback.toPublic = function() {
//        return $("#feedback_public", top.document).is(':checked') ? 1 : 0;
//      };
      feedback.toCurator = $('#feedback_curator', top.document).is(':checked');
      $.ajax({
        url: targeturl,
        type: 'POST',
        data: feedback,
        statusCode: {
          404: function() {alert('page not found')},
          200: function(response) {
            alert(response);
            $('#feedback_dialog', top.document).hide();
          },
          403: function() {alert('Forbidden')}
        }
      });
    }
  });

  $('.deletebutton').live({
    click: function() {
      $(this).parent().addClass('selected');
      $('#deleteradio_dialog').show();
    }
  });

  $('#deleteradio_cancel').live({
    click: function() {
      $('.selected').removeClass('selected');
      $('#deleteradio_dialog').hide();
    }
  });

  $('#deleteradio_confirm').live({
    click: function() {
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
    }
  });

  $('#show_save').live({
    click: function() {
      $('#save_dialog', top.document).show();
    }
  });

  $('#cancelsave').live({
    click: function() {
      $('#save_dialog', top.document).hide();
    }
  });

  $('#save').live({
    click: function(event) {
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
            $('#save_dialog', top.document).hide();
          },
          403: function() {alert('FORBIDDEN')}
        }
      });
    }
  });

  $('#meta_button').click(function() {
    $('#meta_dialog', top.document).show();
  });

  $('#meta_ok').click(function() {
    $('#meta_dialog', top.document).hide();
  });

  $('#help').click(function() {
    $('#markdown-help', top.document).show();
  });

  $('#closehelp').live({
    click: function() {
      $('#markdown-help', top.document).hide();
    }
  });

  $('#editbutton').live({
    click: function() {
      path = top.document.location.pathname.split('/');
      $('#editbar', top.document).attr('src', '/' + path[1] + '/' + path[2] + '/' + path[3] + '/edit').show();
      $(this).hide();
    }
  });

  $('#done').live({
    click: function() {
      editclose();
    }
  });

  $('#upload_new').live({
    click: function() {
      $('#uploadarea').hide();
      var iframe = $('<iframe name="postframe" id="postframe" class="hidden" src="about:none" />');
      $('#iframe').append(iframe);
      $('#uploadform').attr({
        target: 'postframe'
      });
      $('#uploadform').submit();
    }
  });

  $('#canceldelete').live({
    click: function() {
      $('#delete_dialog', top.document).hide();
    }
  });

  $('#deleteconfirmed').live({
    click: function() {
      $.ajax({
        type: 'DELETE',
        url: top.document.location.pathname,
        statusCode: {
          200: function() {
            window.parent.history.go(-2);
          }
        }
      });
    }
  });

  $('#delpage').live({
    click: function() {
      $('#delete_dialog', top.document).show();
    }
  });

  $('#upload').live({
    click: function() {
      $('#uploadarea').hide();
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
              '(double-click to change caption) </textarea>' +
              '<div class="md"></div></div></div>').insertBefore('#addstack');
      rendermd();
      $('.radio:last', top.document).append($('<button type="button" class="deletebutton">X</button>'));
    }
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
})
        ;
