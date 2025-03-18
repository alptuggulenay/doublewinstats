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

  return (
    <div className="my-8 flex justify-center">
      <div className="rounded-md border max-w-4xl w-full">
        <Table>
          <TableCaption>Maç takımlarının son 2 maç istatistiklerine göre tahminler</TableCaption>
          <TableHeader className="text-center">
            <TableRow>
              <TableHead className="text-center">Tarih ve Saat</TableHead>
              <TableHead className="text-center">Maç</TableHead>
              <TableHead className="text-center">Analiz Edilen Takım</TableHead>
              <TableHead className="text-center">Son 2 Maç</TableHead>
              <TableHead className="text-center">Tahmin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predictions.map((prediction, index) => (
              <TableRow key={`${prediction.matchId}_${index}_${prediction.team}`} className="text-center">
                <TableCell className="font-medium whitespace-nowrap text-center">
                  {formatDate(prediction.matchDate)} {prediction.matchTime || "--:--"}
                </TableCell>
                <TableCell className="text-center">
                  {prediction.homeTeam} - {prediction.awayTeam}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-normal mx-auto">
                    {prediction.team}
                  </Badge>
                </TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  {prediction.lastTwoScores && prediction.lastTwoScores.length >= 2 ? (
                    <span className="text-sm font-medium">
                      {prediction.lastTwoScores[0]} → {prediction.lastTwoScores[1]}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Veri yok</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
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