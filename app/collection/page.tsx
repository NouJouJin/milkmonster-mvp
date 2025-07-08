// app/collection/page.tsx

import Link from 'next/link';
import { getMonsters } from '../actions'; // actions.tsから関数をインポート

// --- 型定義 ---
interface Monster {
  id: string;
  name: string;
  imageUrl: string;
  hp: number;
  attack: number;
  rarity: number;
  attribute: string;
}

// --- コンポーネント ---
function MonsterCard({ monster }: { monster: Monster }) {
  const Star = ({ filled }: { filled: boolean }) => (
    <span className={`text-2xl ${filled ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
  );
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-full border-t-4 border-blue-500">
      <div className="relative aspect-square w-full mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={monster.imageUrl} alt={monster.name} className="absolute top-0 left-0 w-full h-full object-contain" loading="lazy" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold truncate">{monster.name}</h3>
        <div className="flex justify-center my-1">
          {[...Array(3)].map((_, i) => <Star key={i} filled={i < monster.rarity} />)}
        </div>
      </div>
    </div>
  );
}

// --- メインページ ---
export default async function CollectionPage() {
  const { monsters, error } = await getMonsters();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full bg-white shadow-md sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">モンスター図鑑</h1>
          <Link href="/" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            新しく生成する
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : monsters.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {monsters.map((monster) => (
              <MonsterCard key={monster.id} monster={monster} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-16">まだモンスターがいません。最初の1体を生み出そう！</p>
        )}
      </main>
    </div>
  );
}

// Vercelのエッジランタイムで動かすための設定
export const revalidate = 60; // 60秒ごとにデータを再取得（キャッシュを更新）