// test-sheets.js

const { google } = require('googleapis');
const path = require('path');

// --- 設定項目 ---
// あなたのスプレッドシートIDをここに貼り付けてください
const SPREADSHEET_ID = '1wKf4Igg-AB9MGVLEvMBuLgoAVY4IQch3E3gVLlI4cEc'; 
// あなたのサービスアカウントJSONファイルの名前
const KEY_FILE_PATH = path.join(__dirname, 'google-credentials.json');
// 書き込むシート名
const SHEET_NAME = 'Sheet1';
// ----------------

async function testWriteToSheet() {
  console.log("--- Google Sheets API 書き込みテスト開始 ---");
  console.log(`キーファイルパス: ${KEY_FILE_PATH}`);
  console.log(`スプレッドシートID: ${SPREADSHEET_ID}`);

  try {
    // 1. 認証オブジェクトの作成
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 2. 認証済みクライアントの作成
    const client = await auth.getClient();

    // 3. Google Sheets API インスタンスの作成（authを渡す）
    const sheets = google.sheets({ version: 'v4', auth: client });

    console.log("認証成功。スプレッドシートへの書き込みを試みます...");

    // 4. スプレッドシートに1行追記
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [`テスト成功！`, `現在の日時: ${new Date().toLocaleString()}`]
        ],
      },
    });

    console.log("🎉🎉🎉 テスト成功！ 🎉🎉🎉");
    console.log("スプレッドシートにデータが書き込まれました。確認してください。");
    console.log("更新されたセル範囲:", response.data.updates.updatedRange);

  } catch (error) {
    console.error("❌❌❌ テスト失敗 ❌❌❌");
    console.error("エラーが発生しました。詳細:", error.message);
    if (error.response) {
      console.error("ステータスコード:", error.response.status);
      console.error("エラー詳細:", error.response.data.error);
    }
  }
}

testWriteToSheet();