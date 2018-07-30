#!/usr/bin/env node
const express = require('express');
const multer = require('multer');
const morgan = require('morgan');
const Discord = require('discord.js');
const http = require('http');
const fs = require('fs');

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 4000
const socket = process.env.SOCKET || null
const webhookid = process.env.WEBHOOKID || null
const webhooktoken = process.env.WEBHOOKTOKEN || null

const app = new express();
const httpServer = http.createServer(app);
const hook = new Discord.WebhookClient(webhookid, webhooktoken)
const upload = multer({ dest: '/tmp/' });

function Payload(payload) {
    let player = payload.Player;
    let account = payload.Account;
    let metadata = payload.Metadata;
    this.event = payload.event;
    this.thumb = account.thumb;
    this.username = account.title;
    this.summary = metadata.summary;
    this.rating = metadata.rating;
    this.device = player.title;
    this.type = metadata.type;
    if (this.type == "episode") {
        this.title = metadata.grandparentTitle;
        this.etitle = metadata.title;
        this.episode = metadata.index;
        this.season = metadata.parentIndex;
    } else {
        this.title = metadata.title;
    }
    if (this.event === "media.play") {
        this.status = "Started watching"
    } else {
        this.status = "Stopped watching"
    }
    this.embed = function() {
        let embed = new Discord.RichEmbed();
//        embed.setAuthor(this.username);
//        embed.setTitle(this.status + " " + this.title + " on " + this.device);
//        embed.setDescription(this.summary)
        embed.addField(this.username,
        this.status + " " + this.title + " on " + this.device + "\n\n" + this.summary);
        if (this.type === "episode") {
            embed.addField("Episode", this.etitle + " - S" + this.season + "E" + this.episode);
        }
        embed.setThumbnail(this.thumb);
        embed.setTimestamp();
        embed.setColor(0xffa500);
        return embed;
    }
}

app.post('/', upload.single('thumb'), (req, res, next) => {
    let payload = new Payload(JSON.parse(req.body.payload));
    if ((payload.event === "media.play") || (payload.event === "media.stop")) {
        let embed = payload.embed();
        hook.send({ embeds: [embed] }).then(console.log).catch(console.error);
    }
    res.sendStatus(200);
})

function StartServer () {
  if (socket) {
    if (fs.existsSync(socket)) {
      fs.unlinkSync(socket)
    }
    httpServer.listen(socket, () => { console.log('Server listening on ' + socket) })
    fs.chmodSync(socket, '0777')
  } else {
    httpServer.listen(port, host, () => {
      console.log('Server listening on ' + host + ':' + port) // eslint-disable-line no-console
    })
  }
}

StartServer()
