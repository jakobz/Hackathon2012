module.exports = function(app){
    app.get('/', index);
    app.get('/create', create);
    app.get('/newUser/:id', newUserPage);
    app.post('/newUser/:id', createNewUser);
    app.get('/edit/:id', edit);
    app.post('/edit/:id/addGroup', addGroup);
    app.post('/edit/:id/removeGroup', removeGroup);
    app.post('/edit/:id/editGroup', editGroup);
    app.post('/edit/:id/votePerson', votePerson);
    app.post('/edit/:id/removePerson', removePerson);
    
    var collections = ["users", "pages", "guestLinks"]
    var mongo = require("mongojs")
    var db = mongo.connect("localhost", collections)

    var testData = {
        groups: [
            { id: 1, name: "группа 1", capacity: 5,
                persons: [
                    { name : "Yakov Zhmurov", mood: 0, relation: 1 },
                    { name : "Artem Zhmurov", mood: 1, relation: 2 },
                    { name : "Vasya", mood: 2, relation: 3 }
                ]
            },
            { id: 2, name: "группа 2", capacity: 3,

            },
            { id: 3, name: "группа 3", capacity: 4,
                persons: [
                    { name : "Petr Petrov", mood: 2, relation: 0 }
                ]
            }
        ]
    }

    function create(req, res) {
        var template = {
            groups: [
                { id: 1, name: "Кучка 1", capacity: 5},
                { id: 2, name: "Кучка 2", capacity: 5}
            ],
            persons: {}
        }
        var guestLink = {}
        db.pages.save(template, function(err) {
            guestLink.pageID = template._id.toString()
            db.guestLinks.save(guestLink, function(err) {
                template.guestLinkID = guestLink._id.toString()
                db.pages.save(template, function(err) {
                    res.redirect("/edit/" + template._id.toString() + "/")
                })
            })
        })
    }

    function newUserPage(req, res) {
        db.guestLinks.find({_id: mongo.ObjectId(req.params.id)}, function(err, found) {
            if (found.length == 1) {
                res.render("newUser")
            }
        })
    }

    function createNewUser(req, res) {
        db.guestLinks.find({_id: mongo.ObjectId(req.params.id)}, function(err, found) {
            var guestLink = found[0]
            var newUser = {
                name: req.body.username,
                pageID: guestLink.pageID
            }
            db.pages.find({_id: mongo.ObjectId(guestLink.pageID)}, function(err, found){
                db.users.save(newUser, function(err) {
                    var page = found[0]
                    page.persons[newUser._id.toString()] = {
                        id: newUser._id.toString(),
                        name: newUser.name,
                        votes: {}
                    }

                    db.pages.save(page, function() {
                        res.redirect("/edit/" + newUser._id + "/")
                    })
                })               
            })
        })
    }    

    function index(req, res) {
      res.locals.title = "Home"
      res.render("index")
    };

    function renderEdit(data, res) {
        res.locals.title = "Edit|" + (data.isAdmin ? "Admin mode" : "User mode")
        res.locals.data = distributePersons(data)
        res.render("edit")
    }

    function renderAjaxEdit(data, res) {
        res.locals.title = "Edit|" + (data.isAdmin ? "Admin mode" : "User mode")
        res.locals.data = distributePersons(data)
        res.render("_groups")
    }

    function withPage(id, f) {
        db.pages.find({_id: mongo.ObjectId(id)}, function(err, found) {
            if (found.length == 1) {
                var data = found[0];
                data.isAdmin = true
                data.guestLink = "http://localhost:3000/newUser/" + data.guestLinkID + "/"               
                f(data)
            } else {
                db.users.find({_id: mongo.ObjectId(id)}, function(err, found) {
                    var user = found[0]
                    db.pages.find({_id: mongo.ObjectId(user.pageID)}, function(err, found){
                        var data = found[0]
                        data.user = user
                        data.userName = user.name
                        data.isAdmin = false
                        data.guestLink = "http://localhost:3000/newUser/" + data.user._id + "/"  
                        f(data)
                    })
                })
            }
        })
    };

    function edit(req,res) {
        withPage(req.params.id, function(data) {
            renderEdit(data,res)
        });
    }

    function getLastID(data) {
        var id = 0;
        data.groups.forEach(function(group) {
            id = Math.max(id, group.id)
        })
        return id + 1;
    }

    function findGroupIndex(data, id) {
        var index = -1; 
        data.groups.forEach(function(group, i) {
            if(group.id == id) {
                index = i
            }
        })
        return index
    }

    function ajaxModifyPage(req, res, f) {
        withPage(req.params.id, function(data) {
            var data = f(data)

            db.pages.save(data, function() {
                renderAjaxEdit(data, res)
            })
        });        
    }

    function addGroup(req, res) {
        ajaxModifyPage(req, res, function(data) {
            var newGroupID = getLastID(data)
            var newGroup = { id: newGroupID, name: "Кучка " + newGroupID, capacity: 5}
            data.groups.push(newGroup)
            return data;
        })
    }

    function removeGroup(req, res) {
        ajaxModifyPage(req, res, function(data) {
            var index = findGroupIndex(data, req.body.groupId)
            if (index >= 0) {
                data.groups.splice(index, 1); 
            }
            return data
        })
    }

    function removePerson(req, res) {
        ajaxModifyPage(req, res, function(data) {
	    console.log("Request")
            console.log(JSON.stringify({ person: req.body.personId, page: req.pageId }, null, 2))
	    console.log("Before")
            console.log(JSON.stringify(data, null, 2))
            delete data.persons[req.body.personId]
	    for(var personId in data.persons) {
              delete data.persons[personId].votes[req.body.personId]
	    }
	    console.log("After")
            console.log(JSON.stringify(data, null, 2))
            return data
        })
    }	

    function editGroup(req, res) {
        ajaxModifyPage(req, res, function(data) {
            var index = findGroupIndex(data, req.body.groupId)
            var group = data.groups[index]
            group.name = req.body.name
            group.capacity = req.body.capacity
            return data
        })
    }

    function votePerson(req, res) {
        ajaxModifyPage(req, res, function(data) {
            data.persons[req.params.id].votes[req.body.personId] = parseInt(req.body.vote)
            return data
        })
    }

    function distributePersons(data) {
        var myVotes = {} 
        if (data.user) {
            myVotes = data.persons[data.user._id].votes
        }
        // clean up groups
        for(var groupN = 0; groupN < data.groups.length; groupN++) {
            data.groups[groupN].persons = []
            data.groups[groupN].groupN = groupN
        }

        var personsQueue = []
        var personWithPlus2 = []
        var restPersons = []

        for(var personID in data.persons) {
            var person = data.persons[personID]
            var vote = myVotes[data.persons[personID].id]
            person.vote = vote || 0
            if (data.user) {
                person.isMe = personID == data.user._id
            }
            person.groupN = null

            var hasPlus2 = false
            for(var votedID in person.votes) {
                if (person.votes[votedID] == 2) {
                    hasPlus2 = true
                }
            }
            for(var personID in data.persons) {
                if (data.persons[personID].votes[person.id] == 2) {
                    hasPlus2 = true
                }
            }

            if (hasPlus2) {
                personWithPlus2.push(person)               
            } else {
                restPersons.push(person)
            }
        }

        personsQueue = restPersons.concat(personWithPlus2)
        console.log(personWithPlus2)

        function getVoteValue(p1, p2) {
            var raw = data.persons[p1.id].votes[p2.id] || 0
            if (raw == -1) {
                raw = -2
            } 
            // else if (raw == 2) {
            //     raw = 4
            // }
            return raw
        }        

        function getMoodInGroup(group, placedPerson) {
            var mood = 0;
            group.persons.forEach(function(person) {
                mood += getVoteValue(placedPerson, person)
            })
            for(var votedID in placedPerson.votes) {
                if (placedPerson.votes[votedID] == 2) {
                    var plus2Ok = false
                    group.persons.forEach(function(votedPerson) {
                        if (votedPerson.id == votedID) {
                            plus2Ok = true
                        }
                    })

                    if (!plus2Ok) {
                        mood -= 20
                    }                
                }
            }

            return mood;
        }

        function getGroupScore(persons) {
            var mood = 0;
            persons.forEach(function(p1) {
                persons.forEach(function(p2){
                    if (p1 != p2) {
                        mood += getVoteValue(p1, p2)
                    }
                })
            })
            return mood;            
        }

        function moveToGroup(person, group) {
            if (person.groupN != null) {
                var prevGroup = data.groups[person.groupN]
                prevGroup.splice(prevGroup.indexOf(person), 1);
            }
            group.persons.push(person)
            person.groupN = groupN
        }

        var nonDistributed = []
        var person = null;        

        while(person = personsQueue.pop()) {
            var chosenGroup = null;
            var maxScore = -10000;
            for(var groupN = 0; groupN < data.groups.length; groupN++) {
                var group = data.groups[groupN];
                if (group.persons.length < group.capacity) {
                    var persons = group.persons.slice()   
                    var scoreBefore = getGroupScore(persons)                 
                    persons.push(person)
                    var scoreAfter = getGroupScore(persons)
                    var deltaScore = scoreAfter - scoreBefore

                    if (deltaScore > maxScore) {
                        maxScore = deltaScore
                        chosenGroup = group
                    }
                }
            }

            if (chosenGroup) {
                moveToGroup(person, chosenGroup)
            } else {
                nonDistributed.push(person)
            }
        }

        data.groups.forEach(function(group) {
            group.persons.forEach(function(person) {
                var mood = getMoodInGroup(group, person)
                person.rawMood = mood
                person.mood = (mood < 0) ? 2 : 1
            })
        })

        if (nonDistributed.length > 0) {
            data.groups.push({
                id: -1,
                name: "Не влезли",
                capacity: 0,
                persons: nonDistributed          
            })
        }

        console.log(JSON.stringify(data.persons))

        return data
    }
}
