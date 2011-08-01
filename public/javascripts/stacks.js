$(function() {
  var xpos=0;
  var ypos=0;
  $('.stack').mousewheel(function(event, delta) {
    if (delta > 0) {
    $(this).css('background-position', parseInt($(this).css('background-position')) - parseInt($(this).css('width')));
    } else if (delta < 0) {
    $(this).css('background-position', parseInt($(this).css('background-position')) + parseInt($(this).css('width')));
    }
    event.preventDefault();
  });
  $('.stack').dblclick(function(event) {
    if (!$(this).hasClass('maximized')){
      $(this).css('height', $(window).height());
      $(this).css('width', $(window).height());
      xpos = $(this).css('left');
      ypos = $(this).css('top');
      $(this).css('top', 0);
      $(this).css('left', 0);
      $(this).addClass('maximized');

    } else {
      $(this).css('height', parseInt($(this).css('min-height')));
      $(this).css('width', parseInt($(this).css('min-height')));
      $(this).css('top', ypos);
      $(this).css('left', xpos);
      $(this).removeClass('maximized');
    }
  });
});

