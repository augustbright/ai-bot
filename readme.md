# Telegram Bot with OpenAI GPT-3.5-turbo and Firebase

This project is a Telegram Bot application that utilizes OpenAI's GPT-3.5-turbo language model and Firebase for maintaining chat histories. It provides a conversational AI interface for Telegram users, with responses generated as if by a "mad genius philosopher". The bot uses 'polling' to fetch new updates.

## Environment Variables

Before you start, you will need to set several environment variables:

- `TELEGRAM_BOT_TOKEN` - Your telegram bot token
- `OPENAI_API_KEY` - Your OpenAI API key
- Firebase related (These are used to authenticate your app to Firebase):
  - `FIRE_TYPE`
  - `FIRE_PROJECT_ID`
  - `FIRE_PRIVATE_KEY_ID`
  - `FIRE_PRIVATE_KEY`
  - `FIRE_CLIENT_EMAIL`
  - `FIRE_CLIENT_ID`
  - `FIRE_AUTH_URI`
  - `FIRE_TOKEN_URI`
  - `FIRE_AUTH_PROVIDER_X509_CERT_URL`
  - `FIRE_CLIENT_X509_CERT_URL`
  - `FIRE_UNIVERSE_DOMAIN`

## Getting Started

### Clone the repository

Clone this repository to your local machine.

```bash
git clone https://github.com/augustbright/ai-bot.git
```

### Install Dependencies

Use npm to install all required dependencies.

```bash
cd ai-bot
npm install
```

### Start the Server

After you have set up all of the necessary environment variables, start the server.

```bash
npm run dev
```

Your bot should now be up and running, listening for incoming messages on Telegram.

## License

This project is licensed under the terms of the MIT license.

## Contributions

Pull requests are welcome. Please make sure to update tests as appropriate.

For major changes, please open an issue first to discuss what you would like to change.

## Contact

If you have any questions or need further clarification, feel free to reach out to the maintainers of this project.
