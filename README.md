# autoPayin

## VPS 設定方法
1. conohaで Windows server 2016 の VPSを1つ作成（データベースエディションでは無く普通のサーバーを作る）
1. nodejsをインストール
1. chromeからgit bashをインストール（デフォルト設定でOK）
1. sshキーを設定 https://qiita.com/shizuma/items/2b2f873a0034839e47ce
1. このレポジトリをSSHでclone
1. Telegramをインストール https://desktop.telegram.org/
1. _secret_accounts.json token.json credentials.json' をTelegram経由で送信
1. npm install -g forever
1. `npm install`
1. git bashを再起動(これをしないとforeverコマンドが追加されない)
1. `forever start autoPayin.js r0000000` (-wオプションは使うとログファイルに記入した時点でリスタートがかかってしまうので使わない)

## Google API 設定方法

下記のAPIが有効になっているか確認する
GCP Project:
https://console.cloud.google.com/apis/api/translate.googleapis.com/metrics?project=monitoringdepositstatement

DJC8VFUdCDK4Tq9QiKXeb3vEsWwc5c@gmail.com

Sheets API
Cloud Translation API

シートに閲覧権限で下記のユーザーを追加する
monitoringdepositaccount@monitoringdepositstatement.iam.gserviceaccount.com
