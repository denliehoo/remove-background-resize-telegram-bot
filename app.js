// node app.js 
// npm i node-telegram-bot-api jimp form-data axios
// https://github.com/yagop/node-telegram-bot-api 
const TelegramBot = require('node-telegram-bot-api')
const jimp = require('Jimp')
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_API_KEY; // place your telegram bot token here
const removeBgAPIKey = process.env.REMOVE_BG_API_KEY // place your remove bg api key here: https://www.remove.bg/

const bot = new TelegramBot(token, { polling: true });

// function to remove background
const removeBg = async (src) => {
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_url', src);

    const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: formData,
        responseType: 'arraybuffer',
        headers: {
            ...formData.getHeaders(),
            'X-Api-Key': removeBgAPIKey,
        },
        encoding: null
    })

    return response.data
}

// function to resize image
const resizeImage = async (src) => {
    const img = await jimp.read(src);
    const buffer = await img.scaleToFit(512, 512).getBufferAsync(jimp.MIME_PNG);
    return buffer
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hi there! Send me an image and I'll remove the background, resize to telegram sticker size and send it back to you!");

});

// bot.on('message', msg => {
//     bot.sendMessage(msg.chat.id, "Hi there! Send me an image and I'll remove the background, resize to telegram sticker size and send it back to you!")
// })


const supportedTypes = ['image/jpeg', 'image/png'];

bot.on('document', async (msg) => {
    const { chat, document } = msg;

    if (!supportedTypes.includes(document.mime_type)) {
        bot.sendMessage(chat.id, 'Use one of the supported types of image: JPEG or PNG only!')
        return; //ends the function if a wrong format type is sent
    }
    bot.sendMessage(chat.id, "Processing your image, please wait...")
    const fileLink = await bot.getFileLink(document.file_id); // gets the image link from telegram
    const bgRemovedImage = await removeBg(fileLink); // removes the background
    const imgDoc = await resizeImage(bgRemovedImage); // resize the image
    const filename = `sticker`;
    const fileOption = { filename };
    bot.sendDocument(chat.id, imgDoc, {}, fileOption); //sends the image to the user
})





