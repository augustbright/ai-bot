import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from 'openai';
import admin from 'firebase-admin';
import express from 'express';
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

const createPropmtMessages = async (chatId: string, newMessage): Promise<ChatCompletionRequestMessage[]> => {
    const snapshot = await db.collection('chats').doc(chatId).collection('messages').orderBy("timestamp").get();
    const chatHistory = snapshot.docs.map((doc) => {
        const data = doc.data() as TMessage;
        return data;
    });
    console.log('chatHistory', chatHistory);

    const messages = chatHistory.map<ChatCompletionRequestMessage>((message) => {
        return {
            content: message.message,
            role: message.party === 'User' ? 'user' : 'assistant',
        }
    }).slice(-10);

    messages.unshift({
        role: 'system',
        content: `
        Отвечай как безумный гений-философ
        `
    });

    messages.push({
        content: newMessage,
        role: 'user'
    });

    return messages;
};

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) { return; }

    const chatId = msg.chat.id;
    bot.sendChatAction(chatId, 'typing');

    const messages = await createPropmtMessages(chatId.toString(), msg.text);
    console.log('messages', messages);

    let answer = '';
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages,
            temperature: 2,
            max_tokens: 2048,
            top_p: 0.8,
            frequency_penalty: 2,
            presence_penalty: 0.0
        });
        answer = completion.data.choices[0].message.content || '';

        await db.collection('chats').doc(chatId.toString()).collection('messages').add({
            message: msg.text,
            party: 'User',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });    

        await db.collection('chats').doc(chatId.toString()).collection('messages').add({
            message: answer,
            party: 'Bot',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    
    } catch (error) {
        answer = `Что-то пошло не так. Попробуй еще раз`;
        console.log(error);
    }

    console.log('answer', answer);

    bot.sendMessage(chatId, answer);
});


const app = express();

app.get('/', async (req, res) => {
    res.send(`You don't know 🦊`);
});

app.listen(process.env.PORT || 3000, () => {
    console.log('server started');
});
