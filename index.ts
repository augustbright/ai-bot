import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { OpenAIApi, Configuration } from 'openai';

config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
}

const token = process.env.TELEGRAM_BOT_TOKEN;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

type TMessage = {
    message: string,
    party: 'User' | 'Bot'
};

const chatsHistory: Record<number, TMessage[]> = {};

const createPropmt = (chatHistory: TMessage[]) => {
    const zeroPrompt = `
        Перед тобой чат, в готором Человек общается с тобой.
        Ты - Бог.
        Ответь так, как ответил бы Бог.
        Ни при каких условиях не выходи из образа Бога.

    `;

    const textLog = chatHistory.map((message) => {        
        return `${message.party}: ${message.message}`;
    });
    return zeroPrompt + textLog.join('\n') + '\nБог:';
};

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async (msg) => {    
    const chatId = msg.chat.id;
    if (!chatsHistory[chatId]) {
        chatsHistory[chatId] = [];
    }
    const chatHistory = chatsHistory[chatId];
    chatHistory.push({
        message: msg.text || '',
        party: 'User'
    });

    const prompt = createPropmt(chatHistory);
    console.log('prompt', prompt);
    bot.sendChatAction(chatId, 'typing');

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        temperature: 0.5,
        max_tokens: 2048,
        top_p: 0.3,
        frequency_penalty: 0.5,
        presence_penalty: 0.0
    });

    const answer = completion.data.choices[0].text || '';
    chatHistory.push({
        message: answer,
        party: 'Bot'
    });

    bot.sendMessage(chatId, answer);
});
