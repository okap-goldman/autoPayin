import {convertDateToString} from '../util/Time';

import axios from 'axios';
const TELEGRAM_BOT_TOKEN = '5161156995:AAEYg5BqOlpQjWE1FBhf5pKTYClercmOLeI';
const TELEGRAM_CHAT_ID = -1001412381381; //group chatは - から始まる //個人：829793446;

export const sendTelegram = async (
    msg: string,
    account: string
): Promise<void> => {
    const content = `[${account}] ${convertDateToString(new Date())}\n${msg}\n`;
    const send_url: string = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage?chat_id=' + TELEGRAM_CHAT_ID + '&parse_mode=Markdown&text=' + encodeURI(content);
    await axios.get(send_url);
};
