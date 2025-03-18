import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Tailwind sınıflarını birleştir
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tarih formatlama fonksiyonu
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Eğer geçerli bir tarih değilse boş string döndür
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Skor kontrolü fonksiyonu (1-0, 2-1 veya 0-1, 1-2 kontrolü)
export function checkScore(homeScore: number, awayScore: number, isHomeTeam: boolean): boolean {
  if (isHomeTeam) {
    return (homeScore === 1 && awayScore === 0) || (homeScore === 2 && awayScore === 1);
  } else {
    return (homeScore === 0 && awayScore === 1) || (homeScore === 1 && awayScore === 2);
  }
}

// İlk yarı/maç sonu analizi
export function analyzeHalfTimeFullTime(
  htHomeScore: number | undefined, 
  htAwayScore: number | undefined, 
  ftHomeScore: number, 
  ftAwayScore: number
): string {
  if (htHomeScore === undefined || htAwayScore === undefined) {
    return '-';
  }
  
  const htResult = htHomeScore > htAwayScore ? '1' : htHomeScore < htAwayScore ? '2' : 'X';
  const ftResult = ftHomeScore > ftAwayScore ? '1' : ftHomeScore < ftAwayScore ? '2' : 'X';
  
  return `${htResult}/${ftResult}`;
}
