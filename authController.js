const User = require('./models/User')
const Role = require('./models/Role')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator')
const {secret} = require("./config")


const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, JSON.stringify(secret), {
        expiresIn: 60 //
    } )
}

class authController {
    async registration(req, res) {
        const userId = req.session.userId;
        if (userId) {
            if(req.session.roles[0] =="ADMIN"){
                User.find({}, async (err, users) => { // получаем все записи из коллекции
                    if (err) {
                        console.error(err);
                    } else {
                        try {
                            const errors = validationResult(req)
                            if (!errors.isEmpty()) {
                                return res.render('admin', {
                                    users: users,
                                    message: `Ошибка при решистрации: ${errors}`
                                });
                            }
                            const {username, vacancy, phone, email, roles, password} = req.body;
                            const candidate = await User.findOne({username})
                            if (candidate) {
                                return res.render('admin', {
                                    users: users,
                                    message: "Пользователь с таким именем уже существует"
                                });
                            }
                            const hashPassword = bcrypt.hashSync(password, 7);
                            const userRole = await Role.findOne({value: roles})
                            const user = new User({username,vacancy:vacancy, phone:phone, email:email, password: hashPassword, roles: [userRole.value]})
                            user.save()

                            return res.render('admin', {users: users, message: "Пользователь успешно зарегистрирован"});
                        } catch (e) {
                            console.log(e)
                            return res.render('admin', {users: users, message: 'Ошибка при регистрации'});
                        }
                    }
                });
            } else{
                res.redirect('/')
            }
        } else {
            res.redirect('/');
        }
    }

    async login(req, res) {
        try {
            const {username, password} = req.body
            const user = await User.findOne({username})
            if (!user) {
                return res.render('mainpage', {message: `Пользователь ${username} не найден`})
            }
            const validPassword = bcrypt.compareSync(password, user.password)
            if (!validPassword) {
                return res.render('mainpage', {message: `Введен неверный пароль`})
            }
            req.session.userId = user._id;
            req.session.roles = user.roles;
            req.session.username = user.username;
            if (user.roles[0] == 'ADMIN') {
                // если пользователь не является администратором, отправляем ему ошибку 403 (Доступ запрещен)
                res.redirect('/admin');
                //res.sendFile(__dirname + '/html/admin.ejs');
            } else if(user.roles[0] == 'USER'){
                //res.sendFile(__dirname + '/html/mainpage.html');
                res.redirect('/userzone');
            }  else if(user.roles[0] == 'ECONOM'){
                //res.sendFile(__dirname + '/html/mainpage.html');
                res.redirect('/econom');
            }
        } catch (e) {
            console.log(e)
            res.render('mainpage', {message: 'Ошибка входа'})
        }
    }



    async getUsers(req, res) {
        try {
            const users = await User.find()
            res.json(users)
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new authController()