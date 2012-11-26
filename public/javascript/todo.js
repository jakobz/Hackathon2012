$("#newItemInput").keyup(function() {
    $("#addButton").attr("disabled", $("#newItemInput").val().trim() == "")
})

$("#addButton").click(function() {
    $.post('todo/addItem', $('#newItemForm').serialize(), function(response) {
        $("#todoList").append(response)
        $("#newItemInput").val("")
        $("#addButton").attr("disabled", true)
    })
    return false
})

$(".todoCheckbox").live("change", function(event) {
    var itemID = event.srcElement.id
    var checked = event.srcElement.checked
    $.post('todo/changeItem', { id : itemID, item: { checked : checked } }, function() {
        console.log(id, checked)
    })
    return false
})

$("#clearButton").click(function(event) {
    $.post('todo/clearItems', function() {
        $("#todoList").html("")
    })
    return false
})