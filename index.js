const { default: makeWASocket } = require("@adiwajshing/baileys");
const { writeFileSync, readFileSync } = require("fs");

async function startBot() {
    const sock = makeWASocket();
    sock.ev.on("messages.upsert", (msg) => {
        console.log(msg);
    });
}

startBot();
