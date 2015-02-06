
$(function(){

    var sendVote = function(personId, vote) {
        jQuery.post('votePerson', {
            personId: personId,
            vote: vote
        }).done(function(response) {
                $('.groups').parent().html(response);
            });


    }

    $('#new_group_button').live('click', function() {
        jQuery.post('addGroup', {
            groupId: 0
        }).done(function(response) {
                $('#groups').parent().html(response);
            });
    });

    $('.remove-group-btn').live('click', function() {
        var groupId = $(this).attr('data-id');
        jQuery.post('removeGroup', {
            groupId: groupId
        }).done(function(response) {
                $('#groups').parent().html(response);
            });
    });

    $('.group-name-input').live('change', function() {
        var groupName = $(this).attr('value');
        var groupId = $(this).attr('data-id');
        var groupCapacity = $('.group[data-id=' + groupId + ']').find('.group-capacity-input').attr('value');
        jQuery.post('editGroup', {
            groupId: groupId,
            name: groupName,
            capacity: groupCapacity
        });
    });

    $('.group-capacity-input').live('change', function() {
        var groupCapacity = $(this).attr('value');
        var groupId = $(this).attr('data-id');
        var groupName = $('.group[data-id=' + groupId + ']').find('.group-name-input').attr('value');
        jQuery.post('editGroup', {
            groupId: groupId,
            name: groupName,
            capacity: groupCapacity
        });
    });

    $('.r-1').live('click', function() {
        sendVote($(this).parent().parent().attr('data-id'), -1);
    });

    $('.r0').live('click', function() {
        sendVote($(this).parent().parent().attr('data-id'), 0);
    });

    $('.r1').live('click', function() {
        sendVote($(this).parent().parent().attr('data-id'), 1);
    });

    $('.r2').live('click', function() {
        sendVote($(this).parent().parent().attr('data-id'), 2);
    });

    $('.remove-person').live('click', function() {
        var personId = $(this).parent().parent().attr('data-id');
        jQuery.post('removePerson', {
            personId: personId
        }).done(function(response) {
            $('#groups').parent().html(response);
        });
    });


})