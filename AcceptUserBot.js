const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../private/.env') });

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { Api } = require("telegram/tl");
const fs = require('fs')


const API_ID = Number(process.env['API_ID_AcceptUserBot'])
const API_HASH = process.env['API_HASH_AcceptUserBot']
const sessionFile = process.env['sessionFile_AcceptUserBot']
const GROUP_ID = process.env['GROUP_ID_AcceptUserBot']

console.log(API_ID, API_HASH, sessionFile, GROUP_ID)

let sessionString = "";
if (fs.existsSync(sessionFile)) {
    sessionString = fs.readFileSync(sessionFile, "utf-8");
}


(async () => {
    const client = new TelegramClient(new StringSession(sessionString), API_ID, API_HASH, {
        connectionRetries: 5,
    });

    console.log("Connecting...");
    await client.start({
        phoneNumber: async () => await input.text("Enter your phone number: "),
        password: async () => await input.text("Enter your password (if enabled): "),
        phoneCode: async () => await input.text("Enter the received OTP code: "),
        onError: (err) => console.error(err),
    });

    fs.writeFileSync(sessionFile, client.session.save())

    const me = await client.getMe();
    const meN = me.username || me.firstName || String(me.id);
    console.log("Connected!", meN);

    console.log("\n\n🔍 Getting channels...");
    const dialogs = await client.getDialogs();

    console.log("\n\n🔍 No Admin Channels:\n");
    for (const dialog of dialogs) {
        if ((dialog.isGroup || dialog.isChannel) && !dialog?.entity?.adminRights) {
            console.log(`💬 ID: ${dialog.id} | Title: ${dialog.title}`);
        }
    }

    console.log("\n\n🔍 Admin Channels:\n");
    for (const dialog of dialogs) {
        if ((dialog.isGroup || dialog.isChannel) && dialog?.entity?.adminRights) {
            console.log(`👑 ID: ${dialog.id} | Title: ${dialog.title}`);
        }
    }
    console.log('\n\n')

    for (let i = 0; i < 1000; i++) {
        try {
            await client.invoke(new Api.messages.HideAllChatJoinRequests({
                peer: GROUP_ID,
                approved: true,
            }));
        } catch (e) {

        }

        console.log('Accepting...', (i * 100))
        await sleep(1000)
    }

    process.exit();
})();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
