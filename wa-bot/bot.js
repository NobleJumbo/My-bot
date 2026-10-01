const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

let CONFIG;
try { CONFIG = JSON.parse(fs.readFileSync('./config.json')); }
catch(e){
  CONFIG = { price:15000, product:"Bone Straight Hair 12 inches", otherProducts:"14in:18k", deliveryBenin:1500, deliveryOutside:3000, location:"New Benin Market", account:"Opay - 1234567890", greeting:"Welcome!", images:["hair1.jpg","hair2.jpg","hair3.jpg"] }
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] }
});

client.on('qr', qr => {
    console.log("=== SEND THIS LINK TO CLIENT ===");
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qr)}`);
    qrcode.generate(qr, {small: true});
});
client.on('ready', () => console.log('V3 + PICTURES LIVE!'));

let pausedChats = new Set();

client.on('message', async msg => {
    try {
        if(msg.fromMe || msg.isGroup) return;
        const chatId = msg.from;
        const text = msg.body.toLowerCase();

        if(pausedChats.has(chatId) && !text.includes('bot')) return;
        if(text.includes('bot')){ pausedChats.delete(chatId); await msg.reply("Bot back online! Type 'price'"); return; }

        const qty = parseInt(text.match(/\d+/)?.[0]) || 1;
        const save = ()=> fs.appendFileSync('orders.txt', `${new Date().toLocaleString()} | ${msg.from} | ${msg.body}\n`);

        if(text.includes('hi') || text.includes('hello') || text.includes('good morning') || text.includes('hey')){
            await msg.reply(`${CONFIG.greeting}\nWe sell ${CONFIG.product}\n\nCommands:\n• price - price list\n• I need 2 - to order\n• pics / pictures - see samples\n• delivery - delivery fee\n• pay - account\n• human - talk to person`);
            return;
        }

        if(text.includes('price') || text.includes('how much')){
            save();
            await msg.reply(`PRICE LIST:\n${CONFIG.product}: ₦${CONFIG.price.toLocaleString()}\n${CONFIG.otherProducts}\n\nFor ${qty} pcs = ₦${(CONFIG.price*qty).toLocaleString()}\nType "I need ${qty}" to order or "pics" to see samples`);
            return;
        }

        if(text.includes('need') || text.includes('want') || text.includes('buy') || text.includes('order')){
            save();
            await msg.reply(`Noted! ${qty} pcs = ₦${(CONFIG.price*qty).toLocaleString()}\nDelivery Benin: ₦${CONFIG.deliveryBenin}\n\nSend your address + type "pay" for account.\nType "pics" to see hair.`);
            return;
        }

        // PICTURE FEATURE
        if(text.includes('pic') || text.includes('sample') || text.includes('image') || text.includes('see hair')){
            await msg.reply("Sending samples 📸...");
            for(let imgPath of CONFIG.images){
                if(fs.existsSync(imgPath)){
                    const media = MessageMedia.fromFilePath(imgPath);
                    await client.sendMessage(chatId, media, { caption: CONFIG.product });
                }
            }
            await msg.reply(`Those are our ${CONFIG.product}. Type "I need 1" to order.`);
            return;
        }

        if(text.includes('delivery')){ await msg.reply(`Delivery:\nBenin: ₦${CONFIG.deliveryBenin}\nOutside: ₦${CONFIG.deliveryOutside}\n1-2 days`); return; }
        if(text.includes('pay') || text.includes('account')){ await msg.reply(`Pay to:\n${CONFIG.account}\n\nAfter payment send proof.`); return; }
        if(text.includes('location') || text.includes('where')){ await msg.reply(`${CONFIG.location}`); return; }
        if(text.includes('human') || text.includes('agent')){ pausedChats.add(chatId); await msg.reply("Bot paused. Human will reply soon. Type 'bot' to resume bot."); return; }

    } catch(e){ console.log(e.message) }
});

client.initialize();