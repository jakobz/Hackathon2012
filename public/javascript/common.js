$(function(){

    $('ul.nav>li').each(function(node) {
        if ($("a", this).attr('href') == window.location.pathname)
        {
            $(this).addClass('active');
        }
    });
});