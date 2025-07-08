'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { generateMonsterAction, type Monster } from './actions';
import Link from 'next/link';

// --- 型定義と初期値 ---
const initialState: {
  message: string;
  monster?: Monster;
  error?: string;
} = {
  message: '',
};


// --- コンポーネント定義 ---

// ヘッダー
function Header() {
  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-10">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Milk Monster</h1>
        <Link href="/collection" className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">
          図鑑を見る
        </Link>
      </nav>
    </header>
  );
}

// 送信ボタン
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-white"
    >
      {pending ? 'モンスターを召喚中...' : 'モンスターを召喚する！'}
    </button>
  );
}

// モンスター表示カード
function MonsterCard({ monster }: { monster: Monster }) {
  const Star = ({ filled }: { filled: boolean }) => (
    <span className={`text-3xl ${filled ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
  );
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border-t-4 border-blue-500 animate-fade-in">
      <div className="relative aspect-square w-full mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={monster.imageUrl}
          alt={monster.name}
          className="absolute top-0 left-0 w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-bold">{monster.name}</h3>
        <div className="flex justify-center my-2">
          {[...Array(3)].map((_, i) => <Star key={i} filled={i < monster.rarity} />)}
        </div>
        <div className="flex justify-around text-center mt-4 bg-gray-100 p-3 rounded-lg">
          <div><p className="text-sm text-gray-600">HP</p><p className="text-xl font-bold text-red-500">{monster.hp}</p></div>
          <div><p className="text-sm text-gray-600">攻撃力</p><p className="text-xl font-bold text-blue-500">{monster.attack}</p></div>
          <div><p className="text-sm text-gray-600">属性</p><p className="text-xl font-bold text-green-600">{monster.attribute}</p></div>
        </div>
      </div>
    </div>
  );
}

// --- メインページ ---
export default function HomePage() {
  const [state, formAction] = useActionState(generateMonsterAction, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50">
      <Header />
      <main className="flex-grow w-full flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl space-y-8"> {/* ← max-w-md から max-w-2xl に変更して少し広く */}
          
          {state.monster ? (
            // --- 結果表示 ---
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-3xl font-bold">モンスター誕生！</h2>
              <MonsterCard monster={state.monster} />
              <button onClick={() => window.location.reload()} className="w-full max-w-sm bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                もう一度生成する
              </button>
            </div>
          ) : (
            // --- 初期表示 (キービジュアル + フォーム) ---
            <>
              {/* ★★★ ここからキービジュアルを追加 ★★★ */}
              <div className="w-full rounded-xl overflow-hidden shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/key-visual.png" 
                  alt="ミルクモンスター キービジュアル" 
                  className="w-full h-auto object-cover" 
                />
              </div>
              {/* ★★★ ここまで ★★★ */}
                 <div className="text-center mt-8">
                <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-yellow-500">ミルクモンスター</h2>
                <p className="mt-2 text-lg text-gray-600">{'あなたの"おいしい"が、モンスターになる。'}</p>
              </div>

              <div className="max-w-md mx-auto"> {/* フォームの幅は維持 */}
                <form action={formAction} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-800">商品名</label>
                    <input type="text" name="productName" id="productName" defaultValue="おいしい牛乳" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-800">種類別名称</label>
                    <select name="category" id="category" defaultValue="牛乳" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                      <option>牛乳</option>
                      <option>加工乳</option>
                      <option>乳飲料</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nonFatSolid" className="block text-sm font-medium text-gray-800">無脂乳固形分 (%)</label>
                      <input type="number" name="nonFatSolid" id="nonFatSolid" defaultValue="8.3" step="0.1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label htmlFor="milkFat" className="block text-sm font-medium text-gray-800">乳脂肪分 (%)</label>
                      <input type="number" name="milkFat" id="milkFat" defaultValue="3.8" step="0.1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-800">製造者名</label>
                    <input type="text" name="manufacturer" id="manufacturer" defaultValue="明治" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400" />
                  </div>
                  <SubmitButton />
                  {state.error && <p className="text-sm text-red-600 mt-2">{state.message}: {state.error}</p>}
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

