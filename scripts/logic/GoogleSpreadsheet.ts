import {GaxiosResponse} from 'gaxios';
import {google, sheets_v4} from 'googleapis';
import * as path from 'path';

class GoogleSheetsClass {
  private sheets: sheets_v4.Sheets | undefined;

  constructor() {
    google.auth
      .getClient({
        keyFile: path.join(process.env.PWD as string, 'credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      })
      .then((auth) => {
        this.sheets = google.sheets({version: 'v4', auth});
      });
  }

  async getLastRow(
    spreadsheet_id: string,
    sheet_name: string
  ): Promise<number> {
    if (this.sheets === undefined) {
      throw new Error('Please initialize GoogleSheetsClass');
    }
    const result: GaxiosResponse = await this.sheets.spreadsheets.values.append(
      {
        spreadsheetId: spreadsheet_id,
        range: `'${sheet_name}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[]]
        }
      }
    );

    //result.data.tableRangeが無い = シートのどのセルにも値が入力されていないので、0を返す
    if (!result.data.tableRange) {
      return 0;
    }
    const match = result.data.tableRange.match(
      /^.*![A-Z]+\d+:[A-Z]+(?<lastRow>\d+)$/
    );
    if (match) {
      return Number(match.groups.lastRow);
    } else {
      //1つのセルのみ入力されているシートの場合は上記の正規表現ではエラーになる
      const match_only1cell = result.data.tableRange.match(
        /^.*![A-Z]+(?<lastRow>\d+)$/
      );
      return Number(match_only1cell.groups.lastRow);
    }
  }

  public async getValues(
    spreadsheet_id: string,
    sheet_name: string,
    range: string
  ): Promise<any[][]> {
    if (this.sheets === undefined) {
      throw new Error('Please initialize GoogleSheetsClass');
    }
    const result: GaxiosResponse<sheets_v4.Schema$ValueRange> =
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheet_id,
        range: `'${sheet_name}'!${range}`
      });
    return result.data.values ? result.data.values : [[]];
  }

  async setValues(
    spreadsheet_id: string,
    sheet_name: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    if (this.sheets === undefined) {
      throw new Error('Please initialize GoogleSheetsClass');
    }

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet_id,
      range: `'${sheet_name}'!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    });
  }

  async appendRow(
    spreadsheet_id: string,
    sheet_name: string,
    rowValues: any[]
  ): Promise<void> {
    if (this.sheets === undefined) {
      throw new Error('Please initialize GoogleSheetsClass');
    }
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheet_id,
      range: `'${sheet_name}'!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowValues]
      }
    });
  }
}

export const mySheets = new GoogleSheetsClass();
