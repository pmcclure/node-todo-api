var express = require('express');
var bodyParser = require('body-parser');
var {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose')
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express(app);
const port = process.env.PORT || 3000;

//Mongoose's mpromise library is deprecated. Use the built in promise library with this line
mongoose.Promise = global.Promise;

app.use(bodyParser.json());

//POST
app.post('/todos', (req, res) => {
    var todo = new Todo({
        text: req.body.text
    });

    todo.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });

});

//GET /todos
app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({ todos });
    }, (e) => {
        res.status(400).send(e);
    });
});


//GET /todos:id
app.get('/todos/:id', (req, res) => {
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findById(id).then((todo) => {
        if (!todo) {
            return res.status(404).send();          
        }

        res.send({ todo });

    }).catch((e) => {
        res.status(400).send();
    });
});

app.listen(port, () => {
    console.log(`running on port ${port}`)
});

module.exports = { app };