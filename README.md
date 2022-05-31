# open-api-gateway-generator
## 概要
OpenAPIからAPI Gateway、Lambda関数、APIクライアント、APIのレスポンスの型を生成するプロジェクトのサンプル。  

## 前提
以下はインストール済みとする。
- NodeJS 16以上

## セットアップ
必要なライブラリをインストールする。
```bash
$ npm run init
```

## デプロイ
デプロイを実行する。
```bash
# リソースを生成するAWSアカウントを環境変数に設定する
$ export ACCOUNT_ID={ACCOUNT_ID}
# リソースを生成するリージョンを環境変数に設定する(未指定の場合はap-northeast-1)
$ export REGION={REGION}
# アーティファクトを配置するS3バケットを環境変数に設定する
$ export ARTIFACT_BUCKET={ARTIFACT_BUCKET}

# デプロイ実行
$ npm run deploy
```
デプロイが正常終了したらAPI Gateway、Lambda関数などが生成されている。  

### 動作確認
コマンドラインからAPIを実行できる。以下のコマンドを実行して結果が表示されればOK。  
このコマンドではopenapi generatorで自動生成されたAPIクライアントからAPIにリクエストを送信している。
```bash
$ node dist/client/index.js
{ id: '00000', name: 'suzuxander' }
```