var converter = new Showdown.converter();

var spinneropts = {
  lines: 12, // The number of lines to draw
  length: 7, // The length of each line
  width: 5, // The line thickness
  radius: 10, // The radius of the inner circle
  color: '#000', // #rbg or #rrggbb
  speed: 1, // Rounds per second
  trail: 100, // Afterglow percentage
  shadow: true // Whether to render a shadow
};
    
function scrollfunction(){
  $('.stack', top.document).mousewheel(function(event, delta){
    if (delta > 0) {
    $(this).css('background-position', parseInt($(this).css('background-position'),10) - parseInt($(this).css('width'),10));
    } else if (delta < 0) {
    $(this).css('background-position', parseInt($(this).css('background-position'),10) + parseInt($(this).css('width'),10));
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

  $(".stack", top.document).append($('<button type="button" class="deletebutton">Del</button>'));
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
  // alert(JSON.stringify(jsonpage));  
  return jsonpage;
}

$(function(){
  scrollfunction();

  var authcallback = function(data){
      $('.details').html('<p>You are all signed in as <strong>'
            +data.user.username+
            '</strong><br>...and here are some details:'
            +JSON.stringify(data.user)+
            '</p><a href="/logout">logout</a>').fadeIn('slow');
    }

    $('#twitbutt').click(function(){
      openEasyOAuthBox('twitter',authcallback);
    });

    $('#facebutt').click(function(){
       openEasyOAuthBox('facebook',authcallback);
    });

  $('.deletebutton').live({
    click: function(){
       $(this).parent().parent().remove();         
    }
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
      dataType: 'json',
      data: data,
      success: function(msg) {
        alert("Page Saved: " + msg);
      }
      });
  });

  $("#help").click(function(){
      $("#markdown-help", top.document).toggle();
  });

  $('#sendstring').live({
    click: function(){
      $.ajax({
        url: '/put-test',
        method: 'put'
      });
    }
  });

  $('#done').live({
    click: function(){
     $(".md", top.document).die();
     $(" .mdtxt", top.document).die();
     $("#markdown-help", top.document).hide();
     $("#editbar", top.document).hide().attr('src', 'about:none');
     $(".stack>.deletebutton", top.document).remove();
     $("#editbutton", top.document).show();
    }
  });

  $("#upload").live({
    click: function(){
    var userFile = $('#userfile').val();
    var iframe = $( '<iframe name="postframe" id="postframe" class="hidden" src="about:none" />');
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
    $('#column_1',top.document).append(
      "<div class='radio'><div url='', class='stack img512'></div>" +
      "<div class='caption'>" + 
      "<textarea class='mdtxt' style='display:none'>" +
      "(double-click to change caption) </textarea>" +
      "<div class='md'></div></div></div>");
    var spinner = new Spinner(spinopts).spin($('.radio:last>.stack', top.document));
    $('#postframe').load(
        function(){
          var url = $("iframe")[0].contentDocument.body.innerHTML;
          $('.radio:last>.stack', top.document).attr('url', url);
          // alert(imgid);
          $('.radio:last>.stack', top.document).removeClass('loading').css('background-image', 'url("/image/' + url + '")').append($('<button type="button" class="deletebutton">Del</button>'));
          scrollfunction();
          editfunctions();
          rendermd();
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
