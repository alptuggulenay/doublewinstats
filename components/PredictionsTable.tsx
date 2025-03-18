"use client";

import { MatchPrediction } from '@/lib/api';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// formatDate'i burada tanımlayalım
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Eğer geçerli bir tarih değilse boş string döndür
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export default function PredictionsTable({ predictions }: { predictions: MatchPrediction[] }) {
  if (predictions.length === 0) {
    return (
      <div className="my-8 text-center">
        <div className="p-8 border rounded-lg bg-slate-50 dark:bg-slate-900">
          <p className="text-muted-foreground">Şu anda sistem kriterlere uyan tahmin bulunamadı.</p>
          <p className="text-sm mt-2">Daha sonra tekrar kontrol edin veya tarih aralığını genişletin.</p>
        </div>
      </div>
    );
  }

  // Tahminleri tarih ve saate göre sırala
  const sortedPredictions = [...predictions].sort((a, b) => {
    // Önce tarihleri karşılaştır
    const dateA = new Date(a.matchDate);
    const dateB = new Date(b.matchDate);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Tarihler aynıysa, saati karşılaştır
    if (a.matchTime && b.matchTime) {
      const [hoursA, minutesA] = a.matchTime.split(':').map(Number);
      const [hoursB, minutesB] = b.matchTime.split(':').map(Number);
      
      if (hoursA !== hoursB) {
        return hoursA - hoursB;
      }
      return minutesA - minutesB;
    }
    
    // Saat bilgisi yoksa, tarihe göre sırala
    return 0;
  });

  return (
    <div className="my-8 flex justify-center">
      <div className="rounded-md border max-w-7xl w-full">
        <Table>
          <TableHeader className="bg-slate-100 dark:bg-slate-800">
            <TableRow>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">Tarih ve Saat</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">Maç</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">Analiz Edilen Takım</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">Son 2 Maç</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4">Tahmin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPredictions.map((prediction, index) => (
              <TableRow key={`${prediction.matchId}_${index}_${prediction.team}`}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDate(prediction.matchDate)} {prediction.matchTime || "--:--"}
                </TableCell>
                <TableCell>
                  {prediction.homeTeam} - {prediction.awayTeam}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {prediction.team}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {prediction.lastTwoScores && prediction.lastTwoScores.length >= 2 ? (
                    <span className="text-sm font-medium">
                      {prediction.lastTwoScores[0]} → {prediction.lastTwoScores[1]}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Veri yok</span>
                  )}
                </TableCell>
                <TableCell>
                  {prediction.prediction.split('(')[0].trim()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 