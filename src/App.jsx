import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import './App.css';
import './BattleEffects.css';
import { factions } from './data/cardLibrary.js';
import HeroCard from './components/HeroCard';
import { supabase } from './supabaseClient';

function App() {
  const [view, setView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ account: '', password: '' });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [gameMode, setGameMode] = useState(null);
  const [selectedFaction, setSelectedFaction] = useState(null);

  // Positional Team State: { front: null, roam: null, back: null }
  const [p1Team, setP1Team] = useState({ front: null, roam: null, back: null });
  const [p2Team, setP2Team] = useState({ front: null, roam: null, back: null });
  const [activeSelectPos, setActiveSelectPos] = useState({ p1: 'front', p2: 'front' });
  const [currentPicker, setCurrentPicker] = useState(1);

  // Battle State
  const [battleData, setBattleData] = useState(null);
  const [battlePhase, setBattlePhase] = useState('CHOOSE');
  const [battleTimer, setBattleTimer] = useState(15);
  const [p1Choice, setP1Choice] = useState({ heroId: null, targetId: null });
  const [p2Choice, setP2Choice] = useState({ heroId: null, targetId: null });
  const [battleLog, setBattleLog] = useState([]);
  const [diceResults, setDiceResults] = useState({ p1: null, p2: null });
  const [activeVfx, setActiveVfx] = useState({});
  const [evadingHeroes, setEvadingHeroes] = useState([]);
  const [smashingHeroId, setSmashingHeroId] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [roundCount, setRoundCount] = useState(1);
  const [showResultOverlay, setShowResultOverlay] = useState(false);

  // Online Multiplayer State
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState('');
  const [conn, setConn] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [targetIdInput, setTargetIdInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('OFFLINE'); // OFFLINE, CONNECTING, CONNECTED
  const [oppReady, setOppReady] = useState(false);
  const [bondTab, setBondTab] = useState('faction'); // 'faction' or 'bond'
  const [abyssalDice, setAbyssalDice] = useState({ p1: null, p2: null }); // { p1: [roll1, roll2], p2: [roll1, roll2] }
  const [abyssalChoice, setAbyssalChoice] = useState({ p1: null, p2: null }); // { p1: selectedIndex, p2: selectedIndex }
  const [pendingUltSelection, setPendingUltSelection] = useState(null); // { pId: number, actorId: string, action: object }

  const allHeroes = factions.flatMap(f => f.heroes.map(h => ({ ...h, factionId: f.id })));

  const getTeamSize = (team) => Object.values(team).filter(h => h !== null).length;

  // AI Selection Draft
  useEffect(() => {
    if (view === 'selection' && gameMode === 'vs-ai' && currentPicker === 2) {
      // Global Config for Worldwide Access
      const API_BASE_URL = window.location.origin; // Use relative paths by default
      const STUN_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.schlund.de' },
      ];
      const p2Size = getTeamSize(p2Team);
      const p1Size = getTeamSize(p1Team);
      if (p2Size < 3) {
        const timer = setTimeout(() => {
          const avail = allHeroes.filter(h =>
            !Object.values(p1Team).find(p => p?.id === h.id) &&
            !Object.values(p2Team).find(p => p?.id === h.id)
          );
          if (avail.length > 0) {
            const randomHero = avail[Math.floor(Math.random() * avail.length)];
            const emptySlots = Object.keys(p2Team).filter(k => p2Team[k] === null);
            const slotToFill = emptySlots[0];
            setP2Team(prev => ({ ...prev, [slotToFill]: randomHero }));
            if (p1Size < 3) setCurrentPicker(1);
          }
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPicker, view, gameMode, p1Team, p2Team]);

  // PeerJS Initialization
  useEffect(() => {
    // Re-run peer init when user log-in state changes to include account in ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const userId = currentUser ? `${currentUser.account}_${randomSuffix}` : `ANON_${randomSuffix}`;

    // 全球連線強化：加入多組 STUN 伺服器
    const newPeer = new Peer(userId, {
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    newPeer.on('open', (id) => setMyId(id));
    newPeer.on('connection', (c) => {
      if (connRef.current) { c.close(); return; } // Use Ref check to avoid stale closures
      setupConnection(c);
      setIsHost(true);
      setGameMode('online-pvp');
      setView('selection');
    });
    setPeer(newPeer);
    return () => newPeer.destroy();
  }, [currentUser?.account]); // Re-init when account changes

  const connRef = useRef(null);
  useEffect(() => {
    connRef.current = conn;
  }, [conn]);

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('ayiseno_user');
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      // 雲端資料同步：從 Supabase 獲取最新資料
      supabase.from('users')
        .select('*')
        .eq('account', userObj.account)
        .eq('password', userObj.password)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setCurrentUser(data);
            localStorage.setItem('ayiseno_user', JSON.stringify(data));
            setView('lobby');
          } else {
            handleLogout();
          }
        }).catch(() => {
          setCurrentUser(userObj);
          setView('lobby');
        });
    }
  }, []);

  const handleLoginAction = async () => {
    if (!loginData.account || !loginData.password) {
      alert("請輸入帳號與密碼");
      return;
    }

    try {
      if (isRegisterMode) {
        // Supabase 註冊邏輯
        const { data: existing } = await supabase.from('users').select('account').eq('account', loginData.account).single();
        if (existing) {
          alert("帳號已存在");
          return;
        }

        const { data, error } = await supabase.from('users').insert([{
          account: loginData.account,
          password: loginData.password,
          holyPearl: 0,
          magicCore: 0,
          leaf: 0,
          goldCoin: 0
        }]).select();

        if (error) {
          console.error("Supabase註冊報錯:", error);
          alert(`註冊失敗：${error.message}`);
        } else {
          alert("註冊成功！請直接登入");
          setIsRegisterMode(false);
          setLoginData({ account: loginData.account, password: '' });
        }
      } else {
        // Supabase 登入邏輯
        const { data, error } = await supabase.from('users')
          .select('*')
          .eq('account', loginData.account)
          .eq('password', loginData.password)
          .single();

        if (data && !error) {
          setCurrentUser(data);
          localStorage.setItem('ayiseno_user', JSON.stringify(data));
          setView('lobby');
        } else {
          alert("帳號或密碼錯誤");
        }
      }
    } catch (err) {
      alert("連線雲端資料庫失敗，請檢查 supabaseClient.js 設定");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ayiseno_user');
    setCurrentUser(null);
    setView('login');
    setLoginData({ account: '', password: '' });
  };

  const setupConnection = (connection) => {
    connection.on('open', () => {
      setConn(connection);
      setConnectionStatus('CONNECTED');
    });
    connection.on('data', (data) => {
      handleRemoteData(data);
    });
    connection.on('close', () => {
      setConnectionStatus('OFFLINE');
      setConn(null);
      alert("連線已中斷");
      setView('lobby');
    });
  };

  const handleRemoteData = (data) => {
    switch (data.type) {
      case 'SYNC_PICK':
        if (data.pId === 1) {
          setP1Team(data.team);
          if (data.nextPicker) setCurrentPicker(data.nextPicker);
        } else {
          setP2Team(data.team);
          if (data.nextPicker) setCurrentPicker(data.nextPicker);
        }
        break;
      case 'START_BATTLE':
        setBattleData(data.battleData);
        setBattlePhase('CHOOSE');
        setBattleTimer(15);
        setView('battle');
        setBattleLog(['⚔️ 遠端對決開始！', '🛡️ 守衛機制已生效。']);
        processingTurnRef.current = false; // Reset lock for new game
        break;
      case 'SYNC_CHOICE':
        if (isHost) {
          setP2Choice(prev => ({ ...prev, ...data }));
        } else {
          setP1Choice(prev => ({ ...prev, ...data }));
        }
        break;
      case 'RUN_SEQUENCE':
        executeSequence(data.r1, data.r2, data.c1, data.c2, data.seed);
        break;
      case 'SYNC_PHASE':
        setBattlePhase(data.phase);
        if (data.timer !== undefined) setBattleTimer(data.timer);
        break;
      case 'SYNC_ABYSSAL_DICE':
        setAbyssalDice(data.dice);
        setAbyssalChoice({ p1: null, p2: null });
        setBattlePhase('ABYSSAL_CHOICE');
        setBattleTimer(10);
        break;
      case 'SYNC_ABYSSAL_CHOICE':
        setAbyssalChoice(prev => ({ ...prev, [data.pId === 1 ? 'p1' : 'p2']: data.choiceIndex }));
        break;
      case 'NEXT_TURN':
        nextTurnLogic();
        break;
      case 'SYNC_ULT_TARGET':
        if (window.pendingSequenceResume && pendingUltSelection) {
          const { pId, actorId, action, currentBattleData: draftBD } = pendingUltSelection;
          const currentBattleData = JSON.parse(JSON.stringify(draftBD));
          const team = pId === 1 ? currentBattleData.p1 : currentBattleData.p2;
          const actor = team.find(x => x.id === actorId);
          const enemyTeam = pId === 1 ? currentBattleData.p2 : currentBattleData.p1;
          const target = enemyTeam.find(x => x.id === data.targetId);

          if (target) {
            const suppressDur = action.duration || 3;
            target.statuses.stunned = suppressDur;
            target.suppressedBy = actor.id;
            actor.statuses.stunned = suppressDur;
            actor.isChannelingSuppression = true;
            actor.suppressingTargetId = target.id;

            setBattleLog(prev => [...prev, `💀 [${action.name}]！敵方已選擇壓制 ${target.name}！`]);
            setBattleData(JSON.parse(JSON.stringify(currentBattleData)));
            setPendingUltSelection(null);
            setBattlePhase('ACTION_ANIM');
            if (window.pendingSequenceResume) {
              window.pendingSequenceResume(currentBattleData);
              window.pendingSequenceResume = null;
            }
          }
        }
        break;
      default: break;
    }
  };

  const nextTurnLogic = () => {
    if (gameMode === 'online-pvp' && isHost && conn) {
      conn.send({ type: 'NEXT_TURN' });
    }
    setBattlePhase('PRE_ROUND');
    setBattleTimer(3);
    setP1Choice({ heroId: null, targetId: null });
    setP2Choice({ heroId: null, targetId: null });
    setDiceResults({ p1: null, p2: null });

    // Increment round and add separator instead of clearing
    setRoundCount(prev => {
      const next = prev + 1;
      setBattleLog(logs => [...logs, `[ 第 ${next} 回合 ]`]);
      return next;
    });

    processingTurnRef.current = false; // Unlock for next turn
  };

  const processingTurnRef = useRef(false);

  const connectToPeer = () => {
    if (!targetIdInput) return;
    setConnectionStatus('CONNECTING');
    const c = peer.connect(targetIdInput);
    setupConnection(c);
    setIsHost(false);
    setGameMode('online-pvp');
    setView('selection');
  };

  const startBattle = () => {
    // 1. Prepare initial battle data
    const teams = {
      p1: Object.entries(p1Team).map(([pos, h]) => h ? ({ ...JSON.parse(JSON.stringify(h)), pos, currentHp: h.hp, shield: 0, pendingShield: 0, statuses: { silenced: 0, invincible: 0, stunned: 0, speed: 0 }, minaPassiveUsed: false, minaReflectMult: 0 }) : null).filter(h => h && h.id),
      p2: Object.entries(p2Team).map(([pos, h]) => h ? ({ ...JSON.parse(JSON.stringify(h)), pos, currentHp: h.hp, shield: 0, pendingShield: 0, statuses: { silenced: 0, invincible: 0, stunned: 0, speed: 0 }, minaPassiveUsed: false, minaReflectMult: 0 }) : null).filter(h => h && h.id)
    };

    const initialLogs = ['⚔️ 戰鬥正式開始！', '🛡️ 守衛機制：前排存活時，後排英雄無法被當成直接攻擊的目標。'];

    // 2. Check and apply Faction Powers
    const applyFactionPower = (pId, team) => {
      if (team.length < 3) return; // Only full teams trigger faction power

      // Count Ronin heroes
      const roninCount = team.filter(h => h.factionId === 'ronin').length;
      const nonRoninHeroes = team.filter(h => h.factionId !== 'ronin');

      // Ronin special: If there's exactly 1 Ronin, check if the other 2 are from the same faction
      let canActivate = false;
      let activeFaction = null;

      if (roninCount === 1 && nonRoninHeroes.length === 2) {
        if (nonRoninHeroes[0].factionId === nonRoninHeroes[1].factionId) {
          canActivate = true;
          activeFaction = nonRoninHeroes[0].factionId;
          initialLogs.push(`⚔️ [浪人之道] 觸發：P${pId} 的浪人英雄不影響陣營之力！`);
        }
      } else if (roninCount === 0) {
        // No Ronin, check if all 3 are from the same faction
        const firstFaction = team[0].factionId;
        if (team.every(h => h.factionId === firstFaction)) {
          canActivate = true;
          activeFaction = firstFaction;
        }
      }
      // If 2 or 3 Ronin, no faction power activates

      if (canActivate && activeFaction) {
        if (activeFaction === 'temple-of-light') {
          team.forEach(h => {
            h.speed = (h.speed || 0) + 1;
            Object.keys(h.diceActions).forEach(k => {
              if (h.diceActions[k].type === 'attack') {
                h.diceActions[k].value = (h.diceActions[k].value || 0) + 1;
              }
            });
          });
          initialLogs.push(`✨ [陣營之光] 觸發：P${pId} 全隊屬於光明聖殿，攻擊力與速度 +1！`);
        } else if (activeFaction === 'abyssal-chaos') {
          team.forEach(h => {
            h.hasAbyssalPower = true; // Mark for double dice roll
          });
          initialLogs.push(`🔮 [深淵之力] 觸發：P${pId} 全隊屬於魔能深淵，每回合可擲骰兩次並擇優！`);
        } else if (activeFaction === 'afata') {
          team.forEach(h => {
            h.hp = (h.hp || 0) + 3;
            h.currentHp = (h.currentHp || 0) + 3;
            h.hasForestCounter = true; // Mark for counter-attack
          });
          initialLogs.push(`🌲 [森林之力] 觸發：P${pId} 全隊屬於暗影森林，生命 +3 且受傷時反擊 1 點！`);
        }
      }
    };

    const applyBondPower = (pId, team) => {
      if (team.length < 3) return;
      const heroIds = team.map(h => h.id);

      if (heroIds.includes('mortos') && heroIds.includes('thane') && heroIds.includes('omega')) {
        team.forEach(h => {
          h.hp = (h.hp || 0) + 1;
          h.currentHp = (h.currentHp || 0) + 1;
          h.speed = (h.speed || 0) + 1;
          Object.keys(h.diceActions).forEach(k => {
            if (h.diceActions[k].type === 'attack' || (h.diceActions[k].type === 'ultimate' && h.diceActions[k].value !== undefined)) {
              h.diceActions[k].value = (h.diceActions[k].value || 0) + 1;
            }
          });
        });
        initialLogs.push(`🛡️ [羈絆：光明騎士團] 觸發：P${pId} 莫托斯、薩尼、歐米茄同時在場，全數值 +1！`);
        initialLogs.push(`🗣️ 「讓光明，重回大地」---光明騎士團`);
      }

      // 鐵山之盟: 塔拉, 朗博
      if (heroIds.includes('tara') && heroIds.includes('lumburr')) {
        team.forEach(h => {
          h.hp = (h.hp || 0) + 2;
          h.currentHp = (h.currentHp || 0) + 2;
        });
        initialLogs.push(`⛰️ [羈絆：鐵山之盟] 觸發：P${pId} 盟友塔拉、朗博並肩作戰，生命 +2！`);
        initialLogs.push(`🗣️ 「這是我們，最後的家園!」---鐵山聯盟`);
      }

      // 血煞修羅: 美娜, 埃羅
      if (heroIds.includes('mina') && heroIds.includes('errol')) {
        team.forEach(h => {
          h.minaErrolBond = true;
          if (h.id === 'mina') {
            h.minaReflectMult = 1; // Auto start ult
          }
        });
        initialLogs.push(`🩸 [羈絆：血煞修羅] 觸發：P${pId} 伴侶美娜、埃羅同場，美娜自動開啟惡魔反甲！`);
        initialLogs.push(`🗣️ 「我會帶著妳，戰至最後一刻。」---埃羅`);
      }
    };

    applyFactionPower(1, teams.p1);
    applyFactionPower(2, teams.p2);
    applyBondPower(1, teams.p1);
    applyBondPower(2, teams.p2);

    initialLogs.push('[ 第 1 回合 ]');

    const bData = { p1: teams.p1, p2: teams.p2 };

    if (conn) conn.send({ type: 'START_BATTLE', battleData: bData });
    setBattleData(bData);
    setBattlePhase('CHOOSE');
    setBattleTimer(15);
    setView('battle');
    setGameResult(null);
    setShowResultOverlay(false);
    setRoundCount(1);
    setBattleLog(initialLogs);
    processingTurnRef.current = false;
  };



  // Timer & AI Choice
  useEffect(() => {
    let interval;
    if (view === 'battle' && battlePhase === 'CHOOSE') {
      // ... (existing AI logic)
      if (gameMode === 'vs-ai' && !p2Choice.heroId) {
        const aliveAI = battleData.p2.filter(h => h.currentHp > 0);
        const aliveP1 = battleData.p1.filter(h => h.currentHp > 0);
        if (aliveAI.length > 0 && aliveP1.length > 0) {
          // AI Logic: Roam is independent. Front protects back.
          const p1FrontExists = aliveP1.some(h => h.pos === 'front' && !(h.statuses?.untargetable > 0));

          let legalTargets = aliveP1.filter(h => {
            if (h.pos === 'roam' || h.pos === 'front') return true;
            if (h.pos === 'back' && !p1FrontExists) return true;
            if (h.suppressedBy) return true;
            return false;
          });

          // Filter for targetable ones, but if everyone is untargetable, we fallback to legal targets to prevent soft-lock
          let validTargets = legalTargets.filter(h => !(h.statuses?.untargetable > 0));
          if (validTargets.length === 0) validTargets = legalTargets;

          if (validTargets.length > 0) {
            setP2Choice({
              heroId: aliveAI[Math.floor(Math.random() * aliveAI.length)].id,
              targetId: validTargets[Math.floor(Math.random() * validTargets.length)].id
            });
          }
        }
      }
      interval = setInterval(() => {
        setBattleTimer(prev => {
          if (prev <= 1) {
            // Only Host or Local Game triggers the turn sequence automatically
            if (gameMode !== 'online-pvp' || isHost) {
              handleSequenceStart();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (view === 'battle' && battlePhase === 'PRE_ROUND') {
      interval = setInterval(() => {
        setBattleTimer(prev => {
          if (prev <= 1) {
            setBattlePhase('CHOOSE');
            setBattleTimer(15);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (view === 'battle' && battlePhase === 'ABYSSAL_CHOICE') {
      // Auto-select for AI (P2 in vs-ai mode)
      if (gameMode === 'vs-ai' && abyssalDice.p2 && abyssalChoice.p2 === null) {
        const betterIndex = abyssalDice.p2[0] >= abyssalDice.p2[1] ? 0 : 1;
        setAbyssalChoice(prev => ({ ...prev, p2: betterIndex }));
      }

      interval = setInterval(() => {
        setBattleTimer(prev => {
          if (prev <= 1) {
            // Auto-select for any player who hasn't chosen
            if (abyssalDice.p1 && abyssalChoice.p1 === null) {
              const betterIndex = abyssalDice.p1[0] >= abyssalDice.p1[1] ? 0 : 1;
              setAbyssalChoice(p => ({ ...p, p1: betterIndex }));
            }
            if (abyssalDice.p2 && abyssalChoice.p2 === null) {
              const betterIndex = abyssalDice.p2[0] >= abyssalDice.p2[1] ? 0 : 1;
              setAbyssalChoice(p => ({ ...p, p2: betterIndex }));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, battlePhase, p2Choice.heroId, p1Choice, p2Choice, battleData, gameMode, abyssalDice, abyssalChoice]);

  // Check if both players have made their Abyssal choice
  useEffect(() => {
    if (battlePhase === 'ABYSSAL_CHOICE') {
      const p1Ready = !abyssalDice.p1 || abyssalChoice.p1 !== null;
      const p2Ready = !abyssalDice.p2 || abyssalChoice.p2 !== null;

      if (p1Ready && p2Ready) {
        setTimeout(continueAfterAbyssalChoice, 500);
      }
    }
  }, [battlePhase, abyssalChoice, abyssalDice]);

  useEffect(() => {
    if (view === 'battle' && battlePhase === 'CHOOSE' && p1Choice.heroId && p1Choice.targetId && p2Choice.heroId && p2Choice.targetId) {
      if (battleTimer > 1) setBattleTimer(0);
      const timer = setTimeout(handleSequenceStart, 500);
      return () => clearTimeout(timer);
    }
  }, [p1Choice, p2Choice, battlePhase, view]);

  const handleSequenceStart = () => {
    if (gameMode === 'online-pvp' && !isHost) return;
    if (processingTurnRef.current) return;
    processingTurnRef.current = true; // Lock

    let finalP1 = { ...p1Choice };
    let finalP2 = { ...p2Choice };

    // Auto-select for P1 if missing
    if (!finalP1.heroId || !finalP1.targetId) {
      const aliveP1 = battleData.p1.filter(h => h.currentHp > 0);
      const aliveP2 = battleData.p2.filter(h => h.currentHp > 0);
      if (aliveP1.length > 0 && aliveP2.length > 0) {
        const h = aliveP1[Math.floor(Math.random() * aliveP1.length)];
        const p2FrontExists = aliveP2.some(x => x.pos === 'front' && !(x.statuses?.untargetable > 0));
        let legalTargets = aliveP2.filter(x => {
          if (x.pos === 'roam' || x.pos === 'front') return true;
          if (x.pos === 'back' && !p2FrontExists) return true;
          if (x.suppressedBy) return true;
          return false;
        });

        let validTargets = legalTargets.filter(x => !(x.statuses?.untargetable > 0));
        if (validTargets.length === 0) validTargets = legalTargets;

        const suppressedTargets = validTargets.filter(x => x.suppressedBy);
        const t = suppressedTargets.length > 0
          ? suppressedTargets[Math.floor(Math.random() * suppressedTargets.length)]
          : validTargets[Math.floor(Math.random() * validTargets.length)];

        finalP1 = { heroId: h.id, targetId: t.id };
        setP1Choice(finalP1);
      }
    }

    // Auto-select for P2 if missing (AFK Guest or AI fail)
    if (!finalP2.heroId || !finalP2.targetId) {
      const aliveP2 = battleData.p2.filter(h => h.currentHp > 0);
      const aliveP1 = battleData.p1.filter(h => h.currentHp > 0);
      if (aliveP2.length > 0 && aliveP1.length > 0) {
        const h = aliveP2[Math.floor(Math.random() * aliveP2.length)];
        const p1FrontExists = aliveP1.some(x => x.pos === 'front' && !(x.statuses?.untargetable > 0));
        let legalTargets = aliveP1.filter(x => {
          if (x.pos === 'roam' || x.pos === 'front') return true;
          if (x.pos === 'back' && !p1FrontExists) return true;
          if (x.suppressedBy) return true;
          return false;
        });

        let validTargets = legalTargets.filter(x => !(x.statuses?.untargetable > 0));
        if (validTargets.length === 0) validTargets = legalTargets;

        const suppressedTargets = validTargets.filter(x => x.suppressedBy);
        const t = suppressedTargets.length > 0
          ? suppressedTargets[Math.floor(Math.random() * suppressedTargets.length)]
          : validTargets[Math.floor(Math.random() * validTargets.length)];

        finalP2 = { heroId: h.id, targetId: t.id };
        setP2Choice(finalP2);
      }
    }

    setBattlePhase('SHOW_PICKS');
    if (conn) conn.send({ type: 'SYNC_PHASE', phase: 'SHOW_PICKS', timer: 0 });
    // Generate a unique seed for this round
    const seed = Math.floor(roundCount * 1000 + Math.random() * 9999);
    setTimeout(() => runActionSequence(finalP1, finalP2, seed), 1500);
  };

  const runActionSequence = async (computedP1, computedP2, seed) => {
    // Roll dice for P1
    const r1_first = Math.floor(Math.random() * 6) + 1;
    const p1Hero = battleData.p1.find(h => h.id === computedP1.heroId);
    let p1HasAbyssal = p1Hero?.hasAbyssalPower;

    // Roll dice for P2
    const r2_first = Math.floor(Math.random() * 6) + 1;
    const p2Hero = battleData.p2.find(h => h.id === computedP2.heroId);
    let p2HasAbyssal = p2Hero?.hasAbyssalPower;

    // If either player has Abyssal power, roll second dice and enter selection phase
    if (p1HasAbyssal || p2HasAbyssal) {
      const p1Rolls = p1HasAbyssal ? [r1_first, Math.floor(Math.random() * 6) + 1] : null;
      const p2Rolls = p2HasAbyssal ? [r2_first, Math.floor(Math.random() * 6) + 1] : null;

      if (conn) conn.send({ type: 'SYNC_ABYSSAL_DICE', dice: { p1: p1Rolls, p2: p2Rolls } });
      setAbyssalDice({ p1: p1Rolls, p2: p2Rolls });
      setAbyssalChoice({ p1: null, p2: null });
      setBattlePhase('ABYSSAL_CHOICE');
      setBattleTimer(10);

      if (p1Rolls) setBattleLog(prev => [...prev, `🎲 [深淵之力] P1 ${p1Hero.name} 擲出兩個骰子：${p1Rolls[0]} 和 ${p1Rolls[1]}，請選擇！`]);
      if (p2Rolls) setBattleLog(prev => [...prev, `🎲 [深淵之力] P2 ${p2Hero.name} 擲出兩個骰子：${p2Rolls[0]} 和 ${p2Rolls[1]}，請選擇！`]);

      // Store the choices and wait for selection
      window.pendingSequence = { computedP1, computedP2, r1_first, r2_first, seed };
      return;
    }

    // No Abyssal power, proceed normally
    if (gameMode === 'online-pvp' && isHost && conn) {
      conn.send({ type: 'RUN_SEQUENCE', r1: r1_first, r2: r2_first, c1: computedP1, c2: computedP2, seed });
    }
    executeSequence(r1_first, r2_first, computedP1, computedP2, seed);
  };

  // New function to continue after Abyssal dice selection
  const continueAfterAbyssalChoice = () => {
    const { computedP1, computedP2, r1_first, r2_first, seed } = window.pendingSequence;
    const p1Hero = battleData.p1.find(h => h.id === computedP1.heroId);
    const p2Hero = battleData.p2.find(h => h.id === computedP2.heroId);

    let finalR1 = r1_first;
    let finalR2 = r2_first;

    if (abyssalDice.p1 && abyssalChoice.p1 !== null) {
      finalR1 = abyssalDice.p1[abyssalChoice.p1];
      setBattleLog(prev => [...prev, `✅ P1 ${p1Hero.name} 選擇了骰子 ${finalR1}`]);
    }

    if (abyssalDice.p2 && abyssalChoice.p2 !== null) {
      finalR2 = abyssalDice.p2[abyssalChoice.p2];
      setBattleLog(prev => [...prev, `✅ P2 ${p2Hero.name} 選擇了骰子 ${finalR2}`]);
    }

    setAbyssalDice({ p1: null, p2: null });
    setAbyssalChoice({ p1: null, p2: null });

    if (gameMode === 'online-pvp' && isHost && conn) {
      conn.send({ type: 'RUN_SEQUENCE', r1: finalR1, r2: finalR2, c1: computedP1, c2: computedP2, seed });
    }
    executeSequence(finalR1, finalR2, computedP1, computedP2, seed);
  };

  const executeSequence = async (r1, r2, finalP1Choice, finalP2Choice, seed) => {
    setDiceResults({ p1: r1, p2: r2 });
    setBattlePhase('ACTION_ANIM');
    if (conn) conn.send({ type: 'SYNC_PHASE', phase: 'ACTION_ANIM' });

    let currentBattleData = JSON.parse(JSON.stringify(battleData));

    // Seeded Random Helper
    let s = seed || Math.random() * 10000;
    const prng = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const aliveAtStart = new Set([
      ...currentBattleData.p1.filter(h => h.currentHp > 0).map(h => h.id),
      ...currentBattleData.p2.filter(h => h.currentHp > 0).map(h => h.id)
    ]);

    const applyDamage = (victim, amount, vfxColor, isTrue = false, isReflected = false, attacker = null) => {
      if (!victim || victim.currentHp <= 0) return 0;
      if (victim.statuses?.untargetable > 0) return 0;
      if (victim.statuses?.invincible > 0 && !isTrue) return 0;

      let remaining = amount;
      let totalDealt = 0;

      if (victim.shield > 0 && !isTrue) {
        const absorbed = Math.min(victim.shield, remaining);
        victim.shield -= absorbed;
        remaining -= absorbed;
        totalDealt += absorbed;
        if (victim.shield <= 0) setBattleLog(prev => [...prev, `💥 ${victim.name} 的護盾破碎了！`]);
      }

      if (remaining > 0) {
        victim.currentHp -= remaining;
        totalDealt += remaining;

        // Mina Reflect Logic
        if (!isReflected && victim.id === 'mina' && victim.minaReflectMult > 0 && attacker && attacker.id !== victim.id) {
          const reflectDmg = Math.floor(remaining * victim.minaReflectMult);
          if (reflectDmg > 0) {
            setBattleLog(prev => [...prev, `😈 美娜觸發 [惡魔反甲]！回饋 ${attacker.name} ${reflectDmg} 點傷害！`]);
            applyDamage(attacker, reflectDmg, getVfxColor('abyssal-chaos'), true, true, victim);
          }
        }

        // Forest Counter-attack
        if (!isReflected && victim.hasForestCounter && remaining > 0 && attacker && attacker.id !== victim.id) {
          setBattleLog(prev => [...prev, `🌲 ${victim.name} 觸發 [森林之力]，反擊了 ${attacker.name} 1 點傷害！`]);
          applyDamage(attacker, 1, getVfxColor('afata'), true, true, victim);
        }

        // Mina Death Scythe
        if (victim.currentHp <= 0 && victim.id === 'mina' && !victim.minaPassiveUsed) {
          victim.currentHp = 1;
          victim.minaPassiveUsed = true;
          setBattleLog(prev => [...prev, `☠️ 美娜觸發 [死神鐮刀]：強行鎖血！死神已在她背後睜開雙眼...`]);
          triggerVfx(victim.id, 'dark');
        }

        triggerVfx(victim.id, 'damage', remaining);
      }

      triggerVfx(victim.id, vfxColor);
      return totalDealt;
    };

    try {
      const c1 = finalP1Choice || p1Choice;
      const c2 = finalP2Choice || p2Choice;

      setDiceResults({ p1: r1, p2: r2 });
      setBattlePhase('ACTION_ANIM');

      const aliveAtStart = new Set([
        ...currentBattleData.p1.filter(h => h.currentHp > 0).map(h => h.id),
        ...currentBattleData.p2.filter(h => h.currentHp > 0).map(h => h.id)
      ]);

      const applyInstantUlt = (pRoll, pChoice, playerNum) => {
        const team = playerNum === 1 ? currentBattleData.p1 : currentBattleData.p2;
        const actor = team.find(h => h.id === pChoice.heroId);
        if (!actor || actor.currentHp <= 0) return 'DONE';

        const action = actor.diceActions[pRoll];
        if (!action) return 'DONE'; // No action for this roll
        if (action.type !== 'ultimate') return 'DONE'; // Only instant ultimates here

        if (action.effect === 'INVINCIBLE_STUN') {
          actor.statuses.invincible = action.duration || 5;
          setBattleLog(prev => [...prev, `🛡️ [${action.name}]！${actor.name} 進入無敵姿態，任何攻擊都將受到制裁！`]);
        } else if (action.effect === 'BUFF_SPEED_INFINITY_3_TURNS') {
          actor.statuses.speed = 3;
          setBattleLog(prev => [...prev, `⚡ [${action.name}]！${actor.name} 速度突破極限，將進行 3 回合的瞬移閃避！`]);
        } else if (action.effect === 'HEAL_FULL') {
          actor.currentHp = actor.hp;
          setBattleLog(prev => [...prev, `❤️‍🔥 [${action.name}]！${actor.name} 生命力全面重燃，傷勢已完全復原！`]);
        } else if (action.effect === 'SILENCE_ALL') {
          const enemyTeam = playerNum === 1 ? currentBattleData.p2 : currentBattleData.p1;
          enemyTeam.forEach(e => { if (e.currentHp > 0) e.statuses.silenced = action.duration || 1; });
          setBattleLog(prev => [...prev, `🤐 [${action.name}]！${actor.name} 降下聖光沉默，禁錮了所有敵人的行動！`]);
        } else if (action.effect === 'BUFF_REGEN_3_5_TURNS') {
          actor.statuses.regen = 5;
          setBattleLog(prev => [...prev, `🔋 [${action.name}]！${actor.name} 鋼鐵意志燃燒，獲得持續生命恢復效果！`]);
        } else if (action.effect === 'LUMBURR_ULT') {
          actor.statuses.invincible = 1;
          actor.pendingShield = 8;
          setBattleLog(prev => [...prev, `⛰️ [${action.name}]！${actor.name} 解放大地之力，本回合絕對防禦且預備岩盾！`]);
        } else if (action.effect === 'MINA_REFLECT') {
          actor.minaReflectMult = (actor.minaReflectMult || 0) === 0 ? 1 : (actor.minaReflectMult * 2);
          setBattleLog(prev => [...prev, `[P${playerNum}] ${actor.name} 開啟 [${action.name}]！${actor.minaReflectMult > 1 ? '反擊加倍！' : ''}反傷效率：${actor.minaReflectMult * 100}%`]);
        } else if (action.effect === 'UNTARGETABLE_2_TURNS') {
          actor.statuses.untargetable = 2;
          actor.pendingUltDmg = action.value || 5;
          setBattleLog(prev => [...prev, `✨ [${action.name}]！${actor.name} 身影沒入虛空，進入 2 回合「不可選中」狀態！`]);
        } else if (action.effect === 'SUPPRESS_TARGET') {
          const isOwner = (gameMode === 'vs-ai' && playerNum === 1) || (gameMode === 'online-pvp' && ((isHost && playerNum === 1) || (!isHost && playerNum === 2)));
          const isOnline = gameMode === 'online-pvp';

          if (isOwner || isOnline) {
            setPendingUltSelection({ pId: playerNum, actorId: actor.id, action, currentBattleData });
            setBattlePhase('ULT_TARGETING');
            return 'PAUSE';
          } else {
            const enemyTeam = playerNum === 1 ? currentBattleData.p2 : currentBattleData.p1;
            // AI chooses target for suppression
            const tId = pChoice.targetId;
            const target = enemyTeam.find(e => e.id === tId) || enemyTeam.find(e => e.currentHp > 0 && !(e.statuses?.untargetable > 0));
            if (target && target.currentHp > 0) {
              const suppressDur = action.duration || 3;
              target.statuses.stunned = suppressDur;
              target.suppressedBy = actor.id;
              actor.statuses.stunned = suppressDur;
              actor.isChannelingSuppression = true;
              actor.suppressingTargetId = target.id;
              setBattleLog(prev => [...prev, `💀 [${action.name}]！${actor.name} 施放了不可逆轉的壓制，目標為 ${target.name}！`]);
            }
          }
        }
        return 'DONE';
      };

      async function playStep(playerNum, roll, choice, oppRoll, oppChoice) {
        const team = playerNum === 1 ? currentBattleData.p1 : currentBattleData.p2;
        const enemyTeam = playerNum === 1 ? currentBattleData.p2 : currentBattleData.p1;
        const actor = team.find(h => h.id === choice.heroId);
        const target = enemyTeam.find(h => h.id === choice.targetId) || enemyTeam.find(h => h.currentHp > 0);

        if (!actor || !aliveAtStart.has(actor.id)) return;

        const action = actor.diceActions[roll];
        if (!action) return;

        const oppActor = enemyTeam.find(h => h.id === oppChoice.heroId);
        let logHeader = `[P${playerNum}] ${actor.name} ➡️ ${target?.name || '敵人'}：`;

        return new Promise(resolve => {
          setTimeout(() => {
            try {
              if (actor.statuses?.untargetable > 0) {
                setBattleLog(prev => [...prev, `✨ ${actor.name} 處於不可選中狀態，影舞中...`]);
                resolve(); return;
              }
              if (actor.statuses?.stunned > 0) {
                setBattleLog(prev => [...prev, `😵 ${actor.name} 被控中，無法行動！`]);
                resolve(); return;
              }
              if (action.type === 'ultimate') {
                setSmashingHeroId(actor.id);
                setTimeout(() => setSmashingHeroId(null), 1500);
              }

              if (action.type === 'attack') {
                if (actor.id === 'nakroth') {
                  actor.statuses.speed = 1;
                  setBattleLog(prev => [...prev, `💫 ${actor.name} 獲得幻刃閃避！`]);
                }

                let canReact = target && target.statuses?.stunned === 0;
                let isEvaded = canReact && actor.statuses?.speed === 0 && (
                  (target.id === oppActor?.id && oppActor.diceActions[oppRoll]?.type === 'evade' && target.speed >= actor.speed) ||
                  (target.statuses?.speed > 0)
                );
                let isBlocked = canReact && !isEvaded && (
                  (target.id === oppActor?.id && oppActor.diceActions[oppRoll]?.type === 'block') ||
                  (target.statuses?.invincible > 0)
                );

                let hitAny = false;

                if (isEvaded) {
                  setBattleLog(prev => [...prev, `${logHeader}被躲過了！`]);
                  setEvadingHeroes([target.id]);
                  setTimeout(() => setEvadingHeroes([]), 1000);

                  // Raz Evade Logic: Roll again
                  if (target.id === 'raz' && target.id === oppActor?.id && (oppChoice.diceActions[oppRoll]?.effect === 'EVADE_AGAIN')) {
                    const razPlayerNum = playerNum === 1 ? 2 : 1;
                    const razChoice = razPlayerNum === 1 ? c1 : c2;
                    const opponentChoice = razPlayerNum === 1 ? c2 : c1;
                    const extraRoll = Math.floor(prng() * 6) + 1;
                    setBattleLog(prev => [...prev, `🔥 [${target.name}] 閃避成功，鬥志高昂！再次發動突襲！`]);
                    setBattleData(JSON.parse(JSON.stringify(currentBattleData))); // Update UI for the log/vfx

                    setTimeout(async () => {
                      setDiceResults(prev => ({ ...prev, [razPlayerNum === 1 ? 'p1' : 'p2']: extraRoll }));
                      await playStep(razPlayerNum, extraRoll, razChoice, oppRoll, opponentChoice);
                      resolve();
                    }, 1200);
                    return;
                  }
                } else if (isBlocked) {
                  setBattleLog(prev => [...prev, `${logHeader}攻擊被擋下了！`]);
                  triggerVfx(target.id, 'shield');
                } else if (target) {
                  let dmg = action.value || 1;

                  // He Passive
                  if (actor.id === 'he' && [1, 2, 3].includes(roll)) {
                    if (prng() > 0.5) {
                      if (!target.statuses?.superArmor) {
                        target.statuses.stunned = Math.max(target.statuses.stunned || 0, 1);
                        setBattleLog(prev => [...prev, `❄️ 赫：霜寒！`]);
                      }
                    } else {
                      actor.statuses.superArmor = 1;
                      setBattleLog(prev => [...prev, `🔥 赫：熾焰！`]);
                    }
                  }

                  // Errol Blood Shura Stun
                  if (actor.id === 'errol' && actor.minaErrolBond) {
                    const partner = team.find(h => h.id === 'mina');
                    if (partner && partner.currentHp <= 0) {
                      dmg += 1;
                      if (!target.statuses?.superArmor) {
                        target.statuses.stunned = Math.max(target.statuses.stunned || 0, 1);
                        setBattleLog(prev => [...prev, `💀 埃羅魂魄受損，進入「血煞修羅」，攻擊附帶擊暈！`]);
                      }
                    }
                  }

                  // Tara Intent
                  if (actor.id === 'tara') {
                    const lost = (actor.hp || 14) - Math.max(0, actor.currentHp);
                    const bonus = Math.floor(lost / 2);
                    if (bonus > 0) {
                      dmg += bonus;
                      setBattleLog(prev => [...prev, `🔥 塔拉戰意狂湧，額外造成 ${bonus} 點傷害！`]);
                    }
                  }

                  const actualDmg = applyDamage(target, dmg, getVfxColor(actor.factionId), false, false, actor);
                  if (actualDmg > 0) {
                    hitAny = true;
                    setBattleLog(prev => [...prev, `${logHeader}施展 [${action.name}]，造成 ${actualDmg} 點傷害！`]);
                  } else if (target.statuses?.untargetable > 0) {
                    setBattleLog(prev => [...prev, `${logHeader}捕捉不到 ${target.name} 的真身，攻擊落空了！`]);
                  } else if (target.statuses?.invincible > 0) {
                    setBattleLog(prev => [...prev, `${logHeader}命中 ${target.name} 但被其絕對防禦無視！`]);
                  }
                }
              } else if (action.type === 'ultimate') {
                const skillName = action.name || "大招";

                if (action.effect === 'UNTARGETABLE_2_TURNS') {
                  setBattleLog(prev => [...prev, `${logHeader}施展 [${skillName}]！沒入影縫。`]);
                  hitAny = true;
                } else if (action.effect === 'INVINCIBLE_STUN') {
                  setBattleLog(prev => [...prev, `${logHeader}開啟大招 [${skillName}]，進入無敵姿態，反擊一切挑釁！`]);
                  triggerVfx(actor.id, 'light');
                  hitAny = true;
                } else if (action.effect === 'AGAIN_ACTION') {
                  if (target) {
                    target.statuses.stunned = 1;
                    setBattleLog(prev => [...prev, `${logHeader}施展 [${skillName}] 擊暈敵人！格擋無效，拉茲鬥魂燃燒準備連擊！`]);
                    triggerVfx(target.id, 'stun');
                    setBattleData(JSON.parse(JSON.stringify(currentBattleData))); // Update UI for the stun

                    const extraRoll = Math.floor(prng() * 6) + 1;
                    setTimeout(async () => {
                      setDiceResults(prev => ({ ...prev, [playerNum === 1 ? 'p1' : 'p2']: extraRoll }));
                      await playStep(playerNum, extraRoll, choice, oppRoll, oppChoice);
                      resolve();
                    }, 1200);
                    return;
                  }
                } else if (action.target === 'all') {
                  enemyTeam.forEach(e => {
                    let fDmg = action.value || 0;
                    if (fDmg > 0) {
                      if (actor.id === 'errol' && actor.minaErrolBond) {
                        const partner = team.find(h => h.id === 'mina');
                        if (partner && partner.currentHp <= 0) {
                          fDmg += 1;
                          if (!e.statuses?.superArmor) e.statuses.stunned = Math.max(e.statuses.stunned || 0, 1);
                        }
                      }
                      const actualDmg = applyDamage(e, fDmg, getVfxColor(actor.factionId), action.effect === 'TRUE_DAMAGE_ALL', false, actor);
                      if (actualDmg > 0) hitAny = true;
                    }
                  });
                  setBattleLog(prev => [...prev, `${logHeader}大招 [${skillName}] 掃蕩全場！`]);
                } else if (target && action.value > 0) {
                  let fDmg = action.value;
                  if (actor.id === 'errol' && actor.minaErrolBond) {
                    const partner = team.find(h => h.id === 'mina');
                    if (partner && partner.currentHp <= 0) {
                      fDmg += 1;
                      if (!target.statuses?.superArmor) target.statuses.stunned = Math.max(target.statuses.stunned || 0, 1);
                    }
                  }
                  if (actor.id === 'tara') fDmg += Math.floor(((actor.hp || 14) - actor.currentHp) / 2);
                  const totalDmgDealt = applyDamage(target, fDmg, getVfxColor(actor.factionId), false, false, actor);
                  if (totalDmgDealt > 0) {
                    setBattleLog(prev => [...prev, `${logHeader}施展大招 [${skillName}]，造成 ${totalDmgDealt} 點傷害！`]);
                    hitAny = true;
                  } else if (target?.statuses?.untargetable > 0) {
                    setBattleLog(prev => [...prev, `${logHeader}大招完全揮空，${target.name} 根本不在這片空間！`]);
                  }
                } else {
                  setBattleLog(prev => [...prev, `${logHeader}施放了大招 [${skillName}]！`]);
                }
              } else if (action.type === 'evade') {
                setBattleLog(prev => [...prev, `${logHeader}採取了閃避姿態`]);
              } else if (action.type === 'block') {
                setBattleLog(prev => [...prev, `${logHeader}採取了格擋姿態`]);
              } else if (action.type === 'heal') {
                const healAmt = action.value || 0;
                const oldHp = actor.currentHp;
                actor.currentHp = Math.min(actor.hp, actor.currentHp + healAmt);
                setBattleLog(prev => [...prev, `${logHeader}使用 [${action.name}] 治療自己，回復了 ${actor.currentHp - oldHp} 點生命。`]);
              }

              if (hitAny && actor.id === 'ryoma') {
                actor.hp += 1; actor.currentHp += 1; actor.speed = (actor.speed || 0) + 1;
                Object.keys(actor.diceActions).forEach(k => {
                  const act = actor.diceActions[k];
                  if (act.value !== undefined) act.value += 1;
                  if (act.heal !== undefined) act.heal += 1;
                });
                setBattleLog(prev => [...prev, `✨ 龍馬觸發 [刀訣]：全數值成長！`]);
              }

              setBattleData(JSON.parse(JSON.stringify(currentBattleData)));
              setTimeout(resolve, 1500);
            } catch (err) {
              console.error(err);
              resolve();
            }
          }, 500);
        });
      }

      function processEndOfRoundEffects(team) {
        team.forEach(h => {
          if (h.pendingShield > 0 && h.currentHp > 0) {
            h.shield = h.pendingShield; h.pendingShield = 0;
            setBattleLog(prev => [...prev, `💎 ${h.name} 獲得護盾！`]);
          }
          if (h.statuses.regen > 0) {
            const prevHp = h.currentHp;
            h.currentHp = Math.min(h.hp, h.currentHp + 3);
            if (h.currentHp > prevHp) setBattleLog(prev => [...prev, `💚 ${h.name} 持續回復。`]);
            h.statuses.regen--;
          }
          if (h.statuses.untargetable > 0) {
            h.statuses.untargetable--;
            if (h.statuses.untargetable === 0 && h.pendingUltDmg) {
              setBattleLog(prev => [...prev, `⚔️ ${h.name} 現身施放 [流光斬]！`]);
              const enemyTeam = currentBattleData.p1.find(x => x.id === h.id) ? currentBattleData.p2 : currentBattleData.p1;
              enemyTeam.forEach(e => {
                const d = applyDamage(e, h.pendingUltDmg, getVfxColor(h.factionId), true, false, h);
                setBattleLog(prev => [...prev, `💥 [落日斬] 對 ${e.name} 造成 ${d} 點傷害。`]);
              });
              h.pendingUltDmg = 0;
            }
          }
          if (h.statuses.silenced > 0) h.statuses.silenced--;
          if (h.statuses.invincible > 0) h.statuses.invincible--;
          if (h.statuses.speed > 0) h.statuses.speed--;
          if (h.statuses.superArmor > 0) h.statuses.superArmor--;
          if (h.statuses.stunned > 0) h.statuses.stunned--;
        });
      }

      async function finalizeSequence() {
        await playStep(1, r1, c1, r2, c2);
        await playStep(2, r2, c2, r1, c1);
        processEndOfRoundEffects(currentBattleData.p1);
        processEndOfRoundEffects(currentBattleData.p2);
        setBattleData(JSON.parse(JSON.stringify(currentBattleData)));
        setBattlePhase('RESOLUTION');

        const p1Dead = currentBattleData.p1.every(h => h.currentHp <= 0);
        const p2Dead = currentBattleData.p2.every(h => h.currentHp <= 0);
        if (p1Dead || p2Dead) {
          setTimeout(() => {
            const res = p1Dead && p2Dead ? 'DRAW' : (p1Dead ? 'DEFEAT' : 'VICTORY');
            const survivors = currentBattleData.p1.filter(h => h.currentHp > 0).length;
            setGameResult(res);
            processRewards(res, survivors, prng);
            setShowResultOverlay(true);
          }, 1000);
        } else {
          setTimeout(nextTurnLogic, 1500);
        }
      }

      const r1Ret = applyInstantUlt(r1, c1, 1);
      if (r1Ret === 'PAUSE') {
        window.pendingSequenceResume = (latest) => { currentBattleData = latest; const r2Ret = applyInstantUlt(r2, c2, 2); if (r2Ret !== 'PAUSE') finalizeSequence(); };
        return;
      }
      const r2Ret = applyInstantUlt(r2, c2, 2);
      if (r2Ret === 'PAUSE') {
        window.pendingSequenceResume = (latest) => { currentBattleData = latest; finalizeSequence(); };
        return;
      }
      finalizeSequence();

    } catch (err) {
      console.error("Execution Error:", err);
      processingTurnRef.current = false; // Safety unlock
      setBattlePhase('RESOLUTION');
    }
  };

  const processRewards = (result, survivors, prngFunc) => {
    if (!currentUser) return;

    let rewardAmount = 0;
    if (gameMode !== 'online-pvp') {
      rewardAmount = 10; // Fixed 10 for local play
    } else {
      if (result === 'DEFEAT') rewardAmount = 10;
      else if (result === 'DRAW') rewardAmount = 50;
      else if (result === 'VICTORY') {
        if (survivors === 1) rewardAmount = 100;
        else if (survivors === 2) rewardAmount = 200;
        else if (survivors === 3) rewardAmount = 500;
        else rewardAmount = 50;
      }
    }

    const currencies = ['holyPearl', 'magicCore', 'leaf', 'goldCoin'];
    const rnd = prngFunc ? prngFunc() : Math.random();
    const selectedCurrency = currencies[Math.floor(rnd * currencies.length)];
    const names = { holyPearl: '聖珠', magicCore: '魔核', leaf: '影葉', goldCoin: '金幣' };

    setBattleLog(prev => [...prev, `🏅 戰績結算：${result === 'VICTORY' ? '勝利' : (result === 'DRAW' ? '平局' : '戰敗')}！獲得 ${rewardAmount} ${names[selectedCurrency]}。`]);

    const updatedUser = { ...currentUser };
    updatedUser[selectedCurrency] = (updatedUser[selectedCurrency] || 0) + rewardAmount;

    setCurrentUser(updatedUser);
    localStorage.setItem('ayiseno_user', JSON.stringify(updatedUser));

    // 同步到雲端 Supabase
    supabase.from('users')
      .update(updatedUser)
      .eq('account', updatedUser.account)
      .then(({ error }) => {
        if (error) console.error("Cloud Sync fail:", error);
      });
  };

  const getVfxColor = (fid) => {
    const map = { 'ronin': 'slash', 'temple-of-light': 'light', 'abyssal-chaos': 'dark', 'afata': 'forest' };
    return map[fid] || 'slash';
  };

  const triggerVfx = (id, type, value = 0) => {
    setActiveVfx(prev => ({ ...prev, [id]: { type, value } }));
    setTimeout(() => setActiveVfx(prev => { const n = { ...prev }; delete n[id]; return n; }), 2000);
  };



  const handleRestart = () => {
    setView('lobby');
    setGameResult(null);
    setShowResultOverlay(false);
    setP1Team({ front: null, roam: null, back: null });
    setP2Team({ front: null, roam: null, back: null });
    processingTurnRef.current = false; // Reset lock
  };

  const logEndRef = useRef(null);
  useEffect(() => {
    if (view === 'battle') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleLog, view]);

  const renderBattle = () => {
    if (!battleData) return null;

    const renderTeam = (team, isP1) => {
      // Logic for grid placement based on position
      const posMap = { front: 0, roam: 1, back: 2 };
      const sorted = [...team].sort((a, b) => posMap[a.pos] - posMap[b.pos]);

      return sorted.map(h => (
        <HeroCard
          key={h.id} hero={h} factionId={h.factionId} isInBattle={true} hp={h.currentHp}
          isTargeted={(gameMode === 'online-pvp' && !isHost) ? (p2Choice.targetId === h.id) : (p1Choice.targetId === h.id)}
          isSelected={(gameMode === 'online-pvp' && !isHost) ? (p2Choice.heroId === h.id) : (p1Choice.heroId === h.id)}
          activeVfx={activeVfx[h.id]} isEvading={evadingHeroes.includes(h.id)}
          isSmashing={smashingHeroId === h.id}
          statuses={h.statuses}
          shield={h.shield}
          onClick={() => {
            if (battlePhase === 'ULT_TARGETING' && !isP1) {
              // Manual Selection logic
              if (pendingUltSelection) {
                const { pId, actorId, action, currentBattleData: draftBD } = pendingUltSelection;
                const isMyTurnToPick = (gameMode === 'online-pvp' && ((isHost && pId === 1) || (!isHost && pId === 2))) || (gameMode !== 'online-pvp' && pId === 1);
                if (!isMyTurnToPick && gameMode === 'online-pvp') return;
                // Use the draft from the sequence, NOT the stale battleData state
                const currentBattleData = JSON.parse(JSON.stringify(draftBD || battleData));
                const team = pId === 1 ? currentBattleData.p1 : currentBattleData.p2;
                const actor = team.find(x => x.id === actorId);
                const enemyTeam = pId === 1 ? currentBattleData.p2 : currentBattleData.p1;
                const target = enemyTeam.find(x => x.id === h.id);

                if (target && target.currentHp > 0) {
                  const suppressDur = action.duration || 3;
                  target.statuses.stunned = suppressDur;
                  target.suppressedBy = actor.id;
                  actor.statuses.stunned = suppressDur;
                  actor.isChannelingSuppression = true;
                  actor.suppressingTargetId = target.id;

                  setBattleLog(prev => [...prev, `💀 [${action.name}]！${actor.name} 手動選擇壓制了 ${target.name}！`]);
                  setBattleData(JSON.parse(JSON.stringify(currentBattleData)));
                  setPendingUltSelection(null);
                  setBattlePhase('ACTION_ANIM');

                  if (window.pendingSequenceResume) {
                    if (gameMode === 'online-pvp' && conn) {
                      conn.send({ type: 'SYNC_ULT_TARGET', targetId: target.id });
                    }
                    window.pendingSequenceResume(currentBattleData);
                    window.pendingSequenceResume = null;
                  }
                }
              }
              return;
            }

            if (battlePhase !== 'CHOOSE') return;

            // Online Logic
            if (gameMode === 'online-pvp') {
              // I am Host (P1)
              if (isHost && isP1) {
                // Select Own Hero
                if (h.statuses?.stunned > 0) {
                  const reason = h.suppressedBy ? "被壓制中" : "異常狀態中";
                  setBattleLog(prev => [...prev, `❌ ${h.name} ${reason}，本回合無法作為行動角色！`]);
                  return;
                }
                setP1Choice(prev => ({ ...prev, heroId: h.id }));
                conn.send({ type: 'SYNC_CHOICE', heroId: h.id });
              }
              // I am Host (P1) picking Enemy (P2)
              else if (isHost && !isP1) {
                // Must have hero selected first
                if (!p1Choice.heroId) return;

                // Target Protection Logic for Online Host
                const attacker = battleData.p1.find(x => x.id === p1Choice.heroId);
                const canBypass = attacker?.passive?.name === '幻刃';
                const isSuppressed = h.suppressedBy;
                const frontAlive = team.some(th => th.pos === 'front' && th.currentHp > 0 && !(th.statuses?.untargetable > 0));

                if (h.statuses?.untargetable > 0) {
                  setBattleLog(prev => [...prev, `🚫 ${h.name} 目前處於「不可選中」狀態，無法被鎖定！`]);
                  return;
                }

                if (frontAlive && h.pos === 'back' && !canBypass && !isSuppressed) {
                  setBattleLog(prev => [...prev, "⚠️ 後排被前排英雄護衛中，無法被當成直接攻擊的目標！"]);
                  return;
                } else if (isSuppressed && h.pos === 'back' && !canBypass) {
                  setBattleLog(prev => [...prev, `🎯 ${h.name} 正被壓制中，護衛失效！隊友可直接發動攻擊！`]);
                }

                setP1Choice(prev => ({ ...prev, targetId: h.id }));
                conn.send({ type: 'SYNC_CHOICE', heroId: p1Choice.heroId, targetId: h.id });
              }
              // I am Guest (P2)
              else if (!isHost && !isP1) {
                // Select Own Hero (Guest is P2)
                if (h.statuses?.stunned > 0) {
                  const reason = h.suppressedBy ? "被壓制中" : "異常狀態中";
                  setBattleLog(prev => [...prev, `❌ ${h.name} ${reason}，本回合無法作為行動角色！`]);
                  return;
                }
                setP2Choice(prev => ({ ...prev, heroId: h.id }));
                conn.send({ type: 'SYNC_CHOICE', heroId: h.id });
              }
              // I am Guest (P2) picking Enemy (P1)
              else if (!isHost && isP1) {
                // Must have hero selected first
                if (!p2Choice.heroId) return;

                // Target Protection Logic for Online Guest
                const attacker = battleData.p2.find(x => x.id === p2Choice.heroId);
                const canBypass = attacker?.passive?.name === '幻刃';
                const isSuppressed = h.suppressedBy;
                const frontAlive = team.some(th => th.pos === 'front' && th.currentHp > 0 && !(th.statuses?.untargetable > 0));

                if (h.statuses?.untargetable > 0) {
                  setBattleLog(prev => [...prev, `🚫 ${h.name} 目前處於「不可選中」狀態，無法被鎖定！`]);
                  return;
                }

                if (frontAlive && h.pos === 'back' && !canBypass && !isSuppressed) {
                  setBattleLog(prev => [...prev, "⚠️ 後排被前排英雄護衛中，無法被當成直接攻擊的目標！"]);
                  return;
                } else if (isSuppressed && h.pos === 'back' && !canBypass) {
                  setBattleLog(prev => [...prev, `🎯 ${h.name} 正被壓制中，護衛失效！隊友可直接發動攻擊！`]);
                }

                setP2Choice(prev => ({ ...prev, targetId: h.id }));
                conn.send({ type: 'SYNC_CHOICE', heroId: p2Choice.heroId, targetId: h.id });
              }
              return;
            }

            // Local Logic (Legacy/AI)
            if (isP1) {
              if (h.statuses?.stunned > 0) {
                const reason = h.suppressedBy ? "被壓制中" : "異常狀態中";
                setBattleLog(prev => [...prev, `❌ ${h.name} ${reason}，本回合無法作為行動角色！`]);
                return;
              }
              setP1Choice(prev => ({ ...prev, heroId: h.id }));
            } else {
              // Target Protection Logic
              const attacker = battleData.p1.find(x => x.id === p1Choice.heroId);
              const canBypass = attacker?.passive?.name === '幻刃';
              const isSuppressed = h.suppressedBy;
              const frontAlive = team.some(th => th.pos === 'front' && th.currentHp > 0 && !(th.statuses?.untargetable > 0));
              const isUntargetable = h.statuses?.untargetable > 0;

              if (isUntargetable) {
                setBattleLog(prev => [...prev, `🚫 ${h.name} 目前處於「不可選中」狀態，無法被鎖定！`]);
                return;
              }

              if (frontAlive && h.pos === 'back' && !canBypass && !isSuppressed) {
                setBattleLog(prev => [...prev, "⚠️ 後排被前排英雄護衛中，無法被當成直接攻擊的目標！"]);
                return;
              } else if (canBypass && frontAlive && h.pos === 'back') {
                setBattleLog(prev => [...prev, `💨 ${attacker.name} 發動 [${attacker.passive.name}]，切入敵方後排！`]);
              } else if (isSuppressed && h.pos === 'back' && !canBypass) {
                setBattleLog(prev => [...prev, `🎯 ${h.name} 正被壓制中，護衛失效！隊友可直接發動攻擊！`]);
              }
              setP1Choice(prev => ({ ...prev, targetId: h.id }));
            }
          }}
        />
      ));
    };

    return (
      <div className="battle-scene positional">
        {showResultOverlay && (
          <div className="result-overlay">
            <h1 className={`result-text ${gameResult?.toLowerCase()}-text animate-zoom`}>
              {gameResult === 'VICTORY' ? 'Victory' : gameResult === 'DEFEAT' ? 'Defeat' : 'Draw'}
            </h1>
            <p className="result-subtitle">
              {gameResult === 'VICTORY' && "榮耀歸於艾森諾，世界終將迎來黎明。"}
              {gameResult === 'DEFEAT' && "艾森諾似乎陷入了沉睡。"}
              {gameResult === 'DRAW' && "真是一場勢均力敵的酣戰。"}
            </p>
            <div className="result-actions">
              <button className="restart-btn" onClick={handleRestart}>返回大廳</button>
              <button className="view-battle-btn" onClick={() => setShowResultOverlay(false)}>查看戰場</button>
            </div>
          </div>
        )}

        {!showResultOverlay && gameResult && (
          <button className="inspect-mode-back" onClick={() => setShowResultOverlay(true)}>
            查看結算介面
          </button>
        )}

        {/* Emergency Force Next Turn Button (Visible for Host or Local Player) */}
        {(isHost || gameMode !== 'online-pvp') && battleTimer === 0 && battlePhase === 'CHOOSE' && (
          <button
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, background: 'red', color: 'white' }}
            onClick={() => {
              processingTurnRef.current = false;
              handleSequenceStart();
            }}
          >
            ⚠️ 強制下一回合 (卡住時點擊)
          </button>
        )}

        <div className="enemy-side-wrap">
          <div className="battle-team-positional">
            {/* 
               Enemy Side (Top):
               If Online Guest (!isHost): Enemy is P1.
               If Host OR Local: Enemy is P2.
            */}
            {(gameMode === 'online-pvp' && !isHost) ? renderTeam(battleData.p1, true) : renderTeam(battleData.p2, false)}
          </div>
        </div>

        <div className="battle-center">
          {battlePhase === 'ULT_TARGETING' && (
            <div className="abyssal-choice-container">
              {pendingUltSelection && (
                ((gameMode === 'online-pvp' && ((isHost && pendingUltSelection.pId === 1) || (!isHost && pendingUltSelection.pId === 2))) || (gameMode !== 'online-pvp' && pendingUltSelection.pId === 1)) ? (
                  <>
                    <h3 className="abyssal-title animate-bounce">💀 請選擇一位壓制目標</h3>
                    <p style={{ color: '#fff', opacity: 0.8 }}>阿萊斯特 釋放了「零度奇點」！</p>
                  </>
                ) : (
                  <>
                    <h3 className="abyssal-title">⏳ 等待對手選擇壓制目標...</h3>
                    <p style={{ color: '#fff', opacity: 0.6 }}>阿萊斯特 正在引導零度奇點</p>
                  </>
                )
              )}
            </div>
          )}
          {battlePhase === 'ABYSSAL_CHOICE' && (
            <div className="abyssal-choice-container">
              <div className="timer-circle">{battleTimer}</div>
              <h3 className="abyssal-title">🔮 深淵之力：選擇骰子</h3>

              {abyssalDice.p1 && (gameMode !== 'online-pvp' || isHost) && (
                <div className="dice-choice-row">
                  <span className="player-label">P1 選擇：</span>
                  <div className="dice-options">
                    {abyssalDice.p1.map((value, idx) => (
                      <div
                        key={idx}
                        className={`dice-option ${abyssalChoice.p1 === idx ? 'selected' : ''}`}
                        onClick={() => setAbyssalChoice(prev => ({ ...prev, p1: idx }))}
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {abyssalDice.p2 && (gameMode !== 'online-pvp' || !isHost) && gameMode !== 'vs-ai' && (
                <div className="dice-choice-row">
                  <span className="player-label">P2 選擇：</span>
                  <div className="dice-options">
                    {abyssalDice.p2.map((value, idx) => (
                      <div
                        key={idx}
                        className={`dice-option ${abyssalChoice.p2 === idx ? 'selected' : ''}`}
                        onClick={() => setAbyssalChoice(prev => ({ ...prev, p2: idx }))}
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {battlePhase === 'CHOOSE' && (
            <div className="turn-indicator">
              <div className="timer-circle">{battleTimer}</div>
              <p>
                {/* Status Indicator Logic:
                    Online Guest: Show P2 (Self) and P1 (Enemy) status.
                    Host/Local: Show P1 (Self) and P2 (Enemy) status.
                */}
                {(gameMode === 'online-pvp' && !isHost)
                  ? (p2Choice.heroId ? '✅ 英雄就緒' : '👉 請選擇己方英雄')
                  : (p1Choice.heroId ? '✅ 英雄就緒' : '👉 請選擇己方英雄')}
                |
                {(gameMode === 'online-pvp' && !isHost)
                  ? (p2Choice.targetId ? '✅ 目標已定' : '🎯 請選擇敵方目標')
                  : (p1Choice.targetId ? '✅ 目標已定' : '🎯 請選擇敵方目標')}
              </p>
            </div>
          )}

          {battlePhase !== 'CHOOSE' && (
            <div className="dice-display-area">
              {/* Dice Logic: 
                  If Guest: Left=Self(P2), Right=Enemy(P1).
                  If Host/Local: Left=Self(P1), Right=Enemy(P2).
              */}
              {(gameMode === 'online-pvp' && !isHost) ? (
                <>
                  <div className={`dice p2-dice ${battlePhase === 'SHOW_PICKS' ? 'rolling' : ''}`}>{diceResults.p2 || '?'}</div>
                  <div className="vs-text">VS</div>
                  <div className={`dice p1-dice ${battlePhase === 'SHOW_PICKS' ? 'rolling' : ''}`}>{diceResults.p1 || '?'}</div>
                </>
              ) : (
                <>
                  <div className={`dice p1-dice ${battlePhase === 'SHOW_PICKS' ? 'rolling' : ''}`}>{diceResults.p1 || '?'}</div>
                  <div className="vs-text">VS</div>
                  <div className={`dice p2-dice ${battlePhase === 'SHOW_PICKS' ? 'rolling' : ''}`}>{diceResults.p2 || '?'}</div>
                </>
              )}
            </div>
          )}

          <div className="battle-log">
            {battleLog.map((log, i) => <p key={i}>{log}</p>)}
            <div ref={logEndRef} />
          </div>

          {battlePhase === 'PRE_ROUND' && (
            <div className="countdown-mini-wrap animate-pulse">
              <span className="count-num">{battleTimer} </span>
              <span className="count-text">下一回合準備開始...</span>
            </div>
          )}
        </div>

        <div className="player-side-wrap">
          <div className="battle-team-positional">
            {/* 
               Player Side (Bottom):
               If Online Guest (!isHost): I am P2.
               If Host OR Local: I am P1.
            */}
            {(gameMode === 'online-pvp' && !isHost) ? renderTeam(battleData.p2, false) : renderTeam(battleData.p1, true)}
          </div>
        </div>
      </div>
    );
  };

  const renderSelection = () => {
    const isSelectionComplete = getTeamSize(p1Team) === 3 && getTeamSize(p2Team) === 3;
    const slots = [
      { id: 'front', label: '前排' },
      { id: 'roam', label: '遊走' },
      { id: 'back', label: '後排' }
    ];

    const handlePick = (hero, factionId) => {
      const pId = currentPicker;
      const pos = activeSelectPos[pId === 1 ? 'p1' : 'p2'];
      const team = pId === 1 ? p1Team : p2Team;
      const setTeam = pId === 1 ? setP1Team : setP2Team;

      // Online Restriction
      if (gameMode === 'online-pvp') {
        if (isHost && pId !== 1) return; // Host acts as P1
        if (!isHost && pId !== 2) return; // Guest acts as P2
      }

      if (team[pos]) return; // Occupied

      const heroWithFaction = { ...hero, factionId: factionId };
      const nextTeam = { ...team, [pos]: heroWithFaction };
      setTeam(nextTeam);

      let nextPick = pId;
      if (gameMode === 'pvp') {
        if (getTeamSize(pId === 1 ? p2Team : p1Team) < 3) nextPick = (pId === 1 ? 2 : 1);
      } else if (gameMode === 'online-pvp') {
        // Online: Host is P1, Guest is P2. Alternate turns.
        // If I am P1, next is 2. If I am P2, next is 1.
        nextPick = (pId === 1 ? 2 : 1);
      } else {
        if (pId === 1) nextPick = 2;
      }

      setCurrentPicker(nextPick);

      if (conn) {
        conn.send({ type: 'SYNC_PICK', team: nextTeam, pId, nextPicker: nextPick });
      }
    };


    return (
      <div className="selection-view">
        {gameMode === 'online-pvp' && (
          <div className="online-status-bar glass-panel">
            <span>連線狀態: {connectionStatus}</span>
            {isHost ? <span> | 我的代碼: <b>{myId}</b></span> : <span> | 已連入主機</span>}
          </div>
        )}
        <div className="selection-header-positional">
          <div className={`side p1 ${currentPicker === 1 ? 'active' : ''}`}>
            <h3>P1 陣容配置</h3>
            <div className="pos-slots">
              {slots.map(s => (
                <div
                  key={s.id}
                  className={`slot-box glass-panel ${activeSelectPos.p1 === s.id ? 'active' : ''} ${p1Team[s.id] ? 'filled' : ''}`}
                  onClick={() => currentPicker === 1 && setActiveSelectPos(prev => ({ ...prev, p1: s.id }))}
                >
                  <span className="slot-label">{s.label}</span>
                  {p1Team[s.id] && <img src={p1Team[s.id].image} alt="" />}
                </div>
              ))}
            </div>
          </div>

          <div className="mid-status">
            <div className="vs-badge">VS</div>
            {isSelectionComplete && (gameMode !== 'online-pvp' || isHost) && (
              <button className="start-battle-btn" onClick={startBattle}>啟動艾森諾對決</button>
            )}
          </div>

          <div className={`side p2 ${currentPicker === 2 ? 'active' : ''}`}>
            <h3>{gameMode === 'vs-ai' ? '🤖 AI 配置' : 'P2 陣容配置'}</h3>
            <div className="pos-slots">
              {slots.map(s => (
                <div
                  key={s.id}
                  className={`slot-box glass-panel ${activeSelectPos.p2 === s.id ? 'active' : ''} ${p2Team[s.id] ? 'filled' : ''}`}
                  onClick={() => currentPicker === 2 && gameMode !== 'vs-ai' && setActiveSelectPos(prev => ({ ...prev, p2: s.id }))}
                >
                  <span className="slot-label">{s.label}</span>
                  {p2Team[s.id] && <img src={p2Team[s.id].image} alt="" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="selection-pick-area">
          <div className="pick-hint">當前輪到：{currentPicker === 1 ? 'P1' : 'P2'} 選擇 【{slots.find(s => s.id === activeSelectPos[currentPicker === 1 ? 'p1' : 'p2'])?.label}】</div>
          {isSelectionComplete && (gameMode !== 'online-pvp' || isHost) && (
            <button className="start-battle-btn animate-zoom" onClick={startBattle}>⚔️ 開戰 ⚔️</button>
          )}
          {factions.map(faction => (
            <div key={faction.id} className="faction-pick-group">
              <h3 className={`faction-pick-title faction-border-${faction.id}`}>{faction.name}</h3>
              <div className="hero-pick-grid">
                {faction.heroes.map(h => {
                  const picked = Object.values(p1Team).find(x => x?.id === h.id) || Object.values(p2Team).find(x => x?.id === h.id);
                  return (
                    <div
                      key={h.id}
                      className={`pick-card glass-panel ${faction.id} ${picked ? 'selected' : ''}`}
                      onClick={() => !picked && (currentPicker === 1 || gameMode !== 'vs-ai') && handlePick(h, faction.id)}
                    >
                      <img
                        src={h.image}
                        alt=""
                        style={{ objectPosition: h.imageSettings?.objectPosition || 'center center' }}
                      />
                      <div className="pick-card-info"><h4>{h.name}</h4></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button className="back-btn" onClick={() => setView('lobby')}>退出對局</button>
      </div>
    );
  };

  const renderChangelog = () => {
    const changes = [
      {
        version: "第二章：英雄集結 (Hero Assembly)",
        date: "2026-02-13 最終更新",
        items: [
          "[新英雄降臨] 🥊 拳王「拉茲」加入浪人武士！擁有極限 Speed 9 但生命值僅有 1，完美的走位與致命的連招是他生存的唯一方式。",
          "[機制更新] 🔄 連擊系統：拉茲施展大招或閃避成功後，可立即獲得額外行動機會，打破回合制束縛！",
          "[新英雄降臨] 🗡️ 孤俠「赫」加入浪人武士！大招「瞬影．流光斬」與全新機制「不可選中」震撼登場。",
          "[被動覺醒] ❄️🔥 赫專屬被動「雙華逆鱗」：攻擊時隨機釋放 [霜寒] (暈眩) 或 [熾焰] (霸體)。",
          "[新英雄降臨] 🪚 鬼斧「埃羅」加入魔能深淵！強大的吸血大招「蝕骨巨斧」將成為戰場噩夢。",
          "[戰鬥平衡] 🛡️ 歐米茄大招「暴走鑽頭」修正為純粹防禦技能，移除主動傷害以符合重裝坦克設定。",
          "[規則修正] 😈 美娜「惡魔反甲」機制修復：現在能精確捕捉攻擊者並實時彈回傷害。",
          "[羈絆回歸] 🩸 埃羅與美娜的「血煞修羅」羈絆完整修復，埃羅在大招中也能繼承血色意志了。",
          "[AI 進化] 🤖 戰術過濾：電腦對手現在更具威脅度，且會主動避開處於「不可選中」狀態的目標。",
          "[規則強化] ⚔️ 邏輯鎖定：處於暈眩或壓制狀態下的英雄將喪失所有反應能力，無法閃避或格擋。",
          "[系統修復] ⚙️ 徹底修復了手動選位後導致的「時空凍結」，現在流程與後續結算能完美銜接。",
          "[數值修正] 🔮 阿萊斯特「零度奇點」明確修正為 0 傷害純控制技能，回歸戰略干擾定位。",
          "[UI 拋光] 🏷️ 肖像對齊：新增英雄卡牌影像微調功能，解決「赫」等英雄肖像頭部切割問題。",
          "[UI 拋光] 🏷️ 狀態標籤精緻化：阿萊斯特吟唱時標註「🔮 吟唱中」，納克羅斯閃避標註「💫 幻刃」。"
        ]
      },
      {
        version: "第一章：創世紀元 (Genesis Era)",
        items: [
          "[核心改動] 💀 阿萊斯特「零度奇點」完全體實裝：絕對壓制目標（無視護衛且 0 傷害），若目標陣亡則自動停止引導並恢復行動。",
          "[核心改動] 🎯 戰術集火機制：受壓制英雄護衛失效，全體隊友可直接跨排集火。",
          "[核心改動] 💫 納克羅斯「幻刃」登場：每次普通攻擊後自動獲得 1 回合閃避。基礎速度提升至 7。",
          "[視覺強化] 🛡️ 戰場狀態視覺化：新增「壓制中」專屬標籤與紫色虛空脈衝特效。",
          "[聯網對戰] 🌐 至尊對決協議：基於 PeerJS 的 P2P 遠端對戰系統與即時數據同步。",
          "[英雄降臨] 💎 朗博 (Lumburr) 參戰：解放大地之力，實裝「護盾機制」優先吸收傷害。",
          "[英雄強化] 🔨 塔拉 (Taara) 戰意視覺化、龍馬 (Ryoma) [刀訣] 被動屬性成長修復。",
          "[陣營羈絆] 🔮 陣營之力 & 宿命羈絆：實裝光明聖殿、魔能深淵、暗影森林、浪人武士及騎士團、鐵山聯盟等增益系統。",
          "[規則確立] ⚡ 陣型系統：確立前排、遊走、後排位階與護衛保護規則。修正 AOE 範圍傷害判定。",
          "[體驗優化] ⚙️ 戰鬥引擎重構（支援動態動作類型）、新增結算詩意小語、情報系統升級（長按英雄卡可查數值）。",
          "[初始版本] 🏆 傳奇卡牌圖鑑、戰後結算系統、基礎戰鬥核心與帳號註冊功能正式上線。"
        ]
      }
    ];

    return (
      <div className="hero-view changelog-view">
        <button className="back-btn" onClick={() => setView('lobby')}>← 返回大廳</button>
        <div className="changelog-container glass-panel">
          <h1 className="bonds-title">艾森諾更新日誌</h1>
          <div className="changelog-list">
            {changes.map((log, idx) => (
              <div key={idx} className="changelog-card">
                <div className="changelog-header">
                  <span className="version-tag">{log.version}</span>
                  {log.date && <span className="date-tag">{log.date}</span>}
                </div>
                <ul className="changelog-items">
                  {log.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFactionBonds = () => {
    return (
      <div className="hero-view">
        <button className="back-btn" onClick={() => setView('lobby')}>← 返回大廳</button>
        <div className="bonds-container glass-panel">
          <h1 className="bonds-title">陣營 ＆ 羈絆</h1>

          <div className="tabs-header">
            <button
              className={`tab-btn ${bondTab === 'faction' ? 'active' : ''}`}
              onClick={() => setBondTab('faction')}
            >
              陣營之力
            </button>
            <button
              className={`tab-btn ${bondTab === 'bond' ? 'active' : ''}`}
              onClick={() => setBondTab('bond')}
            >
              羈絆之力
            </button>
          </div>

          <div className="bond-content">
            {bondTab === 'faction' && (
              <div className="faction-powers">
                <p className="bonds-intro">當出戰隊伍中的 3 位英雄皆屬於同一個陣營時，將在開戰時永久觸發該陣營的專屬加成。</p>

                <div className="faction-power-card temple-of-light">
                  <div className="power-icon">✨</div>
                  <div className="power-info">
                    <h3>光明聖殿：[ 陣營之光 ]</h3>
                    <p className="power-desc">己方全體英雄的普通攻擊數值 (不含大招) +1，初始速度 +1。</p>
                    <span className="activation-tag">3人同陣營時觸發</span>
                  </div>
                </div>

                <div className="faction-power-card abyssal-chaos">
                  <div className="power-icon">🔮</div>
                  <div className="power-info">
                    <h3>魔能深淵：[ 深淵之力 ]</h3>
                    <p className="power-desc">己方全體英雄每回合可擲骰兩次，並自動選擇較優結果。</p>
                    <span className="activation-tag">3人同陣營時觸發</span>
                  </div>
                </div>

                <div className="faction-power-card afata">
                  <div className="power-icon">🌲</div>
                  <div className="power-info">
                    <h3>暗影森林：[ 森林之力 ]</h3>
                    <p className="power-desc">己方全體英雄生命上限 +3，且受到傷害時自動反擊 1 點真實傷害。</p>
                    <span className="activation-tag">3人同陣營時觸發</span>
                  </div>
                </div>

                <div className="faction-power-card ronin">
                  <div className="power-icon">⚔️</div>
                  <div className="power-info">
                    <h3>浪人武士：[ 浪人之道 ]</h3>
                    <p className="power-desc">若隊伍中僅有 1 位浪人英雄，其他 2 位英雄的陣營之力依然可以觸發。</p>
                    <span className="activation-tag special">特殊被動</span>
                  </div>
                </div>

                <div className="faction-power-card locked">
                  <div className="power-icon">🔒</div>
                  <div className="power-info">
                    <h3>其他陣營</h3>
                    <p className="power-desc">古老的檔案尚未解開，敬請期待後續更新。</p>
                  </div>
                </div>
              </div>
            )}

            {bondTab === 'bond' && (
              <div className="faction-powers">
                <p className="bonds-intro">當特定的英雄組合同時出戰時，將觸發強大的「宿命羈絆」效果。</p>

                <div className="faction-power-card bond-light-knights">
                  <div className="power-icon">🛡️</div>
                  <div className="power-info">
                    <h3>光明騎士團 <span className="bond-relation-tag">團隊</span></h3>
                    <p className="power-desc">成員：莫托斯、薩尼、歐米茄<br />效果：全員生命、速度、普攻與大招傷害 +1。</p>
                    <p className="bond-voice">「讓光明，重回大地」---光明騎士團</p>
                    <span className="activation-tag bond">組合達成即觸發</span>
                  </div>
                </div>

                <div className="faction-power-card bond-iron-mountain">
                  <div className="power-icon">⛰️</div>
                  <div className="power-info">
                    <h3>鐵山之盟 <span className="bond-relation-tag">盟友</span></h3>
                    <p className="power-desc">成員：塔拉、朗博<br />效果：全員生命 +2。</p>
                    <p className="bond-voice">「這是我們，最後的家園!」---鐵山聯盟</p>
                    <span className="activation-tag bond">組合達成即觸發</span>
                  </div>
                </div>

                <div className="faction-power-card bond-blood-shura">
                  <div className="power-icon">🩸</div>
                  <div className="power-info">
                    <h3>血煞修羅 <span className="bond-relation-tag">伴侶</span></h3>
                    <p className="power-desc">成員：美娜、埃羅<br />效果：開戰時美娜自動開啟大招。若美娜陣亡，埃羅全數值 +1 且攻擊附帶暈眩效果。</p>
                    <p className="bond-voice">「我會帶著妳，戰至最後一刻。」---埃羅</p>
                    <span className="activation-tag bond">組合達成即觸發</span>
                  </div>
                </div>

                <div className="faction-power-card locked">
                  <div className="power-icon">🔒</div>
                  <div className="power-info">
                    <h3>未知羈絆</h3>
                    <p className="power-desc">解鎖特定英雄後，組合效果將在此顯示。</p>
                    <span className="activation-tag">敬請期待</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="hero-header">
        <h1>艾森諾對決</h1>
        <div className="subtitle">ATHANOR DUEL</div>
      </header>
      <main className="main-content">
        {view === 'login' && (
          <div className="login-screen animate-bg">
            <div className="login-box glass-panel animate-zoom">
              <div className="login-logo">
                <div className="logo-spark">✨</div>
                <h1>艾森諾對決</h1>
                <p>傳說再啟，榮耀新生</p>
              </div>

              <div className="login-form">
                <div className="input-group">
                  <label>英雄帳號</label>
                  <input
                    type="text"
                    value={loginData.account}
                    onChange={e => setLoginData({ ...loginData, account: e.target.value })}
                    placeholder="輸入帳號..."
                  />
                </div>
                <div className="input-group">
                  <label>戰鬥密碼</label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="輸入密碼..."
                  />
                </div>

                <button className="login-btn highlight-btn" onClick={handleLoginAction}>
                  {isRegisterMode ? '註冊帳號' : '進入艾森諾'}
                </button>

                <div className="login-toggle" onClick={() => setIsRegisterMode(!isRegisterMode)}>
                  {isRegisterMode ? '已有帳號？ 立即登入' : '初來乍到？ 註冊新英雄'}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'lobby' && (
          <div className="lobby-container">
            <div className="user-profile glint">
              <div className="user-info">
                <span className="user-name">🏆 {currentUser?.account} </span>
                <div className="currency-bar">
                  <span className="currency-item pearl" title="聖珠"><i className="icon-pearl">⚪</i> {currentUser?.holyPearl || 0}</span>
                  <span className="currency-item core" title="魔核"><i className="icon-core">♦️</i> {currentUser?.magicCore || 0}</span>
                  <span className="currency-item leaf" title="影葉"><i className="icon-shadow-leaf">🍃</i> {currentUser?.leaf || 0}</span>
                  <span className="currency-item coin" title="金幣"><i className="icon-coin">🪙</i> {currentUser?.goldCoin || 0}</span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>登出帳號</button>
            </div>
            <div className="lobby-content glass-panel">
              <h2 className="lobby-title">遊戲大廳</h2>
              <div className="lobby-menu">
                <div className="menu-item glass-panel" onClick={() => setView('battle-mode')}>
                  <div className="menu-icon">⚔️</div>
                  <h3>對戰模式</h3>
                  <p>單人戰役 / 雙人競技</p>
                </div>
                <div className="menu-item glass-panel" onClick={() => setView('card-library')}>
                  <div className="menu-icon">🎴</div>
                  <h3>傳奇卡牌</h3>
                  <p>查看英雄屬性與技能</p>
                </div>
                <div className="menu-item glass-panel" onClick={() => setView('faction-bonds')}>
                  <div className="menu-icon">🌟</div>
                  <h3>陣營 ＆ 羈絆</h3>
                  <p>解鎖強大的團隊增益</p>
                </div>
                <div className="menu-item glass-panel" onClick={() => setView('changelog')}>
                  <div className="menu-icon">📜</div>
                  <h3>艾森諾更新日誌</h3>
                  <p>第二章：英雄集結</p>
                </div>
                <div className="menu-item glass-panel coming-soon">
                  <div className="menu-icon">⏳</div>
                  <h3>秘寶系統</h3>
                  <p>敬請期待...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'battle-mode' && (
          <div className="lobby-container">
            <div className="lobby-content glass-panel">
              <button className="back-btn" onClick={() => setView('lobby')}>← 返回大廳</button>
              <h2 className="lobby-title">進攻的號角，已響徹雲霄!</h2>
              <div className="lobby-menu">
                <div className="menu-item glass-panel" onClick={() => { setGameMode('vs-ai'); setView('selection'); }}>
                  <div className="menu-icon">🤖</div>
                  <h3>遠古 AI 挑戰</h3>
                  <p>磨練您的指揮藝術</p>
                </div>
                <div className="menu-item glass-panel" onClick={() => { setView('online-setup'); }}>
                  <div className="menu-icon">🌐</div>
                  <h3>至尊對決</h3>
                  <p>雙人頂尖競技</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'online-setup' && (
          <div className="lobby-container">
            <div className="lobby-content glass-panel">
              <button className="back-btn" onClick={() => setView('battle-mode')}>← 返回</button>
              <h2 className="lobby-title">遠端連線配置</h2>
              <div className="online-setup-box">
                <div className="setup-section host">
                  <h3>作為房主</h3>
                  <p>分享您的 ID 給好友：</p>
                  <div
                    className="my-id-box clickable"
                    title="點擊複製 ID"
                    onClick={() => {
                      if (myId) {
                        navigator.clipboard.writeText(myId);
                        setBattleLog(prev => [...prev.slice(-4), `📋 已複製房號：${myId}`]);
                      }
                    }}
                  >
                    {myId || '正在生成...'}
                    {myId && <span className="copy-hint"> (點擊複製)</span>}
                  </div>
                  <p className="hint">將 ID 分享給好友，等待其連入...</p>
                </div>
                <div className="divider-v">OR</div>
                <div className="setup-section join">
                  <h3>作為挑戰者</h3>
                  <p>輸入好友的 ID：</p>
                  <input
                    className="id-input"
                    value={targetIdInput}
                    onChange={(e) => setTargetIdInput(e.target.value)}
                    placeholder="輸入 ID..."
                  />
                  <button className="join-btn" onClick={connectToPeer} disabled={connectionStatus === 'CONNECTING'}>
                    {connectionStatus === 'CONNECTING' ? '連線中...' : '進行連線'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'card-library' && (
          <div className="hero-view">
            <button className="back-btn" onClick={() => { if (selectedFaction) setSelectedFaction(null); else setView('lobby'); }}>← 返回</button>
            {!selectedFaction ? (
              <div className="faction-grid">{factions.map(f => (<div key={f.id} className={`faction-card glass-panel ${f.id}`} onClick={() => setSelectedFaction(f)}><div className="faction-content"><span className="faction-id">{f.id.toUpperCase()}</span><h2>{f.name}</h2><p>{f.description}</p></div></div>))}</div>
            ) : (
              <div className="hero-list-container">
                <div className="info-section"><h2>{selectedFaction.name}</h2><p>{selectedFaction.description}</p></div>
                <div className="hero-display-grid">{selectedFaction.heroes.map(h => <HeroCard key={h.id} hero={h} factionId={selectedFaction.id} />)}</div>
              </div>
            )}
          </div>
        )}
        {view === 'faction-bonds' && renderFactionBonds()}
        {view === 'changelog' && renderChangelog()}
        {view === 'selection' && renderSelection()}
        {view === 'battle' && renderBattle()}
      </main>
    </div>
  );
}

export default App;
