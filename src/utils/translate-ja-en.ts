/**
 * Deterministic fan-grade Japanese -> English localizer for Eventernote events,
 * Japanese concert venues, and headline-live trip titles.
 */

const VENUE_MAP: [RegExp, string][] = [
  [/ポートメッセなごや\(名古屋市国際展示場\)\s*第1展示館/g, 'Portmesse Nagoya Exhibition Hall 1'],
  [/ポートメッセなごや.*/g, 'Portmesse Nagoya'],
  [/マリンメッセ福岡B館/g, 'Marine Messe Fukuoka Hall B'],
  [/マリンメッセ福岡.*/g, 'Marine Messe Fukuoka'],
  [/有明アリーナ/g, 'Ariake Arena'],
  [/キラメッセぬまづ\(プラサヴェルデ内\)/g, 'Kira Messe Numazu (Plaza Verde)'],
  [/キラメッセぬまづ.*/g, 'Kira Messe Numazu'],
  [/ぴあアリーナMM/g, 'Pia Arena MM (Yokohama)'],
  [/東京ドーム/g, 'Tokyo Dome'],
  [/日本武道館/g, 'Nippon Budokan'],
  [/石川県産業展示館/g, 'Ishikawa Industrial Exhibition Hall'],
  [/北國新聞\s*赤羽ホール/g, 'Hokkoku Shimbun Akabane Hall (Kanazawa)'],
  [/バンテリンドーム\s*ナゴヤ\(ナゴヤドーム\)/g, 'Vantelin Dome Nagoya'],
  [/東京ガーデンシアター/g, 'Tokyo Garden Theater'],
  [/Shibuya LOVEZ\(シブヤ ラブズ\)/g, 'Shibuya LOVEZ'],
  [/東京体育館\s*メインアリーナ/g, 'Tokyo Metropolitan Gymnasium Main Arena'],
  [/東京体育館.*/g, 'Tokyo Metropolitan Gymnasium'],
  [
    /京王アリーナTOKYO\(武蔵野の森総合スポーツプラザ\)メインアリーナ/g,
    'Keio Arena TOKYO (Musashino Forest Sport Plaza)'
  ],
  [/新国立劇場\s*中劇場/g, 'New National Theatre Tokyo (Playhouse)'],
  [/Kアリーナ横浜/g, 'K-Arena Yokohama'],
  [/下北沢シャングリラ/g, 'Shimokitazawa Shangri-La'],
  [
    /iichiko総合文化センター\(大分県立総合文化センター\)\s*グランシアタ/g,
    'iichiko Grand Theater (Oita)'
  ],
  [/国営ひたち海浜公園/g, 'Hitachi Seaside Park (Ibaraki)'],
  [/LINE CUBE SHIBUYA\s*\(渋谷公会堂\)/g, 'LINE CUBE SHIBUYA'],
  [/LaLa arena TOKYO-BAY\(ららアリーナ 東京ベイ\)/g, 'LaLa arena TOKYO-BAY'],
  [/ベルーナドーム\(西武ドーム\)/g, 'Belluna Dome (Saitama)'],
  [/幕張メッセ\s*国際展示場ホール/g, 'Makuhari Messe International Exhibition Hall'],
  [/幕張メッセ\s*イベントホール/g, 'Makuhari Messe Event Hall'],
  [/幕張メッセ.*/g, 'Makuhari Messe'],
  [/SGC HALL ARIAKE\(SGCホール有明\)/g, 'SGC HALL ARIAKE'],
  [/大阪城ホール/g, 'Osaka-jo Hall'],
  [/横浜市西公会堂/g, 'Yokohama Nishi Public Hall'],
  [/ワールド記念ホール\(神戸ポートアイランドホール\)/g, 'World Memorial Hall (Kobe)'],
  [/厚木市文化会館\s*大ホール/g, 'Atsugi City Culture Hall'],
  [/Aichi Sky Expo\(愛知県国際展示場\)/g, 'Aichi Sky Expo'],
  [
    /イオンモール幕張新都心\s*グランドモール屋外\s*グランドスクエア/g,
    'AEON Mall Makuhari New City Grand Square'
  ],
  [/国立代々木競技場第一体育館/g, 'Yoyogi National 1st Gymnasium'],
  [/THEATER MILANO-Za\(シアターミラノ座\)/g, 'THEATER MILANO-Za (Shinjuku)'],
  [/アニメイト池袋本店\s*9F\s*animate hall BLACK/g, 'Animate Ikebukuro Flagship 9F Hall BLACK'],
  [/横浜アリーナ/g, 'Yokohama Arena'],
  [/パシフィコ横浜\s+国立大ホール/g, 'Pacifico Yokohama National Convention Hall'],
  [/GMOアリーナさいたま\(さいたまスーパーアリーナ\)/g, 'Saitama Super Arena'],
  [/さいたまスーパーアリーナ/g, 'Saitama Super Arena'],
  [
    /Niterra日本特殊陶業市民会館\s*フォレストホール\(名古屋市民会館\s*大ホール\)/g,
    'Niterra Civic Hall Forest Hall (Nagoya)'
  ],
  [/EXPOアリーナ「Matsuri」\(閉鎖\)/g, 'Osaka-Kansai Expo Arena "Matsuri"'],
  [/GLION ARENA KOBE\(ジーライオンアリーナ神戸\)/g, 'GLION ARENA KOBE'],
  [/セキスイハイムスーパーアリーナ\(宮城県総合体育館\)/g, 'Sekisui Heim Super Arena (Miyagi)'],
  [/タワーレコード渋谷店B1F CUTUP STUDIO/g, 'Tower Records Shibuya B1F CUTUP STUDIO'],
  [/I’M A SHOW\(アイマショウ\)/g, "I'M A SHOW (Yurakucho)"],
  [/科学技術館サイエンスホール/g, 'Science Museum Science Hall (Tokyo)'],
  [/新宿村LIVE/g, 'Shinjukumura LIVE'],
  [/両国国技館/g, 'Ryogoku Kokugikan']
];

const EVENT_PHRASE_MAP: [RegExp, string][] = [
  [/^【中止】\s*/g, '[Cancelled] '],
  [/^【出演者変更】\s*/g, ''],
  [/LoveLive!\s*Series\s*15th\s*Anniv(?:ersary|esary)/gi, 'LoveLive! Series 15th Anniversary'],
  [/ラブライブ！蓮ノ空女学院スクールアイドルクラブ/g, 'LoveLive! Hasunosora Girls\' High School Idol Club'],
  [/蓮ノ空女学院スクールアイドルクラブ/g, 'Hasunosora Girls\' High School Idol Club'],
  [/^蓮ノ空(?=\s)/g, 'Hasunosora'],
  [/(?<=\s)蓮ノ空(?=\s)/g, 'Hasunosora'],
  [/ラブライブ！スーパースター!!\s*Liella!/g, 'LoveLive! Superstar!! Liella!'],
  [/ラブライブ！スーパースター!!/g, 'LoveLive! Superstar!!'],
  [/ラブライブ！虹ヶ咲学園スクールアイドル同好会/g, 'LoveLive! Nijigasaki High School Idol Club'],
  [/虹ヶ咲学園スクールアイドル同好会/g, 'Nijigasaki High School Idol Club'],
  [/^虹ヶ咲(?=\s)/g, 'Nijigasaki'],
  [/(?<=\s)虹ヶ咲(?=\s)/g, 'Nijigasaki'],
  [/ラブライブ！サンシャイン!!\s*Aqours/g, 'LoveLive! Sunshine!! Aqours'],
  [/ラブライブ！サンシャイン!!/g, 'LoveLive! Sunshine!!'],
  [/ラブライブ！フェス/g, 'LoveLive! Fes'],
  [/前夜祭\s*FILM LIVE\s*～未来へ届けるタイムカプセル～/g, 'Eve Festival FILM LIVE ~Time Capsule to the Future~'],
  [/第[5５]回沼津地元愛まつり/g, '5th Numazu Jimoto Ai (Local Love) Festival'],
  [/いきづらい部！/g, 'Ikizurai-bu!'],
  [/～いつかみんなで叶いそう～/g, '~Someday Our Dreams Might Come True Together~'],
  [/～おいでよ！石川大観光Ⅱ～/g, '~Come Visit! Ishikawa Grand Sightseeing II~'],
  [/～103期卒業公演～/g, '~103rd Term Graduation Live~'],
  [/＜102期卒業公演＞/g, '<102nd Term Graduation Live>'],
  [/～106期新入生入部記念公演～/g, '~106th Term New Member Welcome Live~'],
  [/アニメ・スタいしかわ\s*2026\s*1日目/g, 'Anime Sta Ishikawa 2026 Day 1'],
  [/トークステージ/g, 'Talk Stage'],
  [/プロジェクトセカイ\s*COLORFUL LIVE/g, 'Project SEKAI COLORFUL LIVE'],
  [/プロセカ\s*COLORFUL LIVE/g, 'Project SEKAI COLORFUL LIVE'],
  [/プロセカユニットファンミーティング/g, 'Project SEKAI Unit Fan Meeting'],
  [/プロセカ\s*ファンミ/g, 'Project SEKAI Fan Meeting'],
  [/プロセカ\s*6th Anniversary\s*感謝祭/g, 'Project SEKAI 6th Anniversary Appreciation Festival'],
  [/25時、ナイトコードで。/g, 'Nightcord at 25:00'],
  [/ウマ娘\s*プリティーダービー/g, 'Uma Musume Pretty Derby'],
  [/夢限大みゅーたいぷ/g, 'Mugendai Mewtype'],
  [/スクールアイドルミュージカル\s*本編公演/g, 'School Idol Musical Main Performance'],
  [/結女体育祭/g, 'Yuigaoka Sports Festival'],
  [/のちゅーとりえらいぶ!!/g, 'Chu-Torie Live!!'],
  [/ちゅーとりえらいぶ!!/g, 'Chu-Torie Live!!'],
  [/ミニステージ/g, 'Mini Stage'],
  [/前橋ウィッチーズ/g, 'Maebashi Witches'],
  [/星詠み\s*ぱじゃまぱーてぃー/g, 'Hoshiyomi Pajama Party'],
  [/こえけん！アニメ声優研究会\s*2026年度開催イベント\s*鈴原希実トークショー\s*のぞみかなえる〜のんストップ！ライブラリー〜/g, 'Koeken! Nozomi Suzuhara Talk Show ~Non-Stop! Library~'],
  [/トゲナシトゲアリ/g, 'Togenashi Togeari'],
  [/拍動の未来/g, 'Pulsing Future'],
  [/THE IDOLM@STER SHINY COLORS/gi, 'THE IDOLM@STER SHINY COLORS'],
  [/シャニマス/g, 'Shiny Colors'],
  [/iと夢/g, 'Ai to Yume'],
  [/天狼群/g, 'Tenrougun'],
  [/フェンリル/g, 'Fenrir'],
  [/壮行会～春雷～/g, 'Send-Off Party ~Spring Thunder~'],
  [/岬なこ｜2nd Album「Repeated Reflect」発売記念フリーライブ＆サイン会 in イオンモール幕張新都心/g, 'Nako Misaki 2nd Album "Repeated Reflect" Release Free Live & Autograph Session'],
  [/デコミク LIVE starring 初音ミク『Hello』/g, 'DECO*27 × Hatsune Miku LIVE "Hello"'],
  [/LIVE STAGE「ぼっち・ざ・ろっく！」2026 RE:boot/g, 'LIVE STAGE "Bocchi the Rock!" 2026 RE:boot'],
  [/スリーズブーケ/g, 'Cerise Bouquet'],
  [/みらくらぱーく！/g, 'Mira-Cra Park!'],
  [/とけちゃう前に会いに来て♡♡♡/g, 'Come See Us Before We Melt ♡♡♡'],
  [/アニサマ/g, 'Animelo Summer Live'],
  [/LIVE＆FAN MEETING TOUR\s*ニジガク校外学習～歌おう♪踊ろう♪語ろう♪～/g, 'LIVE & FAN MEETING TOUR Nijigaku Field Trip ~Sing, Dance, Talk~'],
  [/～永久stage～/g, '~Eikyuu (Eternal) Stage~'],
  [/～みんなで叶える物語～/g, '~A Story Achieved Together~'],
  [/来栖りん｜【1月14日】\s*3rdシングル「わっちゅあね？」リリースイベント@タワーレコード渋谷店/g, 'Rin Kurusu 3rd Single "Watcha-ne?" Release Event @ Tower Records Shibuya'],
  [/SF空想科学朗読劇『宇宙戦争』/g, 'Sci-Fi Reading Drama "The War of the Worlds"'],
  [/～集大成～/g, '~Culmination~'],
  [/大西亜玖璃\s*7thシングル「アウフタクト」発売記念≪あぐぽん新年会!!!2025≫/g, 'Aguri Onishi 7th Single "Auftakt" Release ~Agupon New Year Party 2025~'],
  [/舞台『夢のかけらを歌に乗せたら』/g, 'Stage Play "Yume no Kakera wo Uta ni Nosetara"'],
  [/『TV アニメ放送 10周年記念LoveLive! Orchestra Concert＜再演＞』/g, 'TV Anime 10th Anniversary LoveLive! Orchestra Concert <Encore>'],
  [/ユニットライブ＆ファンミーティングツアー\s*心・技・体！極上大冒険!!\s*最終章/g, 'Unit Live & Fan Meeting Tour ~Mind, Technique, Body! Ultimate Adventure!! Final Chapter~'],
  // Legs / Prefectures / Cities
  [/＜Bloom Garden Party Stage／埼玉公演＞/g, '<Bloom Garden Party Stage / Saitama>'],
  [/＜Party Stage／神奈川公演＞/g, '<Party Stage / Kanagawa>'],
  [/＜Garden Stage／兵庫公演＞/g, '<Garden Stage / Hyogo>'],
  [/＜Bloom Stage／福岡公演＞/g, '<Bloom Stage / Fukuoka>'],
  [/＜東京公演＞/g, '<Tokyo>'],
  [/＜愛知公演＞/g, '<Aichi>'],
  [/＜福岡公演＞/g, '<Fukuoka>'],
  [/＜大阪公演＞/g, '<Osaka>'],
  [/＜神奈川公演＞/g, '<Kanagawa>'],
  [/＜兵庫公演＞/g, '<Hyogo>'],
  [/＜石川公演＞/g, '<Ishikawa>'],
  [/＜宮城公演＞/g, '<Miyagi>'],
  [/＜埼玉公演＞/g, '<Saitama>'],
  [/東京公演/g, 'Tokyo'],
  [/横浜公演/g, 'Yokohama'],
  [/愛知公演/g, 'Aichi'],
  [/千葉公演/g, 'Chiba'],
  [/in 東京/g, 'in Tokyo'],
  [/in 大分/g, 'in Oita'],
  [/\s+横浜(?=\s|$)/g, ' Yokohama'],
  [/\s+東京(?=\s|$)/g, ' Tokyo'],
  // Sessions & Days
  [/＜第1回公演＞/g, '<Show 1>'],
  [/＜第2回公演＞/g, '<Show 2>'],
  [/＜第3回公演＞/g, '<Show 3>'],
  [/＜Day\.(\d+)＞/gi, '<Day $1>'],
  [/(\d+)日目/g, 'Day $1'],
  [/(\d+)月(\d+)日/g, '$1/$2'],
  [/\(舞台\)/g, ' (Stage)'],
  [/\(ライブ\)/g, ' (Live)'],
  [/[＜《]昼公演[＞》]/g, '(Matinee)'],
  [/[＜《]夜公演[＞》]/g, '(Evening)'],
  [/[＜《]昼の部[＞》]/g, '(Day Session)'],
  [/[＜《]夜の部[＞》]/g, '(Night Session)'],
  [/昼公演/g, 'Matinee'],
  [/夜公演/g, 'Evening'],
  [/昼の部/g, 'Day Session'],
  [/夜の部/g, 'Night Session']
];

export function translateVenueToEn(jaPlace: string): string {
  let out = jaPlace;
  for (const [pattern, replacement] of VENUE_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function translateEventNameToEn(jaName: string): string {
  let out = jaName.replace(/^[『「](.+)[』」]$/g, '$1');
  for (const [pattern, replacement] of EVENT_PHRASE_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function translateTripTitleToEn(jaTitle: string): string {
  return translateEventNameToEn(jaTitle)
    .replace(/LoveLive! Hasunosora Girls' High School Idol Club/g, 'Hasunosora')
    .replace(/LoveLive! Superstar!! Liella!/g, 'Liella!')
    .replace(/LoveLive! Nijigasaki High School Idol Club/g, 'Nijigasaki')
    .replace(/LoveLive! Sunshine!! Aqours/g, 'Aqours')
    .replace(/LoveLive! Sunshine!!/g, 'Aqours')
    .replace(/\s+/g, ' ')
    .trim();
}
