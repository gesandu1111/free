import fs from "fs";
import pino from "pino";
import { default as makeWASocket, useMultiFileAuthState, Browsers, jidNormalizedUser, makeCacheableSignalKeyStore, delay } from "@adiwajshing/baileys";
import { upload } from "./mega.js";

function removeFile(path) {
  if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
}

function generateId(length = 6, digits = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < length; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  const num = Math.floor(Math.random() * Math.pow(10, digits));
  return `${id}${num}`;
}

export default async function paircodeHandler(req, res) {
  const rawNum = req.query.number;
  if (!rawNum || rawNum.length < 10) return res.send({ code: "Invalid number" });
  const number = rawNum.replace(/[^0-9]/g, "");

  try {
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })) },
      printQRInTerminal: false,
      logger: pino({ level: "fatal" }),
      browser: Browsers.macOS("Safari"),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") {
        try {
          await delay(10000);
          const userJid = jidNormalizedUser(sock.user.id);
          const sessionPath = "./session/creds.json";
          const megaUrl = await upload(fs.createReadStream(sessionPath), `${generateId()}.json`);
          const sessionCode = megaUrl.replace("https://mega.nz/file/", "");
          await sock.sendMessage(userJid, { text: `🔐 Session Code:\n${sessionCode}` });
          removeFile("./session");
        } catch (err) {
          console.error("Messaging failed:", err);
        }
      }
    });

    const code = await sock.requestPairingCode(number);
    if (!res.headersSent) res.send({ code });
  } catch (err) {
    console.error("Pairing failed:", err);
    removeFile("./session");
    if (!res.headersSent) res.send({ code: "Service Unavailable" });
  }
}
