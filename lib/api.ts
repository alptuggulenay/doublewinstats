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
        cache: 'no-store',
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
        // İlk 2 maçın yapısını görmek için debug log ekleyelim
        const sampleMatches = Object.entries(data.data.matches).slice(0, 2);
        console.log(`Örnek maç verileri (ilk 2 maç):`, 
          JSON.stringify(sampleMatches, null, 2).substring(0, 1000) + '...');
        
        // API yanıtının matches objesi bir dizi değil, key-value map olduğu için Object.values kullanıyoruz
        const matchesArray = Object.values(data.data.matches) as Array<any>;
        
        totalMatchesCount = matchesArray.length;
        let iddaaMatchesCount = 0;
        let futureMatchesCount = 0;
        
        // Olası iddaa kodlarının bulunduğu alanları kontrol et
        const possibleIddaaFields = new Set<string>();
        
        // İlk 10 maçta potansiyel iddaa kodu içeren alanları ara
        matchesArray.slice(0, 10).forEach(match => {
          Object.keys(match).forEach(key => {
            // İddaa ile ilgili olabilecek tüm alanları bul
            if (key.toLowerCase().includes('iddaa') || 
                key.toLowerCase().includes('code') || 
                key.toLowerCase().includes('bet') || 
                key.toLowerCase().includes('id')) {
              possibleIddaaFields.add(key);
            }
          });
        });
        
        console.log('Olası iddaa kodu alanları:', Array.from(possibleIddaaFields));
        
        // İlk 5 maç için detaylı inceleme yap
        matchesArray.slice(0, 5).forEach((match, index) => {
          console.log(`Maç ${index + 1} incelemesi:`);
          console.log(`- Ev Sahibi: ${match.homeTeam?.name}`);
          console.log(`- Deplasman: ${match.awayTeam?.name}`);
          console.log(`- ID: ${match.id}`);
          console.log(`- Durum: ${match.state}`);
          console.log(`- Tarih: ${match.mstUtc ? new Date(+match.mstUtc).toLocaleString() : 'Bilinmiyor'}`);
          Array.from(possibleIddaaFields).forEach(field => {
            if (match[field]) {
              console.log(`- ${field}: ${JSON.stringify(match[field])}`);
            }
          });
          // Varsa market ve odds bilgilerini kontrol et
          if (match.markets) {
            console.log(`- Markets: ${JSON.stringify(match.markets).substring(0, 200)}...`);
          }
        });
        
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
              status: match.status || "scheduled",
              state: match.state || "pre",
              competition: match.competitionId || undefined,
              iddaaCode: match.iddaaCode || match.betCode || match.rbId
            });
          }
        });
        
        console.log(`${date}: Toplam ${totalMatchesCount} maçtan, ${iddaaMatchesCount} maçta iddaa kodu var, ${matches.length} maç uygun (${futureMatchesCount} gelecek maç).`);
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
  
  console.log(`Tarih aralığı: ${startDate} - ${endDate}, ${dateArray.length} gün için veri çekiliyor...`);
  
  // Her tarih için maçları çek ve birleştir
  const allMatches: Match[] = [];
  
  // Paralel fetch işlemleri için Promise.all kullanarak tüm tarihlerin verilerini çekelim
  // Bu, API hızını artıracak ve daha fazla veri alabileceğiz
  try {
    const matchPromises = dateArray.map(async (date, index) => {
      // API isteklerini fazla sıklaştırmamak için aralıklarla yapalım
      await new Promise(resolve => setTimeout(resolve, index * 100));
      try {
        const matches = await fetchFootballData(date);
        console.log(`${date}: ${matches.length} maç bulundu`);
        return matches;
      } catch (error) {
        console.error(`${date} tarihi için veri çekme hatası:`, error);
        return [];
      }
    });
    
    const matchesArrays = await Promise.all(matchPromises);
    matchesArrays.forEach(matches => {
      allMatches.push(...matches);
    });
  } catch (error) {
    console.error('Toplu veri çekme hatası:', error);
  }
  
  console.log(`Toplam ${allMatches.length} maç bulundu.`);
  
  // Takımları ve ligleri kontrol et
  const uniqueTeams = new Set<string>();
  const uniqueCompetitions = new Set<string>();
  
  allMatches.forEach(match => {
    if (match.homeTeam?.name) uniqueTeams.add(match.homeTeam.name);
    if (match.awayTeam?.name) uniqueTeams.add(match.awayTeam.name);
    if (match.competition) uniqueCompetitions.add(match.competition);
  });
  
  console.log(`Benzersiz takım sayısı: ${uniqueTeams.size}`);
  console.log(`Benzersiz lig/turnuva sayısı: ${uniqueCompetitions.size}`);
  
  return allMatches;
}

// Takımın maçlarını getiren fonksiyon
export function getTeamMatches(matches: Match[], teamName: string): Match[] {
  if (!teamName) return [];
  
  // Takım isimlerini normalize et ve case-insensitive eşleştir
  const normalizedTeamName = teamName.toLowerCase().trim();
  
  // Debug için rastgele 5 takımın eşleşmelerini gösterelim
  const shouldLog = Math.random() < 0.01; // %1 ihtimalle log yap
  
  if (shouldLog) {
    console.log(`[Takım Eşleştirme] "${teamName}" için maçlar aranıyor`);
  }
  
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
    
    if (shouldLog && (isExactMatch || isPartialMatch)) {
      console.log(`  - Eşleşen maç: ${match.homeTeam.name} vs ${match.awayTeam.name}, Skor: ${match.score.home}-${match.score.away}`);
    }
    
    // Önce tam eşleşme varsa onu kullan, yoksa partial eşleşme
    return isExactMatch || isPartialMatch;
  });
  
  // Tarihe göre sırala - en yeni maçlar başta
  const sortedMatches = teamMatches.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  if (shouldLog) {
    console.log(`  Toplam ${sortedMatches.length} maç bulundu.`);
    console.log(`  İlk 2 maç:`);
    sortedMatches.slice(0, 2).forEach((match, i) => {
      console.log(`    Maç ${i+1}: ${match.homeTeam.name} ${match.score.home}-${match.score.away} ${match.awayTeam.name}`);
    });
  }
  
  return sortedMatches;
}

// Takımın son maçlarını analiz eden fonksiyon
export function analyzeTeamLastMatches(teamMatches: Match[], teamName: string): boolean {
  // Son iki maçı kontrol ediyoruz
  if (!teamMatches || teamMatches.length < 2 || !teamName) {
    return false;
  }
  
  const lastTwoMatches = teamMatches.slice(0, 2);
  
  // Skor kontrolü için sayaç
  let validScoreCount = 0;
  
  // Her maç için, skorların 1-0, 2-1, 0-1 veya 1-2 olmasını kontrol et
  for (const match of lastTwoMatches) {
    // Eksik veri kontrolü
    if (!match.score || !match.homeTeam || !match.awayTeam) {
      console.log(`[Hata] ${teamName} için eksik maç verisi:`, match.id);
      continue;
    }
    
    // Ham skorları temizle ve integer'a çevir
    let homeScoreStr = match.score.home?.toString() || "0";
    let awayScoreStr = match.score.away?.toString() || "0";
    
    // Eğer ondalık sayı formatında ise sadece tam sayı kısmını al
    homeScoreStr = homeScoreStr.split('.')[0];
    awayScoreStr = awayScoreStr.split('.')[0];
    
    const homeScore = parseInt(homeScoreStr);
    const awayScore = parseInt(awayScoreStr);
    
    // Debug: Skorları logla
    console.log(`[Analiz] ${teamName} - Maç skoru: ${homeScore}-${awayScore}, ID: ${match.id}`);
    
    // Skorların belirtilen değerlerde olup olmadığını kontrol et
    const isValidScore = 
      (homeScore === 1 && awayScore === 0) || 
      (homeScore === 2 && awayScore === 1) ||
      (homeScore === 0 && awayScore === 1) ||
      (homeScore === 1 && awayScore === 2);
    
    if (isValidScore) {
      validScoreCount++;
      console.log(`[Başarı] ${teamName} için geçerli skor bulundu: ${homeScore}-${awayScore}`);
    }
  }
  
  // Her iki maç birden kriterlere uygun olsun
  if (validScoreCount === 2) {
    console.log(`[TAHMİN] ${teamName} takımı için BAŞARILI tahmin oluşturulacak!`);
    return true;
  }
  
  return false;
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
  const teams = new Set<string>();
  
  // Tüm takımları bul
  allMatches.forEach(match => {
    if (match.homeTeam?.name) teams.add(match.homeTeam.name);
    if (match.awayTeam?.name) teams.add(match.awayTeam.name);
  });
  
  console.log(`${teams.size} takım analiz ediliyor...`);
  let processed = 0;
  let teamsWithEnoughMatches = 0;
  let teamsWithValidScores = 0;
  let teamsWithPredictions = 0;
  
  // Tarihe göre tüm maçları sırala (kronolojik olarak)
  const sortedMatches = [...allMatches].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Her takım için analiz yap
  teams.forEach(team => {
    try {
      // Takımın tüm maçlarını bul ve etiketle
      const taggedMatches = tagMatchesForTeam(allMatches, team);
      const pastMatches = taggedMatches.past;
      const futureMatches = taggedMatches.future;
      
      // En az iki maçı var mı?
      if (pastMatches.length < 2) {
        return;
      }
      
      teamsWithEnoughMatches++;
      
      // İlk iki maçı sistem için analiz et
      const lastTwoMatches = pastMatches.slice(0, 2);
      
      // Son iki maçı analiz et
      let validScoreCount = 0;
      let validScores = [];
      
      // Her maç için skorları kontrol et - 1-0, 2-1, 0-1, 1-2
      for (const match of lastTwoMatches) {
        if (!match.score) continue;
        
        // Skorları temizle ve sayılara dönüştür
        let homeScoreStr = match.score.home?.toString().split('.')[0] || "0";
        let awayScoreStr = match.score.away?.toString().split('.')[0] || "0";
        
        const homeScore = parseInt(homeScoreStr);
        const awayScore = parseInt(awayScoreStr);
        
        console.log(`[Analiz] ${team} - Maç: ${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name}`);
        
        const isValidScore = 
          (homeScore === 1 && awayScore === 0) || 
          (homeScore === 2 && awayScore === 1) ||
          (homeScore === 0 && awayScore === 1) ||
          (homeScore === 1 && awayScore === 2);
        
        if (isValidScore) {
          validScoreCount++;
          validScores.push(`${homeScore}-${awayScore}`);
          console.log(`[Başarı] ${team} için geçerli skor: ${homeScore}-${awayScore}`);
        }
      }
      
      // Her iki maç da belirtilen skorlarla bittiyse tahmin yap
      if (validScoreCount === 2) {
        teamsWithValidScores++;
        
        console.log(`[TAHMİN] ${team} takımı iki maçta da uygun skorlara sahip: ${validScores.join(', ')}!`);
        
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
          const lastMatchDate = new Date(lastTwoMatches[0].date);
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
          
          console.log(`[TAHMİN BAŞARILI] ${team} için 3. maç: ${thirdMatch.homeTeam.name} vs ${thirdMatch.awayTeam.name}`);
          console.log(`  Son 2 maç skorları: ${validScores.join(', ')}`);
          console.log(`  3. maç tarihi: ${new Date(thirdMatch.date).toLocaleDateString()}`);
          
          predictions.push({
            team: team,
            homeTeam: thirdMatch.homeTeam.name,
            awayTeam: thirdMatch.awayTeam.name,
            matchDate: thirdMatch.date,
            matchId: thirdMatch.id,
            prediction: "İY/MS: 1/2 veya 2/1",
            confidence: 0.85,
            lastTwoScores: validScores
          });
        } else {
          console.log(`[Uyarı] ${team} için 3. maç bulunamadı, ama kriterlere uygun.`);
        }
      }
      
      // Her 500 takımda bir ilerleme göster
      processed++;
      if (processed % 500 === 0 || processed === teams.size) {
        console.log(`${processed}/${teams.size} takım işlendi...`);
      }
    } catch (error) {
      console.error(`${team} takımı için analiz hatası:`, error);
    }
  });
  
  console.log(`
    Toplam takım: ${teams.size}
    Yeterli maçı olan takım: ${teamsWithEnoughMatches}
    Geçerli skorları olan takım: ${teamsWithValidScores}
    Tahmin oluşturulan takım: ${teamsWithPredictions}
  `);
  
  console.log(`${predictions.length} tahmin bulundu.`);
  return predictions;
} 