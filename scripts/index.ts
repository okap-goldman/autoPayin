'use strict';

const ACCOUNT_INFOS_JSON_FILENAME = '_secret_accounts.json';
import * as fs from 'fs';
import * as path from 'path';
import {AccountInfosJson} from './@types/all';
import {monitoringRakutenDepositStatement} from './Rakuten';
import {debugLog} from './util/logger';

const main = async () => {
  const account_number = process.argv[2];
  const accountInfoJsonPath = path.join(process.cwd(), ACCOUNT_INFOS_JSON_FILENAME);
  if (
    !fs.existsSync(accountInfoJsonPath)
  ) {
    debugLog(`MyError! ${ACCOUNT_INFOS_JSON_FILENAME} not exist`);
    return;
  }

  const LIS: AccountInfosJson = JSON.parse(
    fs.readFileSync(accountInfoJsonPath, 'utf8')
  );

  if (!LIS.accounts[account_number]) {
    debugLog(`MyError! not found info ${account_number} `);
    return;
  }
  await monitoringRakutenDepositStatement(
    LIS.spreadsheetId,
    LIS.accounts[account_number]
  );
};

main();
