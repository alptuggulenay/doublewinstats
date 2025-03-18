import { fetchMatchesForDateRange, predictMatches } from '@/lib/api';
import PredictionsTable from '@/components/PredictionsTable';

export default async function Home() {
  // Geçmiş 14 gün ve gelecek 7 gün için maçları çek
  const today = new Date();
  
  // Bitiş tarihi: 7 gün sonrası
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);
  
  // Başlangıç tarihi: 14 gün öncesi
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 14);
  
  // ISO string olarak tarihler
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.time('Ana Sayfa Veri Çekme');
  const matches = await fetchMatchesForDateRange(startDateStr, endDateStr);
  console.timeEnd('Ana Sayfa Veri Çekme');
  
  console.time('Ana Sayfa Tahmin Oluşturma');
  const predictions = predictMatches(matches);
  console.timeEnd('Ana Sayfa Tahmin Oluşturma');
  
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Double Win İY/MS Tahmin Sistemi</h1>
      
      <div className="mb-8 bg-slate-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Sistem Nasıl Çalışır?</h2>
        <p className="mb-4">Bu sistem, bir takımın son iki maçının skoru 1-0, 2-1, 0-1 veya 1-2 ise, üçüncü maçta İlk Yarı/Maç Sonucu (İY/MS) oranının 1/2 veya 2/1 olma olasılığının yüksek olduğunu öngörür.</p>
        
        <h3 className="text-lg font-semibold mt-4 mb-2">Sistem Kuralları:</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Takımın son 2 maçı şu skorlardan biriyle bitmelidir: 1-0, 2-1, 0-1 veya 1-2</li>
          <li>Takımın ev sahibi veya deplasman olması önemli değildir, sadece maç skorları dikkate alınır</li>
          <li>Tahmin: İlk Yarı/Maç Sonucu (İY/MS) 1/2 veya 2/1
            <ul className="list-circle pl-6 mt-1">
              <li>1/2: İlk yarı ev sahibi takım önde, maç sonunda deplasman takımı kazanır</li>
              <li>2/1: İlk yarı deplasman takımı önde, maç sonunda ev sahibi takımı kazanır</li>
            </ul>
          </li>
        </ul>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tahminler</h2>
        {predictions.length > 0 ? (
          <PredictionsTable predictions={predictions} />
        ) : (
          <div className="text-center py-4 bg-yellow-50 border border-yellow-100 rounded">
            <p>Sistem kriterlerine uygun tahmin bulunamadı.</p>
            <p className="text-sm text-gray-500 mt-2">Veri toplam {matches.length} maç içeriyor.</p>
          </div>
        )}
      </div>
    </main>
  );
}
