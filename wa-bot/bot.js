const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const app = express();

let BUSINESS = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log("=== SEND THIS LINK TO CLIENT ===");
  console.log(qr);
});

client.on('ready', () => {
  console.log('BOT IS RUNNING - Ruthie Bot Ready!');
});

client.on('message', async msg => {
  if (msg.fromMe) return;
  let text = msg.body.toLowerCase().trim();

  if (text.includes('hi') || text.includes('hello') || text.includes('price') || text.includes('list') || text.includes('available') || text.includes('menu')) {
    let reply = `${BUSINESS.greeting}\n\nWelcome to *${BUSINESS.businessName}* ✨\n\n📦 *OUR PERFUMES:*\n\n`;
    BUSINESS.products.forEach(p => {
      reply += `${p.id}. *${p.name}* - ${p.size} = ₦${p.price}\n`;
    });
    reply += `\n👉 Reply with NUMBER to order (e.g "2")\n📍 Type LOCATION\n💳 Type ACCOUNT\n🚚 Type DELIVERY`;
    await client.sendMessage(msg.from, reply);
  }
  else if (BUSINESS.products.find(p => p.id == text)) {
    let p = BUSINESS.products.find(pr => pr.id == text);
    let reply = `You selected *${p.name}* 🔥\n\nSize: ${p.size}\nPrice: ₦${p.price}\n\n💳 Payment: ${BUSINESS.account}\n📍 Store: ${BUSINESS.location}\n🚚 Delivery: ${BUSINESS.deliveryBenin}\n\nSend your delivery address + proof of payment to confirm order.`;
    
    try {
      // If you have images named 1.jpg, 2.jpg in /images folder
      const media = MessageMedia.fromFilePath(`./images/${p.id}.jpg`);
      await client.sendMessage(msg.from, media, { caption: reply });
    } catch(e) {
      await client.sendMessage(msg.from, reply);
    }
  }
  else if (text.includes('delivery')) {
    await client.sendMessage(msg.from, `🚚 Delivery fee: ${BUSINESS.deliveryBenin}\n(Depends on your location - send address to confirm)`);
  }
  else if (text.includes('location')) {
    await client.sendMessage(msg.from, `📍 We are at: ${BUSINESS.location}\n\nPickup available or we deliver.`);
  }
  else if (text.includes('account') || text.includes('pay')) {
    await client.sendMessage(msg.from, `💳 Pay to:\n${BUSINESS.account}\n\nSend screenshot after payment.`);
  }
});

client.initialize();
app.get('/', (req, res) => res.send('Ruthie Bot is running!'));
app.listen(process.env.PORT || 3000);