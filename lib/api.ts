export interface Match {
  id: string;
  matchName?: string;
  homeTeam: {
    id: string;
    name: string;
    slug: string;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
  };
  score: {
    home: string;
    away: string;
    ht: {
      home: number;
      away: number;
    } | null;
  };
  date: string;
  time?: string; // Maç saati
  status: string;
  state: string;
  competition?: string;
  iddaaCode?: string;
}

export interface Team {
  id: string;
  name: string;
  matches: Match[];
}

export interface MatchPrediction {
  team: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  matchTime?: string; // Maç saati
  matchId: string;
  prediction: string;
  confidence: number;
  lastTwoScores?: string[];
}

// Mackolik API'den futbol verilerini çekmek için fonksiyon
export async function fetchFootballData(date: string): Promise<Match[]> {
  try {
    const response = await fetch(
      `https://www.mackolik.com/perform/p0/ajax/components/competition/livescores/json?sports[]=Soccer&matchDate=${date}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
      }
    );
    
    if (!response.ok) {
      console.error(`API hatası: ${response.status} ${response.statusText}`);
      throw new Error(`Veriler alınamadı: ${response.status}`);
    }
    
    const data = await response.json();
    
    // API'den gelen verileri Match yapısına dönüştürme
    const matches: Match[] = [];
    let totalMatchesCount = 0;
    
    if (data && data.data && data.data.matches) {
      try {
        // Loglamayı azalt, sadece geliştirme modunda aktif et
        if (process.env.NODE_ENV === 'development') {
          // İlk 2 maçın yapısını görmek için debug log ekleyelim (örnekleme)
          if (Math.random() < 0.1) { // Sadece %10 ihtimalle
            const sampleMatches = Object.entries(data.data.matches).slice(0, 1);
            console.log(`Örnek maç verisi:`, 
              JSON.stringify(sampleMatches, null, 2).substring(0, 500) + '...');
          }
        }
        
        // API yanıtının matches objesi bir dizi değil, key-value map olduğu için Object.values kullanıyoruz
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchesArray = Object.values(data.data.matches) as Array<any>;
        
        totalMatchesCount = matchesArray.length;
        let iddaaMatchesCount = 0;
        let futureMatchesCount = 0;
        
        // Aşırı log temizlendi

        matchesArray.forEach((match) => {
          // null/undefined kontrolü yap
          if (!match || !match.homeTeam || !match.awayTeam) {
            return;
          }

          // Sadece iddaa kodu olan maçları al - geniş bir kontrol yap
          const hasIddaaCode = match.iddaaCode || match.betCode || match.rbId || 
                              (match.markets && match.markets.length > 0);
          
          // İddaa kodu olmayan maçları atla
          if (!hasIddaaCode) {
            return;
          }
          
          iddaaMatchesCount++;
          
          // Maç tarihini doğru şekilde hesapla
          const matchDate = match.mstUtc 
            ? new Date(typeof match.mstUtc === 'string' ? parseInt(match.mstUtc) : match.mstUtc) 
            : new Date();
          
          // Maç saatini formatla (saat:dakika)
          const matchTime = matchDate.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          // İki kategori oluştur: Tamamlanmış maçlar ve henüz oynanmamış/gelecek maçlar          
          // 1. Tamamlanmış maçlar - state=post olan maçlar
          if (match.state === "post" && match.status === "state" && match.score) {
            // Skorları güvenli bir şekilde string'e dönüştür
            let homeScore = match.score.home?.toString() || "0";
            let awayScore = match.score.away?.toString() || "0";
            
            // Noktalı format varsa temizle
            homeScore = homeScore.split('.')[0];
            awayScore = awayScore.split('.')[0];
            
            matches.push({
              id: match.id || `unknown_${Date.now()}`,
              matchName: match.matchName || `${match.homeTeam?.name || 'Ev'} vs ${match.awayTeam?.name || 'Deplasman'}`,
              homeTeam: {
                id: match.homeTeam.id || "unknown",
                name: match.homeTeam.name || "Bilinmeyen Takım",
                slug: match.homeTeam.slug || "unknown"
              },
              awayTeam: {
                id: match.awayTeam.id || "unknown",
                name: match.awayTeam.name || "Bilinmeyen Takım",
                slug: match.awayTeam.slug || "unknown"
              },
              score: {
                home: homeScore,
                away: awayScore,
                ht: match.score.ht ? {
                  home: match.score.ht.home || 0,
                  away: match.score.ht.away || 0
                } : null
              },
              date: matchDate.toISOString(),
              time: matchTime,
              status: match.status || "unknown",
              state: match.state || "unknown",
              competition: match.competitionId || undefined,
              iddaaCode: match.iddaaCode || match.betCode || match.rbId
            });
          }
          // 2. Gelecek/planlanmış maçlar - state=pre olan maçlar
          else if (match.state === "pre" && matchDate > new Date()) {
            futureMatchesCount++;
            
            matches.push({
              id: match.id || `unknown_${Date.now()}`,
              matchName: match.matchName || `${match.homeTeam?.name || 'Ev'} vs ${match.awayTeam?.name || 'Deplasman'}`,
              homeTeam: {
                id: match.homeTeam.id || "unknown",
                name: match.homeTeam.name || "Bilinmeyen Takım",
                slug: match.homeTeam.slug || "unknown"
              },
              awayTeam: {
                id: match.awayTeam.id || "unknown",
                name: match.awayTeam.name || "Bilinmeyen Takım",
                slug: match.awayTeam.slug || "unknown"
              },
              score: {
                home: "0",  // Gelecek maçlar için varsayılan skor
                away: "0",
                ht: null
              },
              date: matchDate.toISOString(),
              time: matchTime,
              status: match.status || "scheduled",
              state: match.state || "pre",
              competition: match.competitionId || undefined,
              iddaaCode: match.iddaaCode || match.betCode || match.rbId
            });
          }
        });
        
        // Özet log - ayrıntı seviyesini azalttık
        if (iddaaMatchesCount > 0 || matches.length > 0) {
          console.log(`${date}: ${matches.length} maç işlendi (${futureMatchesCount} gelecek maç).`);
        }
      } catch (parseError) {
        console.error('Veri ayrıştırma hatası:', parseError);
      }
    }
    
    return matches;
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return [];
  }
}

// Belirli bir tarih aralığındaki maçları çekmek için fonksiyon
export async function fetchMatchesForDateRange(startDate: string, endDate: string): Promise<Match[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray: string[] = [];
  
  // Tarih aralığındaki her gün için dizi oluştur
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    // Doğru tarih formatını oluştur: YYYY-MM-DD
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    dateArray.push(`${year}-${month}-${day}`);
  }
  
  console.log(`Tarih aralığı: ${startDate} - ${endDate} (${dateArray.length} gün)`);
  
  // Paralel fetch optimizasyonu: Tarih aralığını gruplara böl
  // Her grup için tek bir Promise.all çağrısı yap
  const allMatches: Match[] = [];
  const BATCH_SIZE = 5; // Her grupta 5 tarih
  
  // Tarihleri BATCH_SIZE büyüklüğünde gruplara ayır
  const batches: string[][] = [];
  for (let i = 0; i < dateArray.length; i += BATCH_SIZE) {
    batches.push(dateArray.slice(i, i + BATCH_SIZE));
  }
  
  try {
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`${i+1}/${batches.length}. grup tarihler işleniyor...`);
      
      // Her gruptaki tarihler için paralel veri çekme
      const batchPromises = batch.map(async (date) => {
        try {
          return await fetchFootballData(date);
        } catch (error) {
          console.error(`${date} tarihi için veri çekme hatası:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(matches => {
        allMatches.push(...matches);
      });
    }
  } catch (error) {
    console.error('Toplu veri çekme hatası:', error);
  }
  
  console.log(`Toplam ${allMatches.length} maç bulundu.`);
  
  // Takım ve lig sayısını hesapla (minimum loglama)
  const teamCount = new Set(allMatches.flatMap(match => 
    [match.homeTeam?.name, match.awayTeam?.name].filter(Boolean)
  )).size;
  
  const competitionCount = new Set(
    allMatches.map(match => match.competition).filter(Boolean)
  ).size;
  
  console.log(`${teamCount} takım, ${competitionCount} turnuva/lig`);
  
  return allMatches;
}

// Takımın maçlarını getiren fonksiyon
export function getTeamMatches(matches: Match[], teamName: string): Match[] {
  if (!teamName) return [];
  
  // Takım isimlerini normalize et ve case-insensitive eşleştir
  const normalizedTeamName = teamName.toLowerCase().trim();
  
  // Loglama kaldırıldı (performans için)
  
  const teamMatches = matches.filter(match => {
    // Takım adı tam olarak eşleşmiyorsa bile, alt string olarak içinde geçiyorsa kabul et
    const homeTeamName = match.homeTeam?.name?.toLowerCase().trim() || '';
    const awayTeamName = match.awayTeam?.name?.toLowerCase().trim() || '';
    
    // Tam eşleşme öncelikli olsun
    const isExactMatch = 
      homeTeamName === normalizedTeamName || 
      awayTeamName === normalizedTeamName;
    
    // Ardından partial eşleşme
    const isPartialMatch = 
      homeTeamName.includes(normalizedTeamName) || 
      awayTeamName.includes(normalizedTeamName);
    
    // Önce tam eşleşme varsa onu kullan, yoksa partial eşleşme
    return isExactMatch || isPartialMatch;
  });
  
  // Tarihe göre sırala - en yeni maçlar başta
  return teamMatches.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Takımın son maçlarını analiz eden fonksiyon
export function analyzeTeamLastMatches(teamMatches: Match[], teamName: string): boolean {
  // Son iki maçı kontrol ediyoruz
  if (!teamMatches || teamMatches.length < 2 || !teamName) {
    return false;
  }
  
  const lastTwoMatches = teamMatches.slice(0, 2);
  
  // Sıra önemli:
  // İkinci maç (en son maç) - index 0
  const match2 = lastTwoMatches[0];
  // Birinci maç (daha önceki maç) - index 1
  const match1 = lastTwoMatches[1];
  
  // Eksik veri kontrolü
  if (!match1.score || !match1.homeTeam || !match1.awayTeam || 
      !match2.score || !match2.homeTeam || !match2.awayTeam) {
    return false;
  }
  
  // Ham skorları temizle ve integer'a çevir
  const homeScore1 = match1.score.home?.toString().split('.')[0] || "0";
  const awayScore1 = match1.score.away?.toString().split('.')[0] || "0";
  const homeScore2 = match2.score.home?.toString().split('.')[0] || "0";
  const awayScore2 = match2.score.away?.toString().split('.')[0] || "0";
  
  const home1 = parseInt(homeScore1);
  const away1 = parseInt(awayScore1);
  const home2 = parseInt(homeScore2);
  const away2 = parseInt(awayScore2);
  
  // Debug log kaldırıldı (performans için)
  
  // 1. Maç için kontrol (0-1 veya 1-0)
  const isFirstMatchValid = 
    (home1 === 0 && away1 === 1) || 
    (home1 === 1 && away1 === 0);
  
  // 2. Maç için kontrol (1-2 veya 2-1)
  const isSecondMatchValid = 
    (home2 === 1 && away2 === 2) || 
    (home2 === 2 && away2 === 1);
  
  // Her iki maç da kriterlere uygun olmalı
  return isFirstMatchValid && isSecondMatchValid;
}

// Maçları etiketleyerek kolayca bulanabilir hale getir
export function tagMatchesForTeam(allMatches: Match[], teamName: string): {past: Match[], future: Match[]} {
  const teamMatches = getTeamMatches(allMatches, teamName);
  
  // Bugünün tarihini alarak, geçmiş ve gelecek maçları ayır
  const today = new Date();
  
  // Tarihe göre sırala - en yeni geçmiş maçlar başta, en yakın gelecek maçlar başta
  const pastMatches = teamMatches
    .filter(match => new Date(match.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const futureMatches = teamMatches
    .filter(match => new Date(match.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return {
    past: pastMatches,
    future: futureMatches
  };
}

// Gelecek maçları tahmin eden fonksiyon
export function predictMatches(allMatches: Match[]): MatchPrediction[] {
  if (!allMatches || allMatches.length === 0) {
    return [];
  }
  
  const predictions: MatchPrediction[] = [];
  
  // Performans optimizasyonu: Tüm takımları önce topla, sonra işle
  const uniqueTeams = new Set<string>();
  allMatches.forEach(match => {
    if (match.homeTeam?.name) uniqueTeams.add(match.homeTeam.name);
    if (match.awayTeam?.name) uniqueTeams.add(match.awayTeam.name);
  });
  
  const teams = Array.from(uniqueTeams);
  console.log(`${teams.length} takım analiz ediliyor...`);
  
  // Tahmin istatistikleri
  let teamsWithEnoughMatches = 0;
  let teamsWithValidScores = 0;
  let teamsWithPredictions = 0;
  
  // Her takım için analiz yap
  teams.forEach((team, index) => {
    try {
      // İlerleme göster (her 500 takımda bir)
      if ((index + 1) % 500 === 0 || index + 1 === teams.length) {
        console.log(`${index + 1}/${teams.length} takım işlendi...`);
      }
      
      // Takımın tüm maçlarını bul ve etiketle
      const taggedMatches = tagMatchesForTeam(allMatches, team);
      const pastMatches = taggedMatches.past;
      const futureMatches = taggedMatches.future;
      
      // En az iki maçı var mı?
      if (pastMatches.length < 2) {
        return;
      }
      
      teamsWithEnoughMatches++;
      
      // Takım için uygun skor sıralaması var mı?
      // İlk maç (1-0 veya 0-1), ikinci maç (2-1 veya 1-2) olmalı
      if (analyzeTeamLastMatches(pastMatches, team)) {
        teamsWithValidScores++;
        
        // İlk 2 maçın skorlarını alalım
        const match1 = pastMatches[1]; // Daha eski maç
        const match2 = pastMatches[0]; // Daha yeni maç
        
        // Skorları hazırla
        const score1 = `${match1.score.home}-${match1.score.away}`;
        const score2 = `${match2.score.home}-${match2.score.away}`;
        
        // Şimdi 3. maçı bul (üçüncü maç, gelecekteki ilk maç veya sonraki en yakın maç olabilir)
        let thirdMatch: Match | null = null;
        
        // Önce: Gelecek maçları kontrol et
        if (futureMatches.length > 0) {
          thirdMatch = futureMatches[0];
        }
        
        // Eğer gelecek maç yoksa, kronolojik olarak bir sonraki maçı bul
        if (!thirdMatch) {
          // Takımın tüm maçlarını kronolojik sıraya diz
          const allTeamMatches = [...pastMatches, ...futureMatches]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Son iki maçtan sonraki ilk maçı bul
          const lastMatchDate = new Date(match2.date);
          const nextMatch = allTeamMatches.find(match => 
            new Date(match.date).getTime() > lastMatchDate.getTime()
          );
          
          if (nextMatch) {
            thirdMatch = nextMatch;
          }
        }
        
        // Eğer 3. maç bulunursa tahmin oluştur
        if (thirdMatch) {
          teamsWithPredictions++;
          
          const tahminMetni = `İY/MS: 1/2 veya 2/1 (${score1} → ${score2})`;
          
          predictions.push({
            team: team,
            homeTeam: thirdMatch.homeTeam.name,
            awayTeam: thirdMatch.awayTeam.name,
            matchDate: thirdMatch.date,
            matchTime: thirdMatch.time,
            matchId: thirdMatch.id,
            prediction: tahminMetni,
            confidence: 0.85,
            lastTwoScores: [score1, score2]
          });
        }
      }
    } catch (error) {
      // Hata loglaması azaltıldı
      console.error(`Takım analiz hatası: ${team}`);
    }
  });
  
  console.log(`
    Toplam: ${teams.length} takım 
    Tahmin: ${predictions.length} 
    (Yeterli maç: ${teamsWithEnoughMatches}, Uygun skor: ${teamsWithValidScores})
  `);
  
  return predictions;
} 