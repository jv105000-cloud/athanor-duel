export const factions = [
    {
        id: 'temple-of-light',
        name: '???挪',
        description: '餈賣?甇?儔????蟡?畾踹?嚗誑撘瑟?????漲?迂??,
        heroes: [
            {
                id: 'bright',
                name: '憭批予雿?撣???,
                hp: 7,
                speed: 10,
                voice: '雿?敹思???',
                diceActions: {
                    1: { type: 'attack', value: 3, name: '??銋?' },
                    2: { type: 'attack', value: 4, name: '??銋?' },
                    3: { type: 'attack', value: 7, name: '??' },
                    4: { type: 'ultimate', name: '??, effect: 'BUFF_SPEED_INFINITY_3_TURNS', description: '3???折漲?⊿?(?敹?)銝?銝哨??芸??銝??臬?? },
                    5: { type: 'evade', name: '蟡? },
                    6: { type: 'block', name: '?' }
                },
                image: '/assets/bright.png'
            },
            {
                id: 'mortos',
                name: '??憯??急???,
                hp: 8,
                speed: 8,
                voice: '?箏???鈭箸??',
                diceActions: {
                    1: { type: 'attack', value: 3, name: '甇?儔撖拙' },
                    2: { type: 'attack', value: 4, name: '甇?儔撖拙' },
                    3: { type: 'attack', value: 5, name: '???? },
                    4: { type: 'ultimate', name: '??', effect: 'SILENCE_ALL', duration: 2, description: '雿踵??鈭粹?交?暺??⊥????瑕拿) 2 ??' },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/mortos.png'
            },
            {
                id: 'thane',
                name: '???? ?拙側',
                hp: 7,
                speed: 7,
                voice: '?∠?銵?嚗??擳?,
                imageSettings: { objectPosition: 'center 5%' },
                diceActions: {
                    1: { type: 'attack', value: 4, name: '?∠?銵?' },
                    2: { type: 'attack', value: 5, name: '?∠?銵?' },
                    3: { type: 'attack', value: 6, name: '隤??銋?' },
                    4: { type: 'ultimate', name: '??鋆捱', value: 5, effect: 'TRUE_DAMAGE_ALL', target: 'all', description: '撠??鈭粹?5暺?撖血摰喉??∟??潭?/霅瑞嚗? },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '??銋' }
                },
                image: '/assets/thane.png'
            },
            {
                id: 'omega',
                name: '??銵?甇掖??,
                hp: 10,
                speed: 6,
                voice: '?暹銵??甇?,
                imageSettings: { objectPosition: 'center 12%' },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '????' },
                    2: { type: 'attack', value: 3, name: '????' },
                    3: { type: 'attack', value: 3, name: '憭拚?甇?儔' },
                    4: { type: 'ultimate', name: '憭拚?', effect: 'INVINCIBLE_STUN', duration: 5, stunDuration: 2, description: '?脣5???⊥????芸??潭?銝閬??)嚗??餅???鋡急?????' },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '??' }
                },
                image: '/assets/omega.png'
            },
        ]
    },
    {
        id: 'abyssal-chaos',
        name: '擳瘛望殿',
        description: '撟單??啣??桅?隞乩犖憿?鞎芸帚????粹?嚗??⊿?銋?敺敺?質?蟡?啣銝??啣???,
        heroes: [
            {
                id: 'maloch',
                name: '?⊿??澈 擐祆???,
                hp: 6,
                speed: 5,
                voice: '?菜香鈭??餉',
                diceActions: {
                    1: { type: 'attack', value: 2, name: '?桅?? },
                    2: { type: 'attack', value: 2, name: '??' },
                    3: { type: 'attack', value: 4, name: '???? },
                    4: { type: 'ultimate', value: 8, name: '?琿???, effect: 'TRUE_DAMAGE_ALL', target: 'all', description: '撠??鈭粹?8暺?撖血摰喉??∟??潭?/霅瑞嚗? },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/maloch_hero_card.webp.png'
            },
            {
                id: 'mina',
                name: '擛潮 蝢?',
                hp: 8,
                speed: 2,
                voice: '?脫??閫?撌脤敺寥??,
                passive: {
                    name: '甇餌??桀?',
                    description: '?刻????潛???0 ??撘瑁?? 1嚗?港蝙?其?甈～?
                },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '?桃?' },
                    2: { type: 'attack', value: 2, name: '?◢銋' },
                    3: { type: 'attack', value: 2, name: '?啁??桀?' },
                    4: { type: 'ultimate', name: '?⊿??', effect: 'MINA_REFLECT', description: '????????啁?摰單?蝥撅嚗?甈∩蝙?典???? },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '擳' }
                },
                image: '/assets/mina.png',
                imageSettings: { objectPosition: 'center 10%' }
            },
            {
                id: 'aleister',
                name: '皛?蝝? ?輯??舐',
                hp: 5,
                speed: 2,
                voice: '?Ｘ瘥皛???甇餌?,?撱箇???憓??萎?蟡?',
                diceActions: {
                    1: { type: 'attack', value: 1, name: '蝯??拚' },
                    2: { type: 'attack', value: 2, name: '?塚?撘? },
                    3: { type: 'attack', value: 3, name: '瘜?銝餃扇' },
                    4: { type: 'ultimate', name: '?嗅漲憟?', value: 0, effect: 'SUPPRESS_TARGET', duration: 3, description: '蝯?憯?格??梢?3??嚗閬?敺?霅瑁?銝???訾?嚗????孵?璅?瘜???格???滿???嗆?????憯?瘜◤霅瑁?嚗擃????? },
                    5: { type: 'evade', name: '蝛粹???' },
                    6: { type: 'block', name: '撟曆?蝯?' }
                },
                image: '/assets/aleister.png',
                imageSettings: { objectPosition: 'center 20%' }
            },
            {
                id: 'nakroth',
                name: '撟餃隡澆? 蝝?蝢',
                hp: 6,
                speed: 7,
                voice: '??憟賜??誨嚗??舀?憯??誨',
                passive: { name: '撟餃?', description: '?∟???霅瑁?璈嚗?湔?詨?敺??梢??箸?璅?銝?撣園??踴? },
                diceActions: {
                    1: { type: 'attack', value: 3, name: '撟賢撟餅捏' },
                    2: { type: 'attack', value: 3, name: '撟賢撟餅捏' },
                    3: { type: 'attack', value: 3, name: '撟賢撟餅捏' },
                    4: { type: 'attack', value: 5, name: '撟賢鈭?' },
                    5: { type: 'evade', name: '撟賢擛潭郊' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/nakroth.png',
                imageSettings: { objectPosition: 'center 20%' }
            },
            {
                id: 'errol',
                name: '擛潭 ??',
                hp: 5,
                speed: 3,
                voice: '?穿???,
                diceActions: {
                    1: { type: 'attack', value: 1, name: '鋆' },
                    2: { type: 'attack', value: 2, name: '?爸' },
                    3: { type: 'attack', value: 4, name: '擛潭' },
                    4: { type: 'ultimate', name: '?爸撌冽', value: 5, heal: 5, target: 'all', description: '撠??鈭粹? 5 暺摰喉?銝血?敺抵頨?5 暺??賬? },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/errol.png'
            },
        ]
    },
    {
        id: 'afata',
        name: '?蔣璉格?',
        description: '?箔??冽??瑞?銝???嚗????扔撘瑞????銝虫?銝?銝?誨?嫣?閬?霅瑟ㄝ??,
        heroes: [
            {
                id: 'cresht',
                name: '瘞湔?????,
                hp: 9,
                speed: 2,
                voice: '???璉ㄝ??銝??暹??圈洛嚗!',
                imageSettings: { objectPosition: 'center 15%' },
                diceActions: {
                    1: { type: 'attack', value: 3, name: '?芣?' },
                    2: { type: 'attack', value: 3, name: '?芣?' },
                    3: { type: 'attack', value: 4, name: '??' },
                    4: { type: 'ultimate', value: 0, name: '瘛典?', effect: 'HEAL_FULL' },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '敼??? }
                },
                image: '/assets/cresht.png.avif'
            },
            {
                id: 'tara',
                name: '憭折???憛?',
                hp: 14,
                speed: 2,
                voice: '???瑞?頨急?嚗?瘥??????喟?????,
                passive: {
                    name: '?唳?',
                    description: '瘥仃??銵嚗??摰?1'
                },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '??' },
                    2: { type: 'attack', value: 2, name: '??' },
                    3: { type: 'attack', value: 2, heal: 1, name: '銝???? },
                    4: { type: 'ultimate', name: '?潮??', effect: 'BUFF_REGEN_3_5_TURNS', description: '瘥???敺?銵????5??' },
                    5: { type: 'evade', name: '?' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/tara.png',
                imageSettings: { objectPosition: 'center 15%' }
            },
            {
                id: 'lumburr',
                name: '?痔銋? ??',
                hp: 13,
                speed: 1,
                voice: '?萄控撅梯?嚗??摰風??,
                diceActions: {
                    1: { type: 'attack', value: 1, name: '撗拇?' },
                    2: { type: 'attack', value: 1, name: '撗拇?' },
                    3: { type: 'attack', value: 3, name: '??鋆' },
                    4: { type: 'attack', value: 4, name: '??憭批' },
                    5: { type: 'ultimate', name: '撗拍', effect: 'LUMBURR_ULT', description: '閰脣???蛛?敺??????脣?銝??暺風?? },
                    6: { type: 'block', name: '撗拐?敹? }
                },
                image: '/assets/lumburr.png',
                imageSettings: { objectPosition: 'center 20%' }
            },
        ]
    },
    {
        id: 'ronin',
        name: '瘚芯犖甇血ㄚ',
        description: '?粥?潭?憭??啁?摮文?恥?郎憯怒?,
        heroes: [
            {
                id: 'theiolee',
                name: '憒?蟡 撣???,
                hp: 6,
                speed: 6,
                voice: '瘜Ｗ???撘?憟芸???辣撖嗥嚗????閬??蔣摮?,
                diceActions: {
                    1: { type: 'attack', value: 0, name: '蝜單１', effect: 'SILENCE_TARGET', description: '雿輻璅??寡??暺?1 ??' },
                    2: { type: 'attack', value: 0, name: '撟賡?憒?', effect: 'SILENCE_TRANSFER', description: '雿輻璅??寡??暺?1 ??嚗??砍????啁??瑕拿撠?蝘餌策閰脩璅? },
                    3: { type: 'attack', value: 0, name: '??銝?', effect: 'SILENCE_UNTARGETABLE', description: '雿輻璅??寡??暺?1 ??嚗??芾澈?脣???舫銝准???1 ??' },
                    4: { type: 'ultimate', name: '蟡憭拐?', effect: 'COPY_ULTIMATE', description: '銴ˊ?格?撠?之??撉啣?暺 4嚗蒂蝡雿輻' },
                    5: { type: 'evade', name: '?梢?' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/theiolee.jpg',
                imageSettings: { objectPosition: 'center 25%' }
            },
            {
                id: 'he',
                name: '摮支? 韏?,
                hp: 8,
                speed: 6,
                voice: '??霅瑞?銝??畾???堆??????色血?銋?銝?澈??,
                passive: {
                    name: '???',
                    description: '?餅??璈?撣嗚?撖??1??)??啜??脣??賊?1??)??
                },
                diceActions: {
                    1: { type: 'attack', value: 1, name: '?祆?' },
                    2: { type: 'attack', value: 2, name: '???? },
                    3: { type: 'attack', value: 7, name: '?賣?? },
                    4: { type: 'ultimate', name: '?砍蔣嚗??', effect: 'UNTARGETABLE_2_TURNS', value: 5, target: 'all', description: '?脣銝?訾葉?????(?∟??瑕拿/?批/憯)嚗?????5暺黎?瑯? },
                    5: { type: 'evade', name: '?砍蔣' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/he.png.avif',
                imageSettings: { objectPosition: 'center 10%' }
            },
            {
                id: 'ryoma',
                name: '銵?樴收',
                hp: 7,
                speed: 4,
                voice: '撅梢?隞駁野憌?瘚琿?隞駁?皜?,
                passive: {
                    name: '?閮?,
                    description: '瘥活?餅??賭葉嚗頨急????1'
                },
                diceActions: {
                    1: { type: 'attack', value: 2, name: '?祆?' },
                    2: { type: 'attack', value: 3, name: '?除?? },
                    3: { type: 'attack', value: 5, name: '銝??拇' },
                    4: { type: 'ultimate', name: '?瘞?萵璈?, value: 5, heal: 3, target: 'all', description: '?餅??鈭?嚗?銵3' },
                    5: { type: 'evade', name: '??' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/ryoma.png'
            },
            {
                id: 'raz',
                name: '?喟? ?',
                hp: 1,
                speed: 9,
                voice: '???喉??忽????擳策??嚗?,
                imageSettings: { objectPosition: 'center 15%' },
                diceActions: {
                    1: { type: 'attack', value: 4, name: '?菜' },
                    2: { type: 'attack', value: 4, name: '?菜' },
                    3: { type: 'attack', value: 10, name: '瘜Ｗ??? },
                    4: { type: 'ultimate', name: '蝯?????, effect: 'AGAIN_ACTION', description: '???萎犖1??嚗蒂?活?脤狐摮捱摰??? },
                    5: { type: 'evade', name: '頛芾????, effect: 'EVADE_AGAIN' },
                    6: { type: 'block', name: '?潭?' }
                },
                image: '/assets/raz.png'
            }
        ]
    }
];

export const cardLibrary = {
    factions: factions,
    types: ['?梢?', '鋆?']
};
