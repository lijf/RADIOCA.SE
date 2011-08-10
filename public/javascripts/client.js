var converter = new Showdown.converter();
    
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
  $('.txt>.md').html(function(){
     var markdown = $(this).siblings(".mdtxt").val();
     var html = converter.makeHtml(markdown);
     return html;
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

$(function(){
  scrollfunction();


  $('.deletebutton').live({
    click: function(){
       $(this).parent().remove();         
    }
  });


  $("#save").live({
    click: function(event){
    event.preventDefault();
    $.ajax({
      method: "PUT",
      url: "/case/#{caseid}/#{page}", // caseid and page are interpolated 
      });
    }
  });

  $('#done').live({
    click: function(){
     $(".md", top.document).die();
     $(".mdtxt", top.document).die();
     $("#editbar", top.document).hide();
     $("#editbar", top.document).attr('src', 'about:none');
     $(".stack>.deletebutton", top.document).remove();
    }
  });

  $("#upload1").live({
    click: function(){
      var userFile = $('#userfile').val();
      alert(userFile);
      $.ajax({
        method: "post",
        url: "/image/",
        userfile: userFile,
        enctype: "multipart/form-data",
        encoding: "multipart/form-data",
        success: function(response){
          $('#leftcolumn', top.document).append($('<div class="stack"></div>'));
          $('.stack:last', top.document).css('background-image', 'url("/image/' + response + '")');
          scrollfunction();
        }
      });
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
      userfile: userFile,
      enctype: "multipart/form-data",
      encoding: "multipart/form-data",
      target: "postframe"
    });
    $('#uploadform').submit();
    // create the new div, when image processed, set it as background
    $('#leftcolumn', top.document).append("<div class='stack'></div>");
    $('.stack:last', top.document).addClass('loading');     
    $('#postframe').load(
        function(){
          var imgid = $("iframe")[0].contentDocument.body.innerHTML;
          // alert(imgid);
          $('.stack:last', top.document).removeClass('loading').css('background-image', 'url("/image/' + imgid + '")').append($('<button type="button" class="deletebutton">Del</button>'));
          scrollfunction();
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
