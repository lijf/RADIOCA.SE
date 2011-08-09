$(function(){

    $('#editbar').hide();
    var converter = new Showdown.converter();
    //    alert(editurl);
    
    function rendermd(){ 
        alert('rendermd called');
        $(".txt>.md").html(function(){
        var markdown = $(this).siblings(".mdtxt").val();
        // alert(markdown);
        var html = converter.makeHtml(markdown);
        alert(html);
        return html;
        });
    }

    rendermd(); // renders the markdown textareas.

    $('#editbutton').click(function(){
      $('#editbar').show();
      $.ajax({
        url: window.location.pathname + "edit",
        method: "GET",
        success: function(response){
          if(!response){
            $('#editbar').html('Denied');
            }
          else{ 
            $('#editbar').html(response);
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
          }
        }
      });
    });
  });
