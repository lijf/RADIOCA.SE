var converter = new Showdown.converter();

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

function stack_height(){
    $('.stack').css('height', parseInt($(this).children(':first').children(':first').css('height')))
}

function scrollfunction_3(){
    $('.stack_window', top.document).mousewheel(function(event, delta){
       movey = $(this).children(':first').css('height');
       console.log(movey);
       if(delta > 0) {
           $(this).css('top', parseInt($(this).css('top'), 10) + movey);
           console.log($(this).css('top'));
       }
        else if(delta < 0){
           $(this).css('top', parseInt($(this).css('top'), 10) - movey);
       }
       console.log(delta);
       event.preventDefault();
    });

}

function scrollfunction(){
    $('.stack > .stack_image', top.document).scroll(function(event, delta){
        if(delta > 0) {
            if($(this).next().length > 0){
                $(this).next().show();
                $(this).hide();
            }

        } else if (delta < 0){
            if($(this).prev().length > 0){
               $(this).prev().show();
               $(this).hide();
            }
        }
        //console.log(delta);
        //event.preventDefault();
    });

}

function scrollfunction_old(){
  $('.stack', top.document).mousewheel(function(event, delta){
    var movex = parseInt($(this).css('width'),10);
    if (delta > 0) {
    $(this).css('background-position', parseInt($(this).css('background-position'),10) - movex);
    } else if (delta < 0) {
    $(this).css('background-position', parseInt($(this).css('background-position'),10) + movex);
    }
    event.preventDefault();
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

  $(".stack", top.document).append($('<button type="button" class="deletebutton">X</button>'));
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
 $(".stack>.deletebutton", top.document).remove();
 $("#editbutton", top.document).show();
 $("#newpage").hide();
}

function spiderpage(){

  var jsonpage = {};
  jsonpage.title = $("title", top.document).html();
  // alert(jsonpage.title);
  jsonpage.radios = $(".radio", top.document).map(function(){
    var radio = {};
    radio.img = $(this).children('.stack').attr("url");
    radio.caption = $(this).children('.caption').children('.mdtxt').val();
    // alert(JSON.stringify(radio));
    return radio;
  }).get();
  jsonpage.texts = $(".txt>.mdtxt", top.document).map(function(){
    return($(this).val());
  }).get();
  //jsonpage.users = [];
  //jsonpage.users += '56831686';
  // alert(JSON.stringify(jsonpage));  
  return jsonpage;
}

function sessionButton(user){
    $('#session').html('<button id="sign_out">Sign out ' + user + '</button>');
}

var authcallback = function(data) {
    sessionButton(data.user.username);
    $('#twitbutt', top.document).hide();
    $.ajax({
       url: '/signed_in',
       success: function(data){
           if(data=='new user'){
               $('#info').html('new user').show();
           }
       }
    });
    $('#feedbackbutton').attr("id","editbutton").html("Edit");
};

$(function(){
  scrollfunction();
  $('.stack').children(':first').show();

  //$('.stack').css('height', parseInt($(this).children(':first').css('height')))

  //  $('.radio')
//      .load(function(){
//       alert(this.attr('src'));
//       //$(this).parent.attr('url',$(this).attr('src'));
//       })
//      .each(function(){
//      if( this.complete && this.naturalWidth !== 0) {
//          $(this).trigger('load');
//      }
//   });

  $('#sign_out').live({
      click: function(){
            window.open('http://twitter.com/#!/logout');
          $.ajax({
                url: '/sign_out',
                success: function(data){
                    editclose();
                    $('#editbutton').hide();
                    $('#session').html(data);
                }
            });
        $('#editbutton').attr("id","feedbackbutton").html("Feedback");
        $('#feedbackbutton').show();
        }
  });

  $("#newpage").live({
      click: function(){
        var pathname=parent.window.location.pathname.split('/');
        var json = {};
        json.title = $("title", top.document).html();
        var pageno=parseInt(pathname[3])+1;
        var targeturl = '/case/' + pathname[2] + '/' + pageno;
        $.ajax({
            url: targeturl,
            type: 'PUT',
            dataType: 'text/html',
            data: json,
            statusCode: {
                404: function() {
                    alert('page not found')},
                200: function() {
                    alert('OK - created new page');
                    parent.change_url(targeturl);
                    },
                403: function(){
                    alert('Forbidden')
                }

            }
        });
      }
  });

  $("#createcase").click(function(){
      var json = {};
      json.title = $('#title').val();
      json.icd = $('#icd').val();
      // alert(JSON.stringify(json));
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

  $("#save").click(
    function(event){
    event.preventDefault();
    var data = spiderpage();
    //alert(JSON.stringify(data));
    var url = $("#savepage").attr("action").toString();
    //alert(url);
    $.ajax({
      type: 'PUT',
      url: url,
      data: data,
      success: function(msg) {
        alert("Page Saved: " + msg);
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
        editclose();
    }
  });

  $("#upload").live({
    click: function(){
    $('#uploadarea').hide();
    var userFile = $('#userfile').val();
    var iframe = $('<iframe name="postframe" id="postframe" class="hidden" src="about:none" />');
    $('#iframe').append(iframe);

    $('#uploadform').attr({
      action: "/image/",
      method: "POST",
      userfile: $('#userfile').val(),
      enctype: "multipart/form-data",
      encoding: "multipart/form-data",
      target: "postframe"
    });
    $('#uploadform').submit();
    // create the new div, when image processed, set it as background
    $('#radios', top.document).append(
      "<div class='radio'><div url='', class='stack img512'></div>" +
      "<div class='caption'>" + 
      "<textarea class='mdtxt' style='display:none'>" +
      "(double-click to change caption) </textarea>" +
      "<div class='md'></div></div></div>");
    rendermd();
    $('.radio:last>.stack', top.document).append($('<button type="button" class="deletebutton">X</button>'));

    $('.radio:last>.stack', top.document).spin();
    $('#postframe').load(
        function(){
          var url = $("iframe")[0].contentDocument.body.innerHTML;
          $('.radio:last>.stack', top.document).attr('url', url);
          // alert(imgid);
          scrollfunction();
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
