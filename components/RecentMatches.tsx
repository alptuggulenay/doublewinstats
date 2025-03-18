"use client";

import { useState } from 'react';
import { Match } from '@/lib/api';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function RecentMatches({ matches }: { matches: Match[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // En son tarihli 100 maçı al ve bunların içinde ara
  const recentMatches = matches
    .filter(match => match.state === "post" || match.state === "pre")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 100);
  
  // Takım adına göre filtreleme
  const filteredMatches = searchTerm 
    ? recentMatches.filter(match => 
        match.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        match.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : recentMatches.slice(0, 25); // Arama yoksa sadece ilk 25 maçı göster
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Son Maçlar</h2>
        <div className="w-72">
          <Input
            type="search"
            placeholder="Takım adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {searchTerm ? 'Filtrelenmiş maçlar' : 'Son 25 maç sonucu'}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Ev Sahibi</TableHead>
              <TableHead>Skor</TableHead>
              <TableHead>Deplasman</TableHead>
              <TableHead className="text-right">Detaylar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMatches.map((match, index) => (
              <TableRow key={`${match.id}_${index}_${match.date}`}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDate(match.date)}
                </TableCell>
                <TableCell>{match.homeTeam.name}</TableCell>
                <TableCell className="text-center font-medium">
                  {match.state === "pre" ? "vs" : `${match.score.home} - ${match.score.away}`}
                  {match.score.ht && (
                    <span className="block text-xs text-muted-foreground">
                      İlk Yarı: {match.score.ht.home}-{match.score.ht.away}
                    </span>
                  )}
                </TableCell>
                <TableCell>{match.awayTeam.name}</TableCell>
                <TableCell className="text-right">
                  {match.state === "pre" ? (
                    <Badge variant="outline">Gelecek</Badge>
                  ) : match.score.ht && (
                    <Badge 
                      variant={
                        (match.score.ht.home > match.score.ht.away && parseInt(match.score.away) > parseInt(match.score.home)) 
                          ? "default"  // 1/2
                          : (match.score.ht.home < match.score.ht.away && parseInt(match.score.home) > parseInt(match.score.away))
                            ? "secondary"  // 2/1
                            : "outline"  // diğer sonuçlar
                      }
                    >
                      {match.score.ht.home > match.score.ht.away ? "1" : match.score.ht.home < match.score.ht.away ? "2" : "X"}/
                      {parseInt(match.score.home) > parseInt(match.score.away) ? "1" : parseInt(match.score.home) < parseInt(match.score.away) ? "2" : "X"}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 