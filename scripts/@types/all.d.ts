export type AccountInfo = {
  readonly account: string;
  readonly loginId: string;
  readonly loginPw: string;
  readonly sheetName: string;
};

export type AccountInfos = {
  readonly [key: string]: AccountInfo;
};

export type AccountInfosJson = {
    readonly spreadsheetId: string;
    readonly accounts: AccountInfos;
};

export type DakutenPairsJson = {
    readonly [key: string]: string;
};
