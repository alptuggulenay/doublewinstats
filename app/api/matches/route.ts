import { NextRequest, NextResponse } from 'next/server';
import { fetchMatchesForDateRange, predictMatches } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Her saat yenile

export async function GET(request: NextRequest) {
  try {
    // URL'den parametreleri al veya varsayılan değerleri kullan
    const searchParams = request.nextUrl.searchParams;
    
    // Tarih aralığını belirle 
    // Geçmiş 14 gün + gelecek 7 gün (tahminler için gelecek maçlara ihtiyacımız var)
    const today = new Date();
    const defaultEndDate = new Date(today);
    defaultEndDate.setDate(today.getDate() + 7); // 7 gün sonrası
    
    const defaultStartDate = new Date(today);
    defaultStartDate.setDate(today.getDate() - 14); // 14 gün öncesi
    
    const startDate = searchParams.get('startDate') || defaultStartDate.toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || defaultEndDate.toISOString().split('T')[0];
    
    console.log(`API isteği alındı: Tarih aralığı ${startDate} - ${endDate}`);
    
    // Maçları çek
    console.time('Veri Çekme');
    const matches = await fetchMatchesForDateRange(startDate, endDate);
    console.timeEnd('Veri Çekme');
    
    // Tahmin oluştur
    console.time('Tahmin Oluşturma');
    const predictions = predictMatches(matches);
    console.timeEnd('Tahmin Oluşturma');
    
    return NextResponse.json({
      matches: matches.length,
      predictions: predictions,
      status: 'success',
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('API hatası:', error);
    return NextResponse.json({
      error: 'Veriler işlenirken bir hata oluştu',
      status: 'error',
    }, { status: 500 });
  }
} 