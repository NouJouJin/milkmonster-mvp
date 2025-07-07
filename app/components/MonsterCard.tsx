<Image
  src={monster.imageUrl}
  alt={monster.name}
  fill
  className="object-contain"
  sizes="(max-width: 640px) 100vw, 384px"
  priority
  unoptimized // この行を追加
/>