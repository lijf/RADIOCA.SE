  function editpage(){
    $(".md").live({
      dblclick: function() {
        $(this).hide();
        $(this).siblings(".mdtxt").show().focus();
      }
      }); // shows the textbox for editing upon doubleclick
    
    $(".mdtxt").live({
      blur: function() {
        $(this).hide();
        rendermd();
        $(this).siblings(".md").show();
      }
    }); // hides the textbox and renders the markdown

    $("#save").click(function(event){
      event.preventDefault();
      $.ajax({
        method: "PUT",
        url: "/case/#{caseid}/#{page}", // caseid and page are interpolated 
        });
    });

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
    }
