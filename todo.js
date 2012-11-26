module.exports = function(app){
    app.get('/todo', index);
    app.post('/todo/addItem', addItem);
    app.post('/todo/changeItem', changeItem);
    app.post('/todo/clearItems', clearItems);
    
    var collections = ["todo"]
    var mongo = require("mongojs")
    var db = mongo.connect("localhost", collections)

    function index(req, res){
      db.todo.find().sort({"_id":1}, function(err, items){
        res.render('todo', { title: 'TODO List', items: items })
      })
    };

    function addItem(req, res) {
        var item = req.body.item
        item.checked = false
        db.todo.save(req.body.item, function() {
            res.render('todoItem', { item: item })
        }) 
    }

    function changeItem(req, res) {
        db.todo.update({_id: mongo.ObjectId(req.body.id)}, { $set: { checked : req.body.item.checked == "true" } })
    }

    function clearItems(req, res) {
        db.todo.remove({}, function() {
            res.json({ status: "ok"})        
        })
    }
}
