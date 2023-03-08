import * as fs from 'fs';
import * as path from 'path';
import {executablePath} from 'puppeteer';
import puppeteer from 'puppeteer';
import {Browser, Page} from 'puppeteer';
import {AccountInfo, DakutenPairsJson} from './@types/all';
import {dakutenPairs} from './config/DakutenPairs';
import {writeNewRakutenRecordToSpreadsheet} from './logic/RakutenRecordWriter';
import {sendTelegram} from './logic/Telegram';
import {convertDateToString, sleep} from './util/Time';

const RAKUTEN_LOGIN_URL =
  'https://fes.rakuten-bank.co.jp/MS/main/RbS?COMMAND=LOGIN&&CurrentPageID=DIRECT_LOGIN_START&GROUP_ID=p014&USER_ID=prak0008';

/**
 * 最新の入出金明細を抽出する
 * @param account 口座番号
 * @param lastDepositStatementRows 最終実行時点での入出金明細
 * @param currentDepositStatementRows 最新の入出金明細
 * @return 新しく入ってきた入出金明細
 */
const extractNewRecords = (
  account: string,
  lastDepositStatementRows: string[],
  currentDepositStatementRows: string[]
): string[] => {
  const newRecords: string[] = [];
  for (let i = 0; i < currentDepositStatementRows.length; i++) {
    //照合を取る時は念の為次データも完全一致しているか確認
    if (
      currentDepositStatementRows[i] === lastDepositStatementRows[0] &&
      currentDepositStatementRows[i + 1] === lastDepositStatementRows[1]
    ) {
      break;
    } else {
      newRecords.push(currentDepositStatementRows[i]);
    }
  }

  return newRecords;
};

/**
 * 入出金明細のログファイルパスを返す
 * @param account 口座番号
 * @return パス
 */
const getLastDepositStatementHistoryLogPath = (account: string): string => {
  return `${path.dirname(process.argv[1])}/withdrawal_history-${account}.log`;
};

/**
 * 直前実行時の入出金明細ログを取得する
 * @param account アカウントNo.
 * @return 入出金明細ログ
 */
const getLastDepositStatementRows = (account: string): string[] => {
  const withdrawal_history_log_file_path: string =
    getLastDepositStatementHistoryLogPath(account);
  const depositStatementHistory: string = fs.readFileSync(
    withdrawal_history_log_file_path,
    'utf-8'
  );
  return depositStatementHistory.split(/\r\account/g);
};

/**
 * ページが楽天の入出金ページかどうか判断する
 * @param page Pageオブジェクト
 * @return　ログインページならtrue
 * @dev BREAD_LISTがあるかどうかで判断している。DOMを取得して !! をつけることでbooleanに変換
 */
const isRakutenDepositStatementsPage = async (page: Page): Promise<boolean> => {
  return page.evaluate((): boolean => {
    const bread_list_dom: HTMLElement | null =
      document.getElementById('BREAD_LIST');
    return !!(
      bread_list_dom?.innerText && /入出金明細/.test(bread_list_dom.innerText)
    );
  });
};

/**
 * 楽天の入出金ページに移動する
 * @param page Pageオブジェクト
 * @param loginId ログインID(口座番号)
 * @param loginPw ログインパスワード
 * @dev 入出金ページに移動しようとした時にメンテナンスに入った場合、メンテナンス終了まで待機する
 */
const gotoRakutenDepositStatementsPage = async (
  page: Page,
  loginId: string,
  loginPw: string
): Promise<void> => {
  await page.goto(RAKUTEN_LOGIN_URL);
  await sleep(1000);

  //メンテナンス中なら1時間おきにリロード
  let isLoginPage = await isRakutenLoginPage(page);
  if (!isLoginPage) {
    await sendTelegram('start maintenance', loginId);
    await sleep((new Date().getTime() % (1000 * 60 * 60)) + 1000);
    for (;;) {
      await page.goto(RAKUTEN_LOGIN_URL);
      await sleep(1000);
      isLoginPage = await isRakutenLoginPage(page);
      if (isLoginPage) {
        await sendTelegram('end maintenance', loginId);
        break;
      }
      await sleep(1000 * 60 * 60);
    }
  }
  await page.evaluate(
    (id: string, pw: string): void => {
      // @ts-ignore
      document.getElementById('LOGIN:USER_ID').value = id;
      // @ts-ignore
      document.getElementById('LOGIN:LOGIN_PASSWORD').value = pw;
    },
    loginId,
    loginPw
  );
  await page.click('.btn-login01 a');
  await page.waitForNavigation({waitUntil: ['load']});
};

/**
 * ページが楽天のログインページかどうか判断する
 * @param page Pageオブジェクト
 * @return　ログインページならtrue
 * @dev ログインID入力欄があるかどうかで判断している。DOMを取得して !! をつけることでbooleanに変換している
 */
const isRakutenLoginPage = (page: Page): Promise<boolean> => {
  return page.evaluate(() => {
    return !!document.getElementById('LOGIN:USER_ID');
  });
};

/**
 * 楽天の入出金明細テーブルを文字列配列に変換する
 * @param page ページオブジェクト
 * @return テーブルの文字列配列（行毎の一次元配列　列はカンマ区切り）
 */
const generateRakutenDepositStatementRows = async (
  page: Page
): Promise<string[]> => {
  return page.evaluate((pairs: DakutenPairsJson) => {
    const table_trs: HTMLCollectionOf<Element> = document
      .getElementsByClassName('table01')[0]
      .getElementsByTagName('tr');
    const trs_csv: string[] = [];

    for (let i = 1; i < table_trs.length; i++) {
      //1行目は飛ばす
      const tds: HTMLCollectionOf<HTMLTableCellElement> =
        table_trs[i].getElementsByTagName('td');
      const tds_arr: string[] = [];
      for (let j = 0; j < tds.length; j++) {
        let add_text: string = tds[j].innerText.replace(/,/g, '');
        //数値以外が入ってれば、全角濁点のreplaceを行う
        if (j === 1 && /゛|゜/.test(add_text)) {
          console.log(`dakuten: ${add_text}`);
          for (let k in pairs) {
            add_text = add_text.replace(k, pairs[k]);
          }
          console.log(`dakuten replaced: ${add_text}`);
        }
        tds_arr.push(add_text);
      }
      trs_csv.push(tds_arr.join());
    }
    return trs_csv;
  }, dakutenPairs);
};

/**
 * 楽天の入出金明細をモニタリングし、新しいレコードが追加される度スプレッドシートに記入していく
 * @param spreadsheetId 記入先のスプレッドシートのID
 * @param accountInfo アカウント情報（jsonから読み込み）
 */
export const monitoringRakutenDepositStatement = async (
  spreadsheetId: string,
  accountInfo: AccountInfo
): Promise<void> => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath()
  });
  // try {
  const page: Page = await browser.newPage();
  await sendTelegram('start monitoring', accountInfo.account);

  for (;;) {
    //入出金ページに移動
    if (!(await isRakutenDepositStatementsPage(page))) {
      await gotoRakutenDepositStatementsPage(
        page,
        accountInfo.loginId,
        accountInfo.loginPw
      );
    }
    await sleep(5000);
    await page.waitForSelector('.table01', {visible: true, timeout: 0});

    //最新の入出金明細を抽出
    const currentDepositStatementRows: string[] =
      await generateRakutenDepositStatementRows(page);
    //前回実行時時点での明細を取得し、最新のものと照合してこの1分の新しいデータを取得する
    const withdrawal_history_log_file_path: string =
      getLastDepositStatementHistoryLogPath(accountInfo.account);
    if (!fs.existsSync(withdrawal_history_log_file_path)) {
      fs.writeFileSync(
        withdrawal_history_log_file_path,
        currentDepositStatementRows.join('\n')
      ); //初回実行のみ
    }
    const lastDepositStatementRows: string[] = getLastDepositStatementRows(
      accountInfo.account
    );
    const new_records: string[] = extractNewRecords(
      accountInfo.account,
      lastDepositStatementRows,
      currentDepositStatementRows
    );
    if (new_records.length === 0) {
      await sleep(30000 + Math.random() * 30000);
      continue;
    }

    //最新のデータを加えてログデータを更新
    console.log(
      accountInfo.account,
      convertDateToString(new Date()),
      ' new_records:',
      new_records
    );
    lastDepositStatementRows.unshift(...new_records);
    fs.writeFileSync(
      getLastDepositStatementHistoryLogPath(accountInfo.account),
      lastDepositStatementRows.join('\n')
    );

    //スプレッドシートにデータを送信
    await writeNewRakutenRecordToSpreadsheet(
      spreadsheetId,
      accountInfo.sheetName,
      accountInfo.account,
      new_records
    );

    await sleep(30000 + Math.random() * 30000);
  }
};
