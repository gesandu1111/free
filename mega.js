// maga.js
const { default: makeWASocket, useMultiFileAuthState } = require("@adiwajshing/baileys");
const moment = require("moment");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const sock = makeWASocket({ auth: state });

    sock.ev.on("connection.update", (update) => {
        console.log("Connection Update:", update);
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (msg) => {
        const m = msg.messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;
        const command = text?.toLowerCase();

        console.log("Message from:", from, "->", text);

        // Example commands
        if (command === "hi") {
            await sock.sendMessage(from, { text: "Hello 👋 I'm M.R.Gesa!" });
        } else if (command === "menu") {
            await sock.sendMessage(from, { text: `
╭─「 ⚡ Bot Menu 」─╮
│ .hi
│ .menu
│ .time
│ .owner
╰───────────────╯
            `});
        } else if (command === "time") {
            await sock.sendMessage(from, { text: `⏰ Current Time: ${moment().format("YYYY-MM-DD HH:mm:ss")}` });
        } else if (command === "owner") {
            await sock.sendMessage(from, { text: "👨‍💻 Owner: wa.me/94784525290" });
        }
    });
}

startBot();
