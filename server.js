const exp = require("express");
const mongoose = require("mongoose");
const app = exp();
const bodyparser = require("body-parser");
const clientSessions = require("client-sessions");
const ejs = require("ejs");
const path = require("path");

const cors = require("cors");
app.use(cors());

const jsonwebtoken = require("jsonwebtoken");
const passport = require("passport");
const passportjwt = require("passport-jwt");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", ".ejs");


var jwt_obj = {
    jwtFromRequest: passportjwt.ExtractJwt.fromAuthHeaderWithScheme("jwt"),
    secretOrKey: "asdfasdfasdfasdfasdfasd"
};
var JwtStrategy = passportjwt.Strategy;

var strategy = new JwtStrategy(jwt_obj, function (jwt_payload, next) {
    if (jwt_payload) {
        next(null, {
            username: jwt_payload.username
        });
    } else {
        next(null, false);
    }

});

passport.use(strategy);

app.use(passport.initialize());

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
//mongoose.connect("mongodb+srv://hqushtom:zlZZu9UJZUL2KhAo@cluster0.s3wizyc.mongodb.net/?retryWrites=true&w=majority");

var db1 = mongoose.createConnection("mongodb+srv://hqushtom:zlZZu9UJZUL2KhAo@cluster0.s3wizyc.mongodb.net/week5db?retryWrites=true&w=majority");

var db2 = mongoose.createConnection("mongodb+srv://hqushtom:zlZZu9UJZUL2KhAo@cluster0.s3wizyc.mongodb.net/?retryWrites=true&w=majority");


app.use(
    clientSessions({
        cookieName: "sessioin_obj",
        secret: "sdfsdfs sdfsdf",
        duration: 1000 * 60 * 5,
        activeDuration: 1000 * 60 * 3
    })
);

var users_schema = new mongoose.Schema({
    "username": String,
    "password": String,
    "email": String
}, { strict: true }
);
var users = db1.model("users", users_schema);
/*
function login(req, res, next) {
    if (req.sessioin_obj.user_info)
        next();
    else
        res.redirect("/");
}*/


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/dashboard", passport.authenticate("jwt", { session: false }), function (req, res) {
    res.render("dashboard"/*, { data: req.sessioin_obj.user_info }*/);
});

app.get("/login", function (req, res) {
    var data = {
        userInfo: {
            username: "",
            password: ""
        },
        errorMsg: {
            username: "",
            password: ""
        }
    };
    res.render("login", { data: data });
});

app.post("/login", function (req, res) {
    var data = {
        userInfo: {
            username: req.body.username,
            password: req.body.password
        },
        errorMsg: {
            username: "",
            password: ""
        }
    };
    console.log(req.body.username);
    console.log(data.userInfo.username);
    if (data.userInfo.username && data.userInfo.password) {

        users.find({ username: data.userInfo.username, password: data.userInfo.password }).exec().then((result) => {
            console.log(result);


            var payload = {
                username: data.userInfo.username
            };
            var token = jsonwebtoken.sign(payload, jwt_obj.secretOrKey, { expiresIn: 30 * 60 });

            req.sessioin_obj.token = token;
            console.log(token);

            res.redirect("/dashboard");

        });

    } else {
        if (!data.userInfo.username)
            data.errorMsg.username = "The username is required.";

        if (!data.userInfo.password)
            data.errorMsg.password = "The password is required.";

        res.render("login", { data: data });
    }


});


app.get("/logout", function (req, res) {
    req.sessioin_obj.reset();
    res.redirect("/");
});

app.get("/update_user/:fname", function (req, res) {
    var firstName = req.params.fname;
    users.updateOne({ fname: firstName }, {
        $set: { email: "haytham@gmail.com", lname: "qushtom" }
    }).exec().then((data) => {
        console.log(data);
        res.redirect("/");
    });
});

app.get("delete_user/:fname", function (req, res) {
    var firstName = req.params.fname;
    users.deleteOne({ fname: firstName }).exec().then((data) => {
        console.log(data);
        res.redirect("/");
    });
});

app.get("/user/:fname", function (req, res) {
    var firstName = req.params.fname;

    users.find({ fname: firstName }).exec().then((data) => {
        console.log(data);
        res.send("The user first name is: " + data[0].fname + " " + data[0].email);
    });
});


//SQL:
// select * from users;
// users.find();
//-------------------------
// select * from users where fname="Haytham";
// users.find({fname: "Haytham"});
//--------------------------------
// select * from users where fname="Haytham" and lname="Qushtom";
// users.find({fname: "Haytham",lname:"Qushtom"});
//------------------------------------------
// select fname,email from users where fname="Haytham";
// users.find({fname:"Haytham"},["fname","email"]);
//----------------------------------------
// select email from users;
// users.find({},["email"]);
//----------------------------------------
// select * from users where fname="Haytham" or fname="Alex";
// users.find({$or:[{fname:"Haytham"},{fname:"Alex"}]});
//----------------------------------------
// select * from users 
//   where (fname="Haytham" and lname="Qushtom") or fname="Alex";
// users.find(
//{$or:[{fname:"Haytham",lname="Qushtom"},{fname:"Alex"}]}
//);
//----------------------------------------
// select * from users 
// where fname="Haytham" and (lname="Qushtom" or lname="Davad");
// users.find({fname:"Haytham",$or:[{lname:"Qushtom"},{lname:"Davad"}]});

app.listen(8080);