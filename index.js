const express = require('express')
const mongoose = require('mongoose')
const authRouter = require('./authRouter')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const {config} = require("dotenv");
const secret = require("./config")
const PORT = process.env.PORT || 5000
const session = require('express-session');
const User = require('./models/User')
const bcrypt = require('bcryptjs');
const Role = require('./models/Role')
const Record = require('./models/Record')

const exphbs = require('express-handlebars');
const path = require("path");
const {validationResult} = require("express-validator");



require('dotenv').config();



const uri = process.env.MONGODB;


const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })


const app = express()
// настройка Handlebars как шаблонизатора
app.use(jsonParser)
app.set("view engine", "ejs");
app.use(session({
    secret: 'secret-key', // секретный ключ для подписания cookie
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }
}));
app.use(cookieParser());
app.use(express.urlencoded());
app.use(express.static(__dirname))
app.use(express.json())
app.use("/auth",urlencodedParser, authRouter)



app.get('/', (req, res)=>{
    const userId = req.session.userId;
    // если пользователь авторизован, отображаем дашборд
    if (userId) {
        //const userData = getUserData(userId);
        return res.redirect('/dashboard');
    } else {
        res.render('mainpage')
    }
});

app.get('/dashboard', (req, res) => {
    const userId = req.session.userId;
    // если пользователь авторизован, отображаем дашборд
    if (userId) {
        //const userData = getUserData(userId);
        if(req.session.roles[0]==="ADMIN"){

            return res.redirect('/admin')
        } else if(req.session.roles[0]==="ECONOM") {
            return res.redirect('/econom')
        } else if(req.session.roles[0]==="USER"){}
            return res.redirect('/userzone')
    } else {
        res.redirect('/');
    }
});

app.get('/admin', (req, res) => {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ADMIN"){
            User.find({}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    res.render('admin', { users: users }); // рендерим шаблон с данными из базы данных
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.get('/econom', (req, res) => {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] =="ECONOM"){
            User.find({}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    res.render('economy_choose', { username: req.session.username }); // рендерим шаблон с данными из базы данных
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(function(err) {
        if(err) {
            console.log(err);
            res.redirect('/');
        } else {
            res.redirect('/');
        }
    });
});

app.post('/update', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] =="ADMIN"){
            User.find({}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    const username = req.body.username;

                    function generatePassword(length) {
                        let result = '';
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        const charactersLength = characters.length;
                        for (let i = 0; i < length; i++) {
                            result += characters.charAt(Math.floor(Math.random() * charactersLength));
                        }
                        return result;
                    }

                    const newPassword = generatePassword(8);
                    User.findOneAndUpdate({ username: username }, { password: bcrypt.hashSync(newPassword, 7) }, function(err, user) {
                        if (err) throw err;
                        res.render('admin', { users: users, message: `Новый пароль для "${username}" : ${newPassword}` });
                    });
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.post('/delete', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ADMIN"){
            User.find({}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    const username = req.body.username;
                    console.log(JSON.stringify(req.body))
                    User.deleteOne({ username: username }, (err, result) => {
                        if (err) {
                            console.error(err);
                            res.render('admin', { users: users, message: 'Произошла ошибка при удалении пользователя' });
                        } else if (!result) {
                            res.render('admin', { users: users, message: `Пользователь "${username}" не найден` });
                        } else {
                            res.render('admin', { users: users, message: `Пользователь "${username}" успешно удален` });
                        }
                    });
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.post('/records', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ECONOM"){
            User.find({}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    Record.find({}, (err, records) => { // получаем все записи из коллекции
                        if (err) {
                            console.error(err);
                        } else {
                            res.render('economy_records', { records: records, users:users }); // рендерим шаблон с данными из базы данных
                        }
                    });
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.get('/records', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ECONOM"){
            User.find({}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    Record.find({}, (err, records) => { // получаем все записи из коллекции
                        if (err) {
                            console.error(err);
                        } else {
                            res.render('economy_records', { records: records, users:users }); // рендерим шаблон с данными из базы данных
                        }
                    });
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});


app.post('/new_record', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ECONOM"){
            Record.find({}, async (err, records) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    try {
                        const errors = validationResult(req)
                        if (!errors.isEmpty()) {
                            let users = User.find()
                            return res.render('economy_records', {
                                records:records,
                                users: users,
                                message: `Ошибка при добавлении новой записи: ${errors}`
                            });
                        }
                        console.log(JSON.stringify(req.body))
                        const {username, date, salary, taxes} = req.body;
                        const rec = new Record({username, date, salary, taxes})

                        await rec.save()
                        return res.redirect('/records');
                    } catch (e) {
                        console.log(e)
                        return res.redirect('/records');
                    }
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.post('/new_record', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ECONOM"){
            Record.find({}, async (err, records) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    try {
                        const errors = validationResult(req)
                        if (!errors.isEmpty()) {
                            let users = User.find()
                            return res.render('economy_records', {
                                records:records,
                                users: users,
                                message: `Ошибка при добавлении новой записи: ${errors}`
                            });
                        }
                        console.log(JSON.stringify(req.body))
                        const {username, date, salary, taxes} = req.body;
                        const rec = new Record({username, date, salary, taxes})

                        await rec.save()
                        return res.redirect('/records');
                    } catch (e) {
                        console.log(e)
                        return res.redirect('/records');
                    }
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.post('/delete_record', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ECONOM"){
            Record.find({}, (err, records) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    const id = req.body.id;
                    console.log(JSON.stringify(req.body))
                    Record.deleteOne({ _id: id }, (err, result) => {
                        if (err) {
                            console.error("err");
                            res.redirect('/records');
                        } else if (!result) {
                            console.log("results")
                            res.redirect('/records');
                        } else {
                            console.log("else")
                            res.redirect('/records');
                        }
                    });
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.post('/userzone', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ECONOM"||req.session.roles[0] ==="USER"){
            User.findOne({username: req.session.username}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    Record.find({username:req.session.username}, (err, records) => { // получаем все записи из коллекции
                        if (err) {
                            console.error(err);
                        } else {
                            console.log(JSON.stringify(users))
                            res.render('user', { records: records, users:users }); // рендерим шаблон с данными из базы данных
                        }
                    });
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

app.get('/userzone', function(req, res) {
    const userId = req.session.userId;
    if (userId) {
        if(req.session.roles[0] ==="ECONOM"||req.session.roles[0] ==="USER"){
            User.findOne({username: req.session.username}, (err, users) => { // получаем все записи из коллекции
                if (err) {
                    console.error(err);
                } else {
                    Record.find({username:req.session.username}, (err, records) => { // получаем все записи из коллекции
                        if (err) {
                            console.error(err);
                        } else {
                            console.log(JSON.stringify(users))
                            res.render('user', { records: records, users:users }); // рендерим шаблон с данными из базы данных
                        }
                    });
                }
            });
        } else{
            res.redirect('/')
        }
    } else {
        res.redirect('/');
    }
});

const start = async () => {
    try {
        await mongoose.connect(uri, { useFindAndModify: false }).then(() => console.log('MongoDB connected...'))
            .catch(err => console.log(err));
        app.listen(PORT, () => console.log(`server started on port ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start()
