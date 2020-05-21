require('dotenv').config();
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const session = require('express-session');
const passport=require("passport");
const passportLocal=require("passport-local");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require("passport-facebook").Strategy;
const TwitterStrategy=require("passport-twitter").Strategy;
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose= require("passport-local-mongoose");
let logout=" ";
const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost/usersDB",{useNewUrlParser:true,useUnifiedTopology: true });
clientSchema=new mongoose.Schema(
  {  name: String,
     email:String,
     phone:String,
     address:String,
     company:String,
     notes:String

  });
userSchema=new mongoose.Schema(
  {
    userName: String,
    password: String,
    sId:String,
    clients: [clientSchema]
  });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const Client=new mongoose.model("Cient",clientSchema);
const User= new mongoose.model("User",userSchema);
mongoose.set('useCreateIndex', true);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/clients",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  
  User.findOrCreate({ sId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret:  process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/clients",
  profileFields: ['id', 'displayName', 'photos', 'email']
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  
  User.findOrCreate({ sId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: "http://localhost:3000/auth/twitter/clients"
},
function(token, tokenSecret, profile, cb) {
  User.findOrCreate({ twitterId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
app.get('/auth/google',
  passport.authenticate("google", { scope: ['profile'] }));
  app.get("/auth/google/clients", 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/clients');
  });
  app.get('/auth/facebook',
  passport.authenticate('facebook'));
  app.get('/auth/facebook/clients',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/clients');
  });
  app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/clients');
  });
app.get("/",function(req,res)
{
  res.render("home");
});
app.get('/clients',function(req,res)
{
   if(req.isAuthenticated())
   {
    User.findById(req.user.id, function(err, foundUser){

      // console.log(foundUser);
         if (err){
           console.log(err);
         } else {
           if (foundUser) {
     
             res.render("clients", {userClients: foundUser.clients});
           }
         }
      });
    // res.render("clients");
   }
   else
   {
    res.redirect("/");
   }
});
app.get("/edit",function(req,res)
{
   res.render("edit");
});
app.get("/logout",function(req,res)
{
  req.logout();
  res.redirect("/");
});
app.get("/add",function(req,res)
{
  res.render("add");
});
app.post("/register",function(req,res)
{
  const email=req.body.username;
  const password=req.body.password;
  const rePassword=req.body.pswre;
  console.log(email);
  
  if(password===rePassword)
  {
    User.register({username:email},password, function(err, user) {
      if(err)
      {
        
        console.log(err);
        res.redirect("/");
        
      }
      else{
        passport.authenticate("local")(req,res,function()
         {
             res.redirect("/clients");
         });
      }
    });
  }
});
app.post("/add",function(req,res)
  { 
    if(req.isAuthenticated());
    {
      const client=new Client(
        {
         name: req.body.clientName,
         email:req.body.clientEmail,
         phone:req.body.clientPhone,
         address:req.body.clientAddress,
         company:req.body.clientCompany,
         notes: req.body.clientNotes
         });
         User.findById(req.user.id, function(err, foundUser){
            console.log(foundUser);
            if (err) {
              console.log(err);
            } else {
              if (foundUser) {
                foundUser.clients.push(client);
                foundUser.save(function(){
                  res.redirect("/clients");
                });
              }
            }
          });
      }
  });
  app.post("/edit",function(req,res)
  { 
    if(req.isAuthenticated());
    {
      console.log("hello");
      
      // const n=req.body.clientName;
     
         User.findById(req.user.id, function(err, foundUser){
            // console.log(foundUser);
            if (err) {
              console.log(err);
            } else {
              if (foundUser) {
               
              (foundUser.clients).forEach(function(item) {
                     if(item.name===req.body.clientName)
                     {
                       if(req.body.clientEmail)
                       {
                        item.email=req.body.clientEmail;
                       }
                       if(req.body.clientPhone)
                       {
                        item.phone=req.body.clientPhone;
                       }
                       if(req.body.clientAddress)
                       {
                        item.address=req.body.clientAddress;
                       }
                       if(req.body.clientCompany)
                       {
                        item.company=req.body.clientCompany;
                       }
                       if(req.body.clientNotes)
                       {
                        item.notes=req.body.clientNotes;
                       }
                     }
                 });

                foundUser.save(function(){
                  res.redirect("/clients");
                });
              }
            }
          });
      }
  });
app.post("/login",function(req,res)
  {
   const user=new User(
     {
       username:req.body.username,
       password:req.body.password
     }
   );
   req.login(user,function(err)
   {
     if(err)
     {

       console.log(err);   
     }
     else{
      passport.authenticate("local")(req,res,function()
      {
          res.redirect("/clients");
      });
     }
   });
  });  
app.listen(3000,function()
{
    console.log("server started successfully");
    
})