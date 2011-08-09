$(function(){
  var pathname = window.location.pathname;
  $(top.document).find(".md").live({
    dblclick: function() {
      $(this).hide();
      $(this).siblings(".mdtxt").show().focus();
    }
    }); // shows the textbox for editing upon doubleclick
  
  $(parent.document).find(".mdtxt").live({
  //  onkeyup: sz(this),
    blur: function() {
      $(this).hide();
      rendermd();
      $(this).siblings(".md").show();
    }
  }); // hides the textbox and renders the markdown

  $("#save").click(function(event){
    event.preventDefault();
    var caseidVal = $('#caseid[value]').val();
    var pageVal = $('#page[value]').val();
    //alert(caseidVal);
    //alert(pageVal);
    $.post("/case/", {
      "caseid" : caseidVal,
      "page" : pageVal
      });
  });

    var txt = [];
    txt += $(".mdtxt").map(function(){
        return($(this).val());
      }).get();
    $("#texts").val(txt);
    //          alert(txt);  
    var iframe = $( '<iframe name="postframe" id="postframe" class="hidden" src="about:none" />');
    $('#iframe').append(iframe);

    
    $('#savepage').attr({
      action: "/case/",
      method: "post",
      caseid: caseid,
      page: "1",
      target: "postframe"
    });

    $('#savepage').submit();
  });

  //$('form').submit(function() {
  //  alert($(this).serialize());
  //});

  $("#upload").click(function(){
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
    $('#leftcolumn').append("<div class='stack'></div>");
    $('#postframe').load(
        function(){
          var imgid = $("iframe")[0].contentDocument.body.innerHTML;
          $('.stack:last').css('background-image', 'url("/image/' + imgid + '")');
          scrollfunction();
        });
  });
});
