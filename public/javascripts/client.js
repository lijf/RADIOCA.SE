var converter = new Showdown.converter();

// Use $('a').touchOrClick instead of $('a').click in your code.
jQuery.fn.touchOrClick = function(efunc) {
    if (typeof efunc == 'undefined') {
        return this.trigger(supportsTouch() ? 'touchstart' : 'click');
    } else {
        return this.bind(supportsTouch() ? 'touchstart' : 'click', efunc);
    }
};

var opts = {
  lines: 12, // The number of lines to draw
  length: 7, // The length of each line
  width: 4, // The line thickness
  radius: 10, // The radius of the inner circle
  color: '#fff', // #rbg or #rrggbb
  speed: 1, // Rounds per second
  trail: 33, // Afterglow percentage
  shadow: true // Whether to render a shadow
};

var lastScrollTop = 0;

$.fn.spin = function(opts) {
    this.each(function() {
      var $this = $(this),
          data = $this.data();

      if (data.spinner) {
        data.spinner.stop();
        delete data.spinner;
      }
      if (opts !== false) {
        data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
      }
    });
    return this;
  };
    
function change_url(url){ document.location=url; }

function scrollfunction_mw(){
    $('.stack > .stack_image', top.document).mousewheel(function(event, delta){
        if(delta > 0) {
            if($(this).next().length > 0){
                $(this).css('display','none');
                $(this).prev().css('display','none');
                $(this).next().css('display','inline');
            }

        } else if (delta < 0){
            if($(this).prev().length > 0){
               $(this).css('display','none');
               $(this).next().css('display','none');
               $(this).prev().css('display','inline');
            }
        }
        //console.log(delta);
        event.preventDefault();
    });
}

var lastY = 0;
var samp = 0;

function touchscroll(){
    $('.stack > .stack_image', top.document).each( function(){
        var visimg = $(this);
        this.ontouchstart = function(e){
            return visimg = $(this);
        };
        this.ontouchmove = function(e){
            if(e.targetTouches.length == 3){
                samp++;
                if(samp==3){
                  samp = 0;
                  var touch = e.touches[0];
                  if(parseInt(touch.pageY,10) > lastY){
                      //log('movedown');
                      if(visimg.prev().length > 0){
                          visimg.hide();
                          visimg.next().hide();
                          visimg.prev().show();
                          visimg=visimg.prev();
                      }
                  }else{
                      //log('moveup');
                      if(visimg.next().length > 0){
                          visimg.hide();
                          visimg.prev().hide();
                          visimg.next().show();
                          visimg=visimg.next();
                      }
                  }
                  log(parseInt(touch.pageY, 10));
                  return lastY = parseInt(touch.pageY,10);
                }
            e.preventDefault();
        }
    }
    });
}

function rendermd(){ 
  $('.md', top.document).html(function(){
     var markdown = $(this).siblings(".mdtxt").val();
     return converter.makeHtml(markdown);
  });
}

function editfunctions(){
    $(".md", top.document).live({
    dblclick: function() {
      $(this).hide();
      $(this).siblings(".mdtxt").show().focus().autogrow();
    }
  }); // shows the textbox for editing upon doubleclick

  $(".mdtxt", top.document).live({
    blur: function() {
      $(this).hide();
      rendermd();
      $(this).siblings(".md").show();
    }
  }); // hides the textbox and renders the markdown

  $(".radio", top.document).append($('<button type="button" class="deletebutton">X</button>'));
    // adds deletebutton to stacks
  $("#addstack", top.document).show();
  // $('#newpage', top.document).show();
}

function editclose(){
 $(".md", top.document).die();
 $(".mdtxt", top.document).die();
 $("#markdown-help", top.document).hide();
 $("#addstack", top.document).hide();
 $("#uploadarea", top.document).hide();
 $("#editbar", top.document).hide().attr('src', 'about:none');
 $(".radio>.deletebutton", top.document).remove();
 $("#editbutton", top.document).show();
}

function spiderpage(){
  var jsonpage = {};
  jsonpage.title = $("title", top.document).html();
  jsonpage.radios = $(".radio", top.document).map(function(){
    var radio = {};
    radio.images = $(this).children('.stack').children('.stack_image').map(function(){
       return($(this).attr('src'));
    }).get();
    radio.caption = $(this).children('.caption').children('.mdtxt').val();
    return radio;
  }).get();
  jsonpage.texts = $(".txt>.mdtxt", top.document).map(function(){
    return($(this).val());
  }).get();
  return jsonpage;
}

function sessionButton(user){
    $('#session').html('<button id="sign_out">Sign out ' + user + '</button>');
}

var authcallback = function(data) {
    $.ajax({
       url: '/signed_in',
       statusCode: {
           200: function(){
                sessionButton(data.user.username);
                $('#twitbutt', top.document).hide();
                $('#feedbackbutton').attr("id","editbutton").html("Edit");
                if(data=='new user'){
                $('#info').html('new user').show();}},
           403: function(data){
                alert('not allowed - if you feel that this is an error, please write to info@radioca.se');
           }
       }
    });
};

$(function(){

  touchscroll();
  scrollfunction_mw();
    
  $('.stack').children(':first').show();

  $('#sign_out').live({
      click: function(){
            window.open('http://twitter.com/#!/logout');
          $.ajax({
                url: '/sign_out',
                statusCode: {
                    200: function(data){
                         editclose();
                         $('#editbutton').hide();
                         $('#session').html(data);
                }}
            });
        $('#editbutton').attr("id","feedbackbutton").html("Feedback");
        $('#feedbackbutton').show();
        }
  });

  $("#newpage").click(function(){
        var pathname=parent.window.location.pathname.split('/');
        var json = {};
        json.title = $("title", top.document).html();
        var targeturl = '/case/' + pathname[2] + '/newpage';
        $.ajax({
            url: targeturl,
            type: 'POST',
            data: json,
            statusCode: {
                404: function() {
                    alert('page not found')
                },
                200: function(redirect) {
                    $('#save').trigger('click');
                    parent.change_url(redirect);
                },
                403: function(){
                    alert('Forbidden')
                }
            }
        });
  });

  $("#createcase").click(function(){
      var json = {};
      json.title = $('#title').val();
      json.icd = $('#ICD').val();
      json.private = $('#private').is(':checked');
      $.ajax({
          url: '/newcase',
          type: 'POST',
          data: json,
          statusCode: {
              403 : function(){alert('Forbidden - are you logged in?')},
              200 : function(msg){document.location=msg}
          }
      });
  });

  $("#addstack", top.document).live({
    click: function(){
        $("#uploadarea").show();
    }
  });

  $('#twitbutt').live({
      click: function(){
        openEasyOAuthBox('twitter',authcallback)
    }
  });

  $('#cancelupload').live({
      click: function(){
          $("#uploadarea").hide();
      }
  });

  $('#facebutt').click(function(){
      openEasyOAuthBox('facebook',authcallback);
  });

  $('.deletebutton').live({
    click: function(){
       $(this).parent().parent().remove();         
    }
  });

  $('.stack').live('toggleSpinner', function(){
          alert('toggleSpinner triggered');
          $(this).spin(opts);
  });

  $("#save").click(function(event){
    event.preventDefault();
    var data = spiderpage();
    var url = $("#savepage").attr("action").toString();
    $.ajax({
      type: 'PUT',
      url: url,
      data: data,
      success: function(msg) {
        //alert("Page Saved: " + msg);
      }
    });
  });

  $("#help").click(function(){
      $("#markdown-help", top.document).show();
  });

  $("#closehelp").live({
      click: function(){
      $("#markdown-help", top.document).hide();
      }
  });

  $('#editbutton').live({
      click: function(){
      path=top.document.location.pathname.split("/");
      $('#editbar', top.document).attr('src', "/" + path[1] + "/" + path[2] + "/" + path[3] + "/edit").show();
      $(this).hide();
      }
  });

  $('#done').live({
    click: function(){
        $('#save').trigger('click');
        editclose();
    }
  });

  $("#upload_new").live({
     click: function(){
         $('#uploadarea').hide();
         var iframe = $('<iframe name="postframe" id="postframe" class="hidden" src="about:none" />');
         $('#iframe').append(iframe);
         $('#uploadform').attr({
             target: "postframe"
      });
      $('#uploadform').submit();
     }
  });

  $('#canceldelete').live({
     click: function(){
         $('#delete_dialog', top.document).hide();
     }
  });

  $('#deleteconfirmed').live({
      click: function(){
          $.ajax({
              type: 'POST',
              url: $('#deletepage').attr('action'),
              statusCode: {
                  200: function(){
                      alert('page deleted');
                      window.parent.history.go(-2);
                  }
              }
          });
      }
  });

  $('#delpage').live({
      click: function(){
          $('#delete_dialog', top.document).show();
      }
  });

  $("#upload").live({
    click: function(){
    $('#uploadarea').hide();
    var userFile = $('#userfile').val();
    $('#uploadform').attr({
      action: "/image/",
      method: "POST",
      userfile: userFile,
      enctype: "multipart/form-data",
      encoding: "multipart/form-data",
      target: "postframe"
    });
    $('#uploadform').submit();
    $("<div class='radio'><div class='stack'></div>" +
      "<div class='caption'>" + 
      "<textarea class='mdtxt' style='display:none'>" +
      "(double-click to change caption) </textarea>" +
      "<div class='md'></div></div></div>").insertBefore('#addstack');
    rendermd();
    $('.radio:last', top.document).append($('<button type="button" class="deletebutton">X</button>'));

    //$('.radio:last>.stack', top.document).spin();
    $('#postframe').one('load',
        function(){
          //alert("postframe triggered");
          var i =0;
          var url = $("iframe")[0].contentDocument.body.innerHTML.split('|');
          //alert("id" + url[0] + "images:" + url[1]);
          while(i<url[1]){
            $('.radio:last>.stack', top.document).append(
            '<img class="stack_image" src="/image/' + url[0] + '.' + i + '"/>');
              i++;
          // alert(imgid);
          }
          scrollfunction_mw();
          $('.stack:last').children(':first').show();
          //editfunctions();
        });
     }
  });

    /*
     * Auto-growing textareas; technique ripped from Facebook
     */
    $.fn.autogrow = function(options) {



        this.filter('textarea', top.document).each(function() {
            
            var $this       = $(this),
                minHeight   = $this.height(),
                lineHeight  = $this.css('lineHeight');
            
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
                                    .replace(/ {2,}/g, function(space) { return times('&nbsp;', space.length -1) + ' ' });
                
                shadow.html(val);
                $(this).css('height', Math.max(shadow.height() + 20, minHeight));
            
            }
            
            $(this).change(update).keyup(update).keydown(update);
            
            update.apply(this);
            
        });
        
        return this;
        
    }
});
