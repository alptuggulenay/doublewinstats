import { fetchMatchesForDateRange, predictMatches } from '@/lib/api';
import PredictionsTable from '@/components/PredictionsTable';
import { unstable_cache } from 'next/cache';

// Statik build sırasında veriye erişirken hatayı önlemek için dinamik sayfa olarak işaretle
export const dynamic = 'force-dynamic';

// Maç verilerini önbellekleme fonksiyonu
const getCachedMatches = unstable_cache(
  async (startDate: string, endDate: string) => {
    return await fetchMatchesForDateRange(startDate, endDate);
  },
  ['matches-data'],  // Önbellek anahtarı
  { revalidate: 3600 }  // Her saat yeniden doğrula (saniye cinsinden)
);

// Tahminleri önbellekleme fonksiyonu
const getCachedPredictions = unstable_cache(
  async (matches: any[]) => {
    return predictMatches(matches);
  },
  ['predictions-data'],  // Önbellek anahtarı
  { revalidate: 3600 }  // Her saat yeniden doğrula
);

// Tarih formatını Türkçe olarak düzenleyen fonksiyon
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Tarih ve saat formatını Türkçe olarak düzenleyen fonksiyon
const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default async function Home() {
  // Şu anki tarih ve saat (son güncelleme zamanı)
  const now = new Date();
  const lastUpdateTime = formatDateTime(now);
  
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
  
  // Tarih aralığını Türkçe formatta hazırla
  const formattedStartDate = formatDate(startDateStr);
  const formattedEndDate = formatDate(endDateStr);
  
  console.time('Ana Sayfa Veri Çekme');
  // Önbellekten veri çek
  const matches = await getCachedMatches(startDateStr, endDateStr);
  console.timeEnd('Ana Sayfa Veri Çekme');
  
  console.time('Ana Sayfa Tahmin Oluşturma');
  // Önbellekten tahminleri al
  const predictions = await getCachedPredictions(matches);
  console.timeEnd('Ana Sayfa Tahmin Oluşturma');
  
  return (
    <main className="container mx-auto px-2 sm:px-4">
      <div className="text-center py-4 sm:py-6 mb-4 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
          DoubleWinStats
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Futbol İstatistikleri ve Tahmin Analizi
        </p>
      </div>
      
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-4">
          <h2 className="text-xl font-semibold">Güncel Tahminler</h2>
          <span className="text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-3">
            ({formattedStartDate} - {formattedEndDate})
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-4">
          Son güncelleme: {lastUpdateTime}
        </div>
        
        {predictions.length > 0 ? (
          <PredictionsTable predictions={predictions} />
        ) : (
          <div className="text-center py-4 bg-yellow-50 border border-yellow-100 rounded">
            <p>Sistem kriterlerine uygun tahmin bulunamadı.</p>
            <p className="text-sm text-gray-500 mt-2">Veri toplam {matches.length} maç içeriyor.</p>
          </div>
        )}
      </div>
      
      <div className="mb-6 sm:mb-8 bg-slate-100 p-3 sm:p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Sistem Nasıl Çalışır?</h2>
        <p className="mb-4">Bu sistem, bir takımın son iki maçının skoru 1-0, 2-1, 0-1 veya 1-2 ise, üçüncü maçta İlk Yarı/Maç Sonucu (İY/MS) oranının 1/2 veya 2/1 olma olasılığının yüksek olduğunu öngörür.</p>
        
        <h3 className="text-lg font-semibold mt-4 mb-2">Sistem Kuralları:</h3>
        <ul className="list-disc pl-4 sm:pl-6 mb-4">
          <li>Takımın son 2 maçı şu skorlardan biriyle bitmelidir: 1-0, 2-1, 0-1 veya 1-2</li>
          <li>Takımın ev sahibi veya deplasman olması önemli değildir, sadece maç skorları dikkate alınır</li>
          <li>Tahmin: İlk Yarı/Maç Sonucu (İY/MS) 1/2 veya 2/1
            <ul className="list-circle pl-4 sm:pl-6 mt-1">
              <li>1/2: İlk yarı ev sahibi takım önde, maç sonunda deplasman takımı kazanır</li>
              <li>2/1: İlk yarı deplasman takımı önde, maç sonunda ev sahibi takımı kazanır</li>
            </ul>
          </li>
        </ul>
      </div>
    </main>
  );
}
