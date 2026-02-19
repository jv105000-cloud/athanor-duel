export const factions = [
    {
        id: 'temple-of-light',
        name: '光明聖殿',
        description: '追求正義與光明的神聖殿堂，以強悍的攻擊力和速度著稱。',
        heroes: [
            {
                id: 'bright',
                name: '大天使 布萊特',
                hp: 7,
                speed: 10,
                voice: '你，快不過光',
                diceActions: {
                    1: { type: 'attack', value: 3, name: '光明之刃' },
                    2: { type: 'attack', value: 4, name: '光明之刃' },
                    3: { type: 'attack', value: 7, name: '聖裁' },
                    4: { type: 'ultimate', name: '光速', effect: 'BUFF_SPEED_INFINITY_3_TURNS', description: '3回合內速度無限(閃避必成)且必中，自動閃避且仍可出招' },
                    5: { type: 'evade', name: '神速' },
                    6: { type: 'block', name: '聖盾' }
                },
                image: '/assets/bright.png'
            },
            {
                id: 'mortos',
                name: '聖騎士 莫托斯',
                hp: 8,
                speed: 8,
                voice: '為光明與人民而戰',
                diceActions: {
                    1: { type: 'attack', value: 3, name: '正義審判' },
                    2: { type: 'attack', value: 4, name: '正義審判' },
                    3: { type: 'attack', value: 5, name: '聖光斬' },
                    4: { type: 'ultimate', name: '聖劍', effect: 'SILENCE_ALL', duration: 2, description: '使所有敵人陷入沉默(無法造成傷害) 2 回合' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/mortos.png'
            },
            {
                id: 'thane',
                name: '聖騎先鋒 薩尼',
                hp: 7,
                speed: 7,
                voice: '無畏衝鋒，誓掃邪魔',
                imageSettings: { objectPosition: 'center 5%' },
                diceActions: {
                    1: { type: 'attack', value: 4, name: '無畏衝鋒' },
                    2: { type: 'attack', value: 5, name: '無畏衝鋒' },
                    3: { type: 'attack', value: 6, name: '誓約勝利之劍' },
                    4: { type: 'ultimate', name: '光明裁決', value: 5, effect: 'TRUE_DAMAGE_ALL', target: 'all', description: '對所有敵人造成5點真實傷害（無視格擋/護盾）' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '光明之盾' }
                },
                image: '/assets/thane.png'
            },
            {
                id: 'omega',
                name: '聖騎行者 歐米茄',
                hp: 10,
                speed: 6,
                voice: '吾既行，則無止',
                imageSettings: { objectPosition: 'center 12%' },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '聖靈撞擊' },
                    2: { type: 'attack', value: 3, name: '聖靈撞擊' },
                    3: { type: 'attack', value: 3, name: '天降正義' },
                    4: { type: 'ultimate', name: '天道', effect: 'INVINCIBLE_STUN', duration: 5, stunDuration: 2, description: '進入5回合無敵狀態(自動格擋且無視非真傷)，且攻擊者會被暈眩2回合' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '道心' }
                },
                image: '/assets/omega.png'
            },
        ]
    },
    {
        id: 'abyssal-chaos',
        name: '魔能深淵',
        description: '平時戰力普通，以人類的貪婪、憤怒等為食，但惡魔之力往往能讓祂們在戰場上逆轉戰局。',
        heroes: [
            {
                id: 'maloch',
                name: '惡魔化身 馬洛斯',
                hp: 6,
                speed: 5,
                voice: '吵死了，螻蟻',
                diceActions: {
                    1: { type: 'attack', value: 2, name: '普通攻擊' },
                    2: { type: 'attack', value: 2, name: '重擊' },
                    3: { type: 'attack', value: 4, name: '拔刀斬' },
                    4: { type: 'ultimate', value: 8, name: '雷魔陣', effect: 'TRUE_DAMAGE_ALL', target: 'all', description: '對所有敵人造成8點真實傷害（無視格擋/護盾）' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/maloch_hero_card.webp.png'
            },
            {
                id: 'mina',
                name: '鬼鐮 美娜',
                hp: 8,
                speed: 2,
                voice: '進攻的號角，已響徹雲霄',
                passive: {
                    name: '死神鐮刀',
                    description: '在血量小於等於 0 時，強行加到 1，整場使用一次。'
                },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '揮砍' },
                    2: { type: 'attack', value: 2, name: '旋風之鐮' },
                    3: { type: 'attack', value: 2, name: '地獄鐮刀' },
                    4: { type: 'ultimate', name: '惡魔反甲', effect: 'MINA_REFLECT', description: '受傷時對手也會受到相同傷害持續整局，再次使用則反傷加倍。' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '魔甲' }
                },
                image: '/assets/mina.png',
                imageSettings: { objectPosition: 'center 10%' }
            },
            {
                id: 'aleister',
                name: '滅世紅魘 阿萊斯特',
                hp: 5,
                speed: 2,
                voice: '既是毀滅世界的死神,又是建立須彌境的創世神?',
                diceActions: {
                    1: { type: 'attack', value: 1, name: '絕對矩陣' },
                    2: { type: 'attack', value: 2, name: '零．弧' },
                    3: { type: 'attack', value: 3, name: '法則主宰' },
                    4: { type: 'ultimate', name: '零度奇點', value: 0, effect: 'SUPPRESS_TARGET', duration: 3, description: '絕對壓制目標英雄3回合，無視前後排護衛且可手動選位，期間阿萊斯特同樣無法行動。若目標陣亡則壓制提前結束。受壓制者無法被護衛，全體隊友可集火。' },
                    5: { type: 'evade', name: '空間閃擊' },
                    6: { type: 'block', name: '矩陣護盾' }
                },
                image: '/assets/aleister.png',
                imageSettings: { objectPosition: 'center 20%' }
            },
            {
                id: 'nakroth',
                name: '幻冥似刃 納克羅斯',
                hp: 6,
                speed: 7,
                voice: '這是最好的時代，也是最壞的時代',
                passive: { name: '幻刃', description: '無視前排護衛機制，可直接選定後排英雄為攻擊目標，且攻擊自帶閃避。' },
                diceActions: {
                    1: { type: 'attack', value: 3, name: '幽冥幻殺' },
                    2: { type: 'attack', value: 3, name: '幽冥幻殺' },
                    3: { type: 'attack', value: 3, name: '幽冥幻殺' },
                    4: { type: 'attack', value: 5, name: '幽冥亂舞' },
                    5: { type: 'evade', name: '幽冥鬼步' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/nakroth.png',
                imageSettings: { objectPosition: 'center 20%' }
            },
            {
                id: 'errol',
                name: '鬼斧 埃羅',
                hp: 5,
                speed: 3,
                voice: '斬．斷',
                diceActions: {
                    1: { type: 'attack', value: 1, name: '裂地' },
                    2: { type: 'attack', value: 2, name: '剔骨' },
                    3: { type: 'attack', value: 4, name: '鬼斧' },
                    4: { type: 'ultimate', name: '蝕骨巨斧', value: 5, heal: 5, target: 'all', description: '對所有敵人造成 5 點傷害，並回復自身 5 點生命。' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/errol.png'
            },
        ]
    },
    {
        id: 'afata',
        name: '暗影森林',
        description: '為了在殘酷的世界生存，他們擁有極強的生命力，並且不惜一切代價也要保護森林。',
        heroes: [
            {
                id: 'cresht',
                name: '水怪 克萊斯',
                hp: 9,
                speed: 2,
                voice: '我不會放棄森林，不會放棄戰鬥，吼!',
                imageSettings: { objectPosition: 'center 15%' },
                diceActions: {
                    1: { type: 'attack', value: 3, name: '爪擊' },
                    2: { type: 'attack', value: 3, name: '爪擊' },
                    3: { type: 'attack', value: 4, name: '重擊' },
                    4: { type: 'ultimate', value: 0, name: '淨化', effect: 'HEAL_FULL' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '鱗之鎧' }
                },
                image: '/assets/cresht.png.avif'
            },
            {
                id: 'tara',
                name: '大酋長 塔拉',
                hp: 14,
                speed: 2,
                voice: '再敏捷的身手，也比不過一錘定音的力量。',
                passive: {
                    name: '戰意',
                    description: '每失去2血，所有傷害+1'
                },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '錘擊' },
                    2: { type: 'attack', value: 2, name: '錘擊' },
                    3: { type: 'attack', value: 2, heal: 1, name: '一錘定音' },
                    4: { type: 'ultimate', name: '鋼鐵意志', effect: 'BUFF_REGEN_3_5_TURNS', description: '每回合回復3血量，持續5回合' },
                    5: { type: 'evade', name: '閃避' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/tara.png',
                imageSettings: { objectPosition: 'center 15%' }
            },
            {
                id: 'lumburr',
                name: '重岩之心 朗博',
                hp: 13,
                speed: 1,
                voice: '鐵山山脈，由我來守護。',
                diceActions: {
                    1: { type: 'attack', value: 1, name: '岩擊' },
                    2: { type: 'attack', value: 1, name: '岩擊' },
                    3: { type: 'attack', value: 3, name: '開碑裂石' },
                    4: { type: 'attack', value: 4, name: '撕裂大地' },
                    5: { type: 'ultimate', name: '岩盾', effect: 'LUMBURR_ULT', description: '該回合無敵，從下回合開始獲得一個8點護盾' },
                    6: { type: 'block', name: '岩之心' }
                },
                image: '/assets/lumburr.png',
                imageSettings: { objectPosition: 'center 20%' }
            },
        ]
    },
    {
        id: 'ronin',
        name: '浪人武士',
        description: '遊走於法外之地的孤傲劍客與武士。',
        heroes: [
            {
                id: 'he',
                name: '孤俠 赫',
                hp: 8,
                speed: 6,
                voice: '我守護的不是這片殘破的土地，而是那些……再也回不去的溫暖。',
                passive: {
                    name: '雙華逆鱗',
                    description: '攻擊時隨機附帶「霜寒」(暈眩1回合)或「熾焰」(獲得霸體1回合)。'
                },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '斬擊' },
                    2: { type: 'attack', value: 2, name: '逆鱗劍' },
                    3: { type: 'attack', value: 7, name: '落日斬' },
                    4: { type: 'ultimate', name: '瞬影．流光斬', effect: 'UNTARGETABLE_2_TURNS', value: 5, target: 'all', description: '進入不可選中狀態2回合(無視傷害/控制/壓制)，結束後造成5點群傷。' },
                    5: { type: 'evade', name: '瞬影' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/he.png.avif',
                imageSettings: { objectPosition: 'center 10%' }
            },
            {
                id: 'ryoma',
                name: '行者 龍馬',
                hp: 7,
                speed: 4,
                voice: '山高任鳥飛，海闊任魚游',
                passive: {
                    name: '刀訣',
                    description: '每次攻擊命中，自身所有數值+1'
                },
                diceActions: {
                    1: { type: 'attack', value: 2, name: '斬擊' },
                    2: { type: 'attack', value: 3, name: '劍氣斬' },
                    3: { type: 'attack', value: 5, name: '一刀兩斷' },
                    4: { type: 'ultimate', name: '刀氣縱橫', value: 5, heal: 3, target: 'all', description: '攻所有敵人5，回血3' },
                    5: { type: 'evade', name: '燕返' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/ryoma.png'
            },
            {
                id: 'raz',
                name: '拳王 拉茲',
                hp: 1,
                speed: 9,
                voice: '這一拳，會穿透你的靈魂——給我倒下！',
                imageSettings: { objectPosition: 'center 15%' },
                diceActions: {
                    1: { type: 'attack', value: 4, name: '鐵拳' },
                    2: { type: 'attack', value: 4, name: '鐵拳' },
                    3: { type: 'attack', value: 10, name: '波動拳' },
                    4: { type: 'ultimate', name: '終結昇龍拳', effect: 'AGAIN_ACTION', description: '擊暈敵人1回合，並再次擲骰子決定行動。' },
                    5: { type: 'evade', name: '輪轉鐘擺拳', effect: 'EVADE_AGAIN' },
                    6: { type: 'block', name: '格檔' }
                },
                image: '/assets/raz.png'
            },
        ]
    }
];

export const cardLibrary = {
    factions: factions,
    types: ['英雄', '裝備']
};
