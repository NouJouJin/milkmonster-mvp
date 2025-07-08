'use server';

import OpenAI from 'openai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// --- 型定義 ---
export interface Monster {
  id: string; name: string; imageUrl: string; hp: number;
  attack: number; rarity: number; attribute: string;
}
type ActionState = {
  message: string; monster?: Monster; error?: string;
}

// --- 初期化 ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet1';

// --- Google認証（JWT手動生成） ---
async function getGoogleAccessToken() {
  const keyFilePath = path.join(process.cwd(), 'google-credentials.json');
  // Vercel環境も考慮（ファイルがない場合は環境変数から）
  const keys = process.env.GCP_CREDENTIALS_JSON
    ? JSON.parse(process.env.GCP_CREDENTIALS_JSON)
    : JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));

  const claims = {
    iss: keys.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(claims, keys.private_key, { algorithm: 'RS256' });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("アクセストークン取得エラー:", data);
    throw new Error('Failed to retrieve access token');
  }
  return data.access_token;
}

// --- メインのアクション関数 ---
export async function generateMonsterAction(
  prevState: ActionState, formData: FormData
): Promise<ActionState> {

  const formSchema = z.object({
    productName: z.string().min(1), category: z.enum(['牛乳', '加工乳', '乳飲料']),
    nonFatSolid: z.coerce.number().min(0), milkFat: z.coerce.number().min(0),
    manufacturer: z.string().min(1),
  });
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) { return { message: '入力エラー', error: '入力内容を確認してください。' }; }
  const data = validatedFields.data;

  const hp = Math.round(data.nonFatSolid * 10);
  const attack = Math.round(data.milkFat * 10);
  const rarity = { '牛乳': 3, '加工乳': 2, '乳飲料': 1 }[data.category] || 1;
  const manufacturerAttributes: { [key: string]: string } = { '雪印': '氷', 'メグミルク': '氷', '森永': '光', '明治': '炎', 'よつ葉': '草', 'タカナシ': '水' };
  let attribute = '無';
  for (const key in manufacturerAttributes) { if (data.manufacturer.includes(key)) { attribute = manufacturerAttributes[key]; break; } }
  const name = `${data.productName}のスライム`;

  const rarityDesc = { 1: "a simple, cute, blob-like", 2: "a cool, slightly evolved", 3: "an epic, impressive looking" }[rarity];
  const attributeDesc = { '氷': 'ice/crystal', '光': 'light/shining', '炎': 'fire/warm', '草': 'nature/plant', '水': 'water/bubble', '無': 'plain milk-white' }[attribute];
  const prompt = `A full-body character of a milk-inspired monster. The monster is ${rarityDesc}. The monster's theme is ${attributeDesc}. Style: cute, Japanese anime style, simple vector art, clean lines, on a pure white background.`;

  try {
    const dalleResponse = await openai.images.generate({
      model: "dall-e-3", prompt, n: 1, size: "1024x1024", quality: "standard",
    });
    const imageUrl = dalleResponse.data[0]?.url;
    if (!imageUrl) throw new Error('画像URLが取得できませんでした。');

    const accessToken = await getGoogleAccessToken();
    const monsterId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const newRow = [ monsterId, name, imageUrl, hp, attack, rarity, attribute, data.productName, data.manufacturer, createdAt ];
    const sheetApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A1:append?valueInputOption=USER_ENTERED`;
    const sheetResponse = await fetch(sheetApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [newRow] }),
    });

    if (!sheetResponse.ok) {
      const errorData = await sheetResponse.json();
      throw new Error(`Google Sheets API Error: ${errorData.error.message}`);
    }

    const monsterForClient: Monster = { id: monsterId, name, imageUrl, hp, attack, rarity, attribute };
    return { message: 'モンスターが生まれました！', monster: monsterForClient };

  } catch (e) {
    console.error(e);
    return { message: '処理中にエラーが発生しました。', error: (e as Error).message };
  }
}

// 図鑑ページ用のデータ取得関数
export async function getMonsters(): Promise<{ monsters: Monster[], error?: string }> {
  try {
    const accessToken = await getGoogleAccessToken();
    const sheetApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:J`;
    const response = await fetch(sheetApiUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!response.ok) { throw new Error('Failed to fetch sheet data'); }
    const data = await response.json();
    const rows = data.values || [];
    if (rows.length <= 1) return { monsters: [] };
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monsters = rows.slice(1).map((row: any[]) => ({ // ← この行の上に追加
      id: row[0] || '', name: row[1] || '', imageUrl: row[2] || '',
      hp: parseInt(row[3], 10) || 0, attack: parseInt(row[4], 10) || 0,
      rarity: parseInt(row[5], 10) || 0, attribute: row[6] || '',
    })).reverse();
    
    return { monsters };
  } catch (error) {
    return { monsters: [], error: (error as Error).message };
  }
}