import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { OpenAIApi, Configuration } from 'openai';
import admin from 'firebase-admin';
config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
}


admin.initializeApp({    
    credential: admin.credential.cert({
        "type": process.env.FIRE_TYPE,
        "project_id": process.env.FIRE_PROJECT_ID,
        "private_key_id": process.env.FIRE_PRIVATE_KEY_ID,
        "private_key": process.env.FIRE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        "client_email": process.env.FIRE_CLIENT_EMAIL,
        "client_id": process.env.FIRE_CLIENT_ID,
        "auth_uri": process.env.FIRE_AUTH_URI,
        "token_uri": process.env.FIRE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIRE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIRE_CLIENT_X509_CERT_URL,
        "universe_domain": process.env.FIRE_UNIVERSE_DOMAIN,
    } as any)
});

const db = admin.firestore();

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

const createPropmt = async (chatId: string) => {
    const snapshot = await db.collection('chats').doc(chatId).collection('messages').orderBy("timestamp").get();
    const chatHistory = snapshot.docs.map((doc) => {
        const data = doc.data() as TMessage;
        return data;
    });
    const zeroPrompt = `
        Перед тобой чат, в готором Человек общается с тобой.
        Ты - Бог.
        Ответь так, как ответил бы Бог.
        Ни при каких условиях не выходи из образа Бога.

    `;

    console.log('chatHistory', chatHistory);

    const textLog = chatHistory.map((message) => {
        return `${message.party === 'Bot' ? 'Бог' : 'Человек'}: ${message.message}`;
    });
    return zeroPrompt + textLog.join('\n') + '\nБог:';
};

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) { return; }

    const chatId = msg.chat.id;
    bot.sendChatAction(chatId, 'typing');

    await db.collection('chats').doc(chatId.toString()).collection('messages').add({
        message: msg.text,
        party: 'User',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    const prompt = await createPropmt(chatId.toString());
    console.log('prompt', prompt);

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

    await db.collection('chats').doc(chatId.toString()).collection('messages').add({
        message: answer,
        party: 'Bot',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    bot.sendMessage(chatId, answer);
});
