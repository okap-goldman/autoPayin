import axios from 'axios';
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbwxNJ57UyZQmbglkT44TGdg8Dt0Egz04KoZGUQNMdmtloiHGP7a99fhhZMUMdcBXRyJ-g/exec';

const isNoTranslationRequiredName = (japaneseName: string): boolean =>
  [
    'カ）ゴールド インターナシヨナル ジヤパン',
    'ジーラインシステムズ （カ',
    'カ）グリーンテツク'
  ].includes(japaneseName);

export const convertEnglishNameFromJapanese = async (
  japaneseName: string
): Promise<string> => {
  if (isNoTranslationRequiredName(japaneseName)) {
    return japaneseName;
  }

  const res = await axios.post(GAS_URL, {
    translateText: japaneseName
  });
  return res.data.result;
};
