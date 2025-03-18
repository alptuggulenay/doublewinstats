"use client";

import { Match, MatchPrediction } from '@/lib/api';
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
    <div className="my-8">
      <div className="rounded-md border">
        <Table>
          <TableCaption>Maç takımlarının son 2 maç istatistiklerine göre tahminler</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Maç</TableHead>
              <TableHead>Analiz Edilen Takım</TableHead>
              <TableHead>Tahmin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predictions.map((prediction, index) => (
              <TableRow key={`${prediction.matchId}_${index}_${prediction.team}`}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDate(prediction.matchDate)}
                </TableCell>
                <TableCell>
                  {prediction.homeTeam} - {prediction.awayTeam}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {prediction.team}
                  </Badge>
                </TableCell>
                <TableCell>{prediction.prediction}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 