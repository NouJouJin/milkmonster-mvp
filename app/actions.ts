'use server';

import OpenAI from 'openai';
import { z } from 'zod';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 入力フォームのバリデーションスキーマ
const formSchema = z.object({
  productName: z.string().min(1, '商品名は必須です。'),
  category: z.enum(['牛乳', '加工乳', '乳飲料']),
  nonFatSolid: z.coerce.number().min(0),
  milkFat: z.coerce.number().min(0),
  manufacturer: z.string().min(1, '製造者名は必須です。'),
});

// 返却するモンスターの型定義
export interface Monster {
  name: string;
  imageUrl: string;
  hp: number;
  attack: number;
  rarity: number;
  attribute: string;
}

// prevStateの型を定義
type ActionState = {
  message: string;
  monster?: Monster;
  error?: string;
}

export async function generateMonsterAction(
  prevState: ActionState, // ← any を ActionState に変更
  formData: FormData
): Promise<ActionState> {
  
  // 1. フォームデータのバリデーション
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return { message: '入力内容に誤りがあります。', error: validatedFields.error.flatten().fieldErrors.toString() };
  }
  const data = validatedFields.data;

  // 2. モンスターのパラメータ計算
  const hp = Math.round(data.nonFatSolid * 10);
  const attack = Math.round(data.milkFat * 10);
  const rarity = { '牛乳': 3, '加工乳': 2, '乳飲料': 1 }[data.category] || 1;
  
  const manufacturerAttributes: { [key: string]: string } = {
    '雪印': '氷', 'メグミルク': '氷',
    '森永': '光', '明治': '炎',
    'よつ葉': '草', 'タカナシ': '水',
  };
  let attribute = '無';
  for (const key in manufacturerAttributes) {
    if (data.manufacturer.includes(key)) {
      attribute = manufacturerAttributes[key];
      break;
    }
  }

  const name = `${data.productName}のスライム`;

  // 3. DALL-E 3に投げるプロンプトを生成
  const rarityDesc = { 1: "a simple, cute, blob-like", 2: "a cool, slightly evolved", 3: "an epic, impressive looking" }[rarity];
  const attributeDesc = { '氷': 'ice/crystal', '光': 'light/shining', '炎': 'fire/warm', '草': 'nature/plant', '水': 'water/bubble', '無': 'plain milk-white' }[attribute];
  
  const prompt = `A full-body character of a milk-inspired monster. The monster is ${rarityDesc}. The monster's theme is ${attributeDesc}. Style: cute, Japanese anime style, simple vector art, clean lines, on a pure white background.`;

  // 4. OpenAI APIを呼び出して画像生成
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) throw new Error('画像URLが取得できませんでした。');

    const monster: Monster = { name, imageUrl, hp, attack, rarity, attribute };
    return { message: 'モンスターが生まれました！', monster };

  } catch (e) {
    console.error(e);
    return { message: '画像の生成に失敗しました。APIキーまたはOpenAIのステータスを確認してください。', error: (e as Error).message };
  }
}