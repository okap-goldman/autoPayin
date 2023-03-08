import {sleep} from '../util/Time';
import {mySheets} from './GoogleSpreadsheet';
import {convertEnglishNameFromJapanese} from './NameTranslator';

const DEPOSIT_DETAIL_INDEX = {
  date: 0,
  senderName: 1,
  amount: 2,
  accountBalance: 3
};

/**
 * @notice スプレッドシートに新しいレコードを記入する
 * @param spreadsheetId 記入先のスプレッドシートのID
 * @param sheetName 記入先のシート名
 * @param account 口座番号
 * @param new_records 新しい入出金明細
 * @dev Sheets APIは1分あたりの書き込みが60回に制限されているため、起動時の50件書き込みがエラーにならないようにsleepを入れている
 */
export const writeNewRakutenRecordToSpreadsheet = async (
  spreadsheetId: string,
  sheetName: string,
  account: string,
  new_records: string[]
): Promise<void> => {
  //最初に現時点の最終行を取得しておく　ループ内で毎回取得してると1分あたりのAPI呼び出し制限にひっかかりそう
  let sheetLastRow = await mySheets.getLastRow(spreadsheetId, sheetName);

  //スプレッドシートに情報を送る
  for (let i = new_records.length - 1; i >= 0; i--) {
    const write_record = new_records[i].split(/,/g);
    //引き出し（金額がマイナス）の場合は報告しない
    if (/-/.test(write_record[DEPOSIT_DETAIL_INDEX.amount])) {
      continue;
    }

    const engName = await convertEnglishNameFromJapanese(write_record[DEPOSIT_DETAIL_INDEX.senderName]);

    //jpn payinシートに記入
    sheetLastRow++;
    await mySheets.setValues(
      spreadsheetId,
      sheetName,
      `A${sheetLastRow}:E${sheetLastRow}`,
      [
        [
          write_record[DEPOSIT_DETAIL_INDEX.date],
          write_record[DEPOSIT_DETAIL_INDEX.senderName],
          engName,
          write_record[DEPOSIT_DETAIL_INDEX.amount],
          write_record[DEPOSIT_DETAIL_INDEX.accountBalance]
        ]
      ]
    );

    await sleep(3000);
  }
};
