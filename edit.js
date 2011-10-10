var converter = new Showdown.converter();
    
function rendermd(){ 
  $('.txt>.md').html(function(){
     var markdown = $(this).siblings(".mdtxt").val();
     var html = converter.makeHtml(markdown);
     return html;
  });
}

$(function(){
  $(".md", top.document).live({
    dblclick: function() {
      $(this).hide();
      $(this).siblings(".mdtxt").show().focus();
    }
  }); // shows the textbox for editing upon doubleclick
  
  $(".mdtxt", top.document).live({
    blur: function() {
      $(this).hide();
      rendermd();
      $(this).siblings(".md").show();
    }
  }); // hides the textbox and renders the markdown

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
    }
  });

  $("#upload").live({
    click: function(){
    var userFile = $('#userfile').val();
    var iframe = $( '<iframe name="postframe" id="postframe" class="hidden" src="about:none" />');
    $('#iframe').append(iframe);

    $('#uploadform').attr({
      action: "/image/",
      method: "post",
      userfile: userFile,
      enctype: "multipart/form-data",
      encoding: "multipart/form-data",
      target: "postframe"
    });
    $('#uploadform').submit();
    // create the new div, when image processed, set it as background
    $('#leftcolumn', top.document).append("<div class='stack'></div>");
    $('#postframe').load(
        function(){
          var imgid = $("iframe")[0].contentDocument.body.innerHTML;
          $('.stack:last', top.document).css('background-image', 'url("/image/' + imgid + '")');
          scrollfunction();
        });
     }
  });
});
