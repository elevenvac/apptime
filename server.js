const moment = require("moment")
const db = require("wio.db")
const discord = require("discord.js");
const client = new discord.Client({
    disableEveryone: true
});
const fetch = require("node-fetch");
const fs = require("fs");
const fss = require('fs-extra');
const express = require("express");
const app = express();
const helmet = require("helmet");
var uuid = require("uuid");
///
let admin = ["354343248698802187", "115714097478785788496", "682981714523586606"];
const config = require("./config.json")
client.login(config.token);
let prefix = config.prefix
let discord_server_invite = config.discord_server_invite
let discord_server_id = config.discord_server_id
let log_channel_id = config.log_channel_id
let status_channel_id = config.status_channel_id
let lam_log_channel_id = config.lam_log_channel_id
let discord_client_secret = config.discord_client_secret
let discord_callback_url = config.discord_callback_url
let google_client_id = config.google_client_id
let google_client_secret = config.google_client_secret
let google_callback_url = config.google_callback_url
let website_url = config.website_url
///
client.admin = admin;
client.db = db
const md = require("marked");
//var fs = require('fs');
var fsPath = require('fs-path');
const request = require("request");
const url = require("url");
const path = require("path");
const passport = require("passport");
const session = require("express-session");
const LevelStore = require("level-session-store")(session);
const Strategy = require("passport-discord").Strategy;
const Discord = require("discord.js");
app.use(
    "/css",
    express.static(path.resolve(__dirname + `/www/css`))
);

app.use(
    "/js",
    express.static(path.resolve(__dirname + `/www/js`))
);

const templateDir = path.resolve(__dirname + `/www/pages/`);

app.locals.domain = process.env.PROJECT_DOMAIN;

function logErrors(err, req, res, next) {
    console.error(err.stack)
    next(err)

}

const arr = db.fetch("linkler")


    app.use(function(err, req, res, next) {
        console.error(err.stack);
        res.status(500).send({
            status: 500,
            err: err
        });
        res.status(400).send({
            status: 400,
            err: err
        });
    });
app.use(logErrors)

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

setInterval(() => {
    var links = db.fetch("linkler");
    if (!links) return;
    var linkA = links.map(c => c.url);
    linkA.forEach(link => {
        try {
            fetch(link)
        } catch (e) {
            console.log(e)
        }
    });
    console.log("Pong")

}, 65000);

setInterval(() => {

    if (client.ws.ping > 250) {

        client.channels.cache.get(status_channel_id).send("**WARN:** System: Low performance (" + Math.round(client.ws.ping) + "ms)")

    }

}, 600000);

client.on("ready", () => {
    client.user.setActivity(`${prefix}help | ${website_url}`);
    if (!Array.isArray(db.fetch("linkler"))) {
        db.set("linkler", []);
    }
});

client.on("ready", () => {
    const cookieSession = require('cookie-session');

    const GoogleStrategy = require('passport-google-oauth20').Strategy;

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    passport.use(new GoogleStrategy({
            clientID: google_client_id,
            clientSecret: google_client_secret,
            callbackURL: google_callback_url
        },
        function(accessToken, refreshToken, profile, cb) {
            return cb(null, profile);
        }
    ));

    /*app.use(cookieSession({
        name: 'session-name',
        keys: ['key1', 'key2']
    }))*/
    app.use(cookieSession({
        name: 'apptime_auth_save',
        keys: ['key1', 'key2']
    }))

    app.use(passport.initialize());
    app.use(passport.session());
    const checkUserLoggedIn = (req, res, next) => {
        req.user ? next() : res.redirect("/connect");
    }
    app.get('/api/account', checkAuth, (req, res) => {
        res.json(req.user)
    });

    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    app.get('/auth/google/callback', passport.authenticate('google', {
            failureRedirect: '/autherror'
        }),
        function(req, res) {
            res.redirect('/dashboard');
            db.add('logins', 1)
            db.add(`logins.${req.user.id}`, 1)
            db.set(`client.${req.user.id}`, "Google")
            const email = req.user.emails[0].value

            if (!client.admin.includes(req.user.id) === true) {

                let ui = {
                    name: req.user.displayName,
                    id: req.user.id,
                    email: req.user.emails[0].value,
                    ip: req.headers["x-forwarded-for"]
                }

                let data = JSON.stringify(ui, null, 2);

                fss.outputFile(`users/google/${req.user.id}.json`, data, err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(`User Datas has been Saved. (${req.user.displayName})`);
                    }
                })

            } else {

                return;

            }
        }
    );

    passport.use(
        new Strategy({
                clientID: client.user.id,
                clientSecret: discord_client_secret,
                callbackURL: discord_callback_url,
                scope: ["identify", "guilds.join", "email"]
            },
            (accessToken, refreshToken, profile, done) => {
                process.nextTick(() => done(null, profile));
                let id = profile.id;

                if (!client.guilds.cache.get(discord_server_id).members.cache.get(profile.id)) {
                    client.guilds.cache.get(discord_server_id).addMember(profile.id, {
                        "accessToken": accessToken
                    }).catch(console.error)
                }
            }
        )
    );

    app.use(
        session({
            secret: "123",
            resave: false,
            saveUninitialized: false
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());
    let linkss;
    app.use(helmet());
    let links = db.fetch("linkler");
    let sahipp;
    var linkA = links.map(c => c.url);
    var sahip = links.map(c => c.owner);
    try {
        linkss = linkA
        sahipp = sahip
    } catch (e) {
        console.log(e);
    }

    const renderTemplate = (res, req, template, data = {}) => {
        const baseData = {
            bot: client,
            path: req.path,
            db: db,
            user: req.isAuthenticated() ? req.user : null,
            saat: `${moment().locale('tr').format('LLL')}`,
            linkss: linkss,
            sahipp: sahipp
        };
        res.render(
            path.resolve(`${templateDir}${path.sep}${template}`),
            Object.assign(baseData, data)
        );
    };
    app.get("/auth/discord", (req, res, next) => {
            if (req.session.backURL) {
                req.session.backURL = req.session.backURL;
            } else if (req.headers.referer) {
                const parsed = url.parse(req.headers.referer);
                if (parsed.hostname === app.locals.domain) {
                    req.session.backURL = parsed.path;
                }
            } else {
                req.session.backURL = "/";
            }
            next();
        },
        passport.authenticate("discord"));

    app.get("/account/logout", function(req, res) {
        req.session = null;
        req.logout();
        res.redirect('/');
    });

    function checkAuth(req, res, next) {
        if (req.isAuthenticated()) return next();
        req.session.backURL = req.url;
        res.redirect("/connect");
    }

    app.get("/autherror", (req, res) => {
        res.redirect('/connect')
    });

    app.get(
        "/auth/discord/callback",
        passport.authenticate("discord", {
            failureRedirect: "/autherror"
        }),
        async (req, res) => {
            if (req.session.backURL) {
                const url = req.session.backURL;
                req.session.backURL = null;
                res.redirect(url);
            } else {
                if (!req.user.email) {
                    req.session = null;
                    req.logout();
                }
                res.redirect("/dashboard");
                db.add('logins', 1)
                db.add(`logins.${req.user.id}`, 1)
                db.set(`client.${req.user.id}`, "Discord")
            }
            const email = req.user.email

            if (!client.admin.includes(req.user.id) === true) {

                let ui = {
                    name: req.user.username,
                    id: req.user.id,
                    email: req.user.email,
                    ip: req.headers["x-forwarded-for"]
                }

                let data = JSON.stringify(ui, null, 2);

                fss.outputFile(`users/discord/${req.user.id}.json`, data, err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(`User Datas has been Saved. (${req.user.username})`);
                    }
                })

            } else {

                return;

            }
        }
    );

    app.get("/", function(req, res) {
        renderTemplate(res, req, "index.ejs");
    });
    app.get("/connect", function(req, res) {
      if(req.user) {
        res.redirect("/dashboard")
      }
        renderTemplate(res, req, "connect.ejs");
    });
    app.get("/legal/tos", (req, res) => {
        res.redirect('/legal/all')
    });
    app.get("/legal/privacy", (req, res) => {
        res.redirect('/legal/all')
    });
    app.get("/legal/gdpr", (req, res) => {
        res.redirect('/legal/all')
    });
    app.get("/bot/invite", (req, res) => {
        res.redirect('https://discord.com/oauth2/authorize?client_id=842440497347690546&scope=bot&permissions=8')
    });
    app.get("/legal/all", (req, res) => {
        renderTemplate(res, req, "legal.ejs");
    });
    app.get("/account", checkAuth, (req, res) => {

        if (!db.fetch(`account.${req.user.id}.authkey`)) {
            let random = uuid.v4();
            db.set(`account.${req.user.id}.authkey`, random)
        }
        renderTemplate(res, req, "account.ejs");
    });
    
    app.post("/account", checkAuth, (req, res) => {

        db.add(`treq`, 1)
        let resp = db.fetch(`treq`)
        db.set(`treq`, resp)

        db.add(`treq.${req.user.id}`, 1)
        let respU = db.fetch(`treq.${req.user.id}`)
        db.set(`treq.${req.user.id}`, respU)

        db.set(`account.${req.user.id}.avatar`, req.body['avatar'])
        res.redirect(`/account`)


    })
    app.post("/leave_a_message", (req, res) => {

      db.add(`treq`, 1)
        let resp = db.fetch(`treq`)
        db.set(`treq`, resp)

        db.add(`treq.${req.user.id}`, 1)
        let respU = db.fetch(`treq.${req.user.id}`)
        db.set(`treq.${req.user.id}`, respU)

        client.channels.cache.get(lam_log_channel_id).send(`__**Name:**__\n${req.body['lamname']}\n\n__**Email:**__\n${req.body['lamemail']}\n\n__**Message:**__\n${req.body['lammessage']}`)
    })
    app.get("/account/beta", checkAuth, (req, res) => {
        if (!db.fetch(`beta.${req.user.id}.status`)) {
            db.set(`beta.${req.user.id}.status`, 1)
        } else {
            db.delete(`beta.${req.user.id}.status`)
        }
        res.redirect(`/account`)
    })
    app.get("/account/sync/avatar", checkAuth, (req, res) => {
        let db = db.fetch(`client.${req.user.id}`)
        if (db === "Google") {
            db.set(`account.${req.user.id}.avatar`, req.user.photos[0].value)
        } else {
        //if (db === "Discord") {
            db.set(`account.${req.user.id}.avatar`, `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}`)
        }
        res.redirect(`/account`)
    })
    app.get('/discord', function(req, res) {
        res.redirect(discord_server_invite)
    });
    app.get("/dashboard", checkAuth, (req, res) => {
        renderTemplate(res, req, "dashboard.ejs");
    });
    app.post("/monitors/new", checkAuth, (req, res) => {

      db.add(`treq`, 1)
        let resp = db.fetch(`treq`)
        db.set(`treq`, resp)

        db.add(`treq.${req.user.id}`, 1)
        let respU = db.fetch(`treq.${req.user.id}`)
        db.set(`treq.${req.user.id}`, respU)
        
        let ayar = req.body;
        let linkname = ayar["linkname"];
        let linkimage = ayar["linkimage"];
        let link = ayar["link"];

        let sınır = db.fetch(`user.${req.user.id}.sinir`) || 0
        if (sınır < 10) {
            if (!ayar["linkname"]) return renderTemplate(res, req, "unsuccess.ejs");
            if (!ayar["link"]) return renderTemplate(res, req, "unsuccess.ejs");

            if (db.fetch("linkler").map(z => z.url).includes(link)) {
                return renderTemplate(res, req, "unsuccess.ejs");
            } else {

                db.add(`pointID`, 1)
                let pointID = db.fetch(`pointID`)
                db.set(`links.${pointID}`, link)
                db.push("linkler", {
                    name: linkname,
                    url: link,
                    image: linkimage,
                    owner: req.user.id,
                    pointID: pointID
                });
                const embed = new Discord.MessageEmbed()
                    .setTitle("Monitor Added")
                    .setColor("GREEN")
                    .setThumbnail(linkimage || "https://i.ibb.co/HBJRCCq/quiestion-gray.png")
                    .addField("User", `${req.user.username || req.user.displayName} (${db.fetch("linkler").filter(x => x.owner === req.user.id).length}/10) (${db.fetch(`client.${req.user.id}`) || "Discord"}-${req.user.id})`)
                    .addField("Name", linkname + " (" + pointID + ")")
                    .addField("URL", link)
                client.channels.cache.get(log_channel_id).send(embed)
                db.add(`user.${req.user.id}.sinir`, 1)

                return res.redirect(`/monitors/view/${pointID}`)

            }
        } else {
            return renderTemplate(res, req, "unsuccess.ejs");
        }
    });


    app.post("/monitors/delete/:linkID", checkAuth, async (req, res) => {

        try {

          db.add(`treq`, 1)
        let resp = db.fetch(`treq`)
        db.set(`treq`, resp)

        db.add(`treq.${req.user.id}`, 1)
        let respU = db.fetch(`treq.${req.user.id}`)
        db.set(`treq.${req.user.id}`, respU)

            var link = req.params.linkID
            let linkasil = db.fetch(`links.${link}`)

            if (db.fetch("linkler").filter(x => x.url === linkasil)[0].owner ===
                req.user.id) {

                if (db.has(`links`)) {
                    if (Object.keys(db.fetch(`links`)).includes(link) === false) return renderTemplate(res, req, '404.ejs')
                }


                db.set("linkler", db.fetch("linkler").filter(x => x.url != linkasil))
                db.add(`user.${req.user.id}.sinir`, -1)

                const embed = new Discord.MessageEmbed()
                    .setTitle("Monitor Deleted")
                    .setColor("RED")
                    .addField("User", `${req.user.username || req.user.displayName} (${db.fetch("linkler").filter(x => x.owner === req.user.id).length}/10) (${db.fetch(`client.${req.user.id}`) || "Discord"}-${req.user.id})`)
                    .addField("URL", linkasil + " (" + link + ")")
                client.channels.cache.get(log_channel_id).send(embed)


                return res.redirect('/dashboard')


            } else {
                return renderTemplate(res, req, '404.ejs')
            }

        } catch (error) {
            return renderTemplate(res, req, '404.ejs')
        }
    });



    app.post("/monitors/edit/:linkID", checkAuth, (req, res) => {
        let ayar = req.body;
        let linkname = ayar["linkname"];
        let linkimage = ayar["linkimage"];
        let linkk = ayar["linkk"];
        try {

          db.add(`treq`, 1)
        let resp = db.fetch(`treq`)
        db.set(`treq`, resp)

        db.add(`treq.${req.user.id}`, 1)
        let respU = db.fetch(`treq.${req.user.id}`)
        db.set(`treq.${req.user.id}`, respU)

            var link = req.params.linkID
            let linkasil = db.fetch(`links.${link}`)

            if (db.fetch("linkler").filter(x => x.url === linkasil)[0].owner ===
                req.user.id) {

                if (db.has(`links`)) {
                    if (Object.keys(db.fetch(`links`)).includes(link) === false) return renderTemplate(res, req, '404.ejs')
                }

                db.set("linkler", db.fetch("linkler").filter(x => x.url != linkasil))
                db.add(`pointID`, 1)
                let pointID = db.fetch(`pointID`)
                db.set(`links.${pointID}`, linkk)
                db.push("linkler", {
                    name: linkname,
                    url: linkk,
                    image: linkimage,
                    owner: req.user.id,
                    pointID: pointID,
                    editedAt: moment().format('lll')
                });

                const embed = new Discord.MessageEmbed()
                    .setTitle("Monitor Edited")
                    .setColor("#ffff20")
                    .setThumbnail(linkimage || "https://i.ibb.co/HBJRCCq/quiestion-gray.png")
                    .addField("User", `${req.user.username || req.user.displayName} (${db.fetch("linkler").filter(x => x.owner === req.user.id).length}/10) (${db.fetch(`client.${req.user.id}`) || "Discord"}-${req.user.id})`)
                    .addField("Name", linkname + " (" + pointID + ")")
                    .addField("URL", linkk)
                client.channels.cache.get(log_channel_id).send(embed)


                return res.redirect(`/monitors/view/${pointID}`)


            } else {
                return renderTemplate(res, req, '404.ejs')
            }

        } catch (error) {
            return renderTemplate(res, req, '404.ejs')
        }
    });

    app.get("/monitors/view/:linkID", checkAuth, async (req, res) => {

        try {


            var link = req.params.linkID
            let linkasil = db.fetch(`links.${link}`)
            let url = db.fetch("linkler").filter(x => x.pointID == linkasil)[0]

            if (db.fetch("linkler").filter(x => x.url === linkasil)[0].owner ===
                req.user.id) {

                if (db.has(`links`)) {
                    if (Object.keys(db.fetch(`links`)).includes(link) === false) return renderTemplate(res, req, '404.ejs')
                }


                return renderTemplate(res, req, 'view.ejs', {
                    url,
                    link,
                    linkasil
                })

            } else {
                return renderTemplate(res, req, '404.ejs')
            }

        } catch (error) {
            return renderTemplate(res, req, '404.ejs')
        }
    });


    app.get("/*", (req, res) => {
        if (res.status(404)) return renderTemplate(res, req, "404.ejs");
    })

    console.log(`Apptime Logined!`);
});

app.listen(3000, () => {
    console.log("Web Logined!")
})
const log = message => {
    console.log(`${message}`);
};


client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./commands/', (err, files) => {
    if (err) console.error(err);
    files.forEach(f => {
        let props = require(`./commands/${f}`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});
client.on('message', message => {
    const db = require("wio.db");
    let talkedRecently = new Set();
    if (talkedRecently.has(message.author.id)) {
        return;
    }
    talkedRecently.add(message.author.id);
    setTimeout(() => {
        talkedRecently.delete(message.author.id);
    }, 2500);
    let client = message.client;
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    let command = message.content.split(' ')[0].slice(prefix.length);
    let params = message.content.split(' ').slice(1);
    let cmd;
    if (client.commands.has(command)) {
        cmd = client.commands.get(command);
    } else if (client.aliases.has(command)) {
        cmd = client.commands.get(client.aliases.get(command));
    }
    if (cmd) {
        cmd.run(client, message, params)
    };
});
