import React, { useState, useRef, useEffect } from 'react';
import './HeroCard.css';

const HeroCard = ({ hero, factionId, isInBattle, onClick, isSelected, isTargeted, hp, activeVfx, isEvading, isSmashing, statuses, shield }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const longPressTimer = useRef(null);
    const isLongPress = useRef(false);

    // Unified Pointer Logic for both mobile and desktop long-press
    const handlePointerDown = (e) => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true; // Corrected line: This was likely the intended JS change
            setIsExpanded(true);
        }, 500);
    };

    const handlePointerUp = (e) => {
        clearTimeout(longPressTimer.current);
        if (!isLongPress.current) {
            // Short click
            if (onClick) {
                onClick();
            } else if (!isInBattle) {
                // If checking in library, we might not have onClick passed, so default to expand
                setIsExpanded(true);
            }
        } else {
            // Long Press happened (handled by timer), just consume the up event
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setIsExpanded(false);
    };

    if (!isExpanded) {
        return (
            <div
                className={`hero-card-compact glass-panel ${factionId} ${isInBattle ? (hero.pos || '') : ''} ${isSelected ? 'selected-act' : ''} ${isTargeted ? 'targeted-act' : ''} ${hp <= 0 ? 'defeated' : ''} ${isEvading ? 'evade-anim' : ''} ${isSmashing ? 'ult-smash' : ''} ${hero.suppressedBy ? 'is-suppressed' : ''}`}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onContextMenu={(e) => { e.preventDefault(); setIsExpanded(true); }}
            >
                {isSelected && <div className="selection-overlay">ACTION</div>}
                {isTargeted && <div className="target-overlay">TARGET</div>}
                {statuses?.stunned > 0 && <div className="stun-overlay">STUNNED</div>}

                {/* 狀態顯示 */}
                {isInBattle && (
                    <div className="status-container">
                        <div className="status-badge pos-tag">
                            {hero.pos === 'front' ? '前排' : hero.pos === 'roam' ? '遊走' : '後排'}
                        </div>
                        {statuses?.silenced > 0 && <div className="status-badge silenced">🤐 沉默</div>}
                        {statuses?.invincible > 0 && <div className="status-badge invincible">🛡️ 無敵({statuses.invincible})</div>}
                        {statuses?.stunned > 0 && (
                            <div className="status-badge stunned">
                                {hero.suppressedBy ? '💀 壓制中' : (hero.isChannelingSuppression ? '🔮 吟唱中' : '😵 暈眩')}
                            </div>
                        )}
                        {statuses?.speed > 0 && (
                            <div className="status-badge speed">
                                {hero.id === 'nakroth' ? '💫 幻刃' : '⚡ 光速'} ({statuses.speed})
                            </div>
                        )}
                        {statuses?.regen > 0 && <div className="status-badge regen">🔋 鋼鐵意志({statuses.regen})</div>}
                        {shield > 0 && <div className="status-badge shield-badge">💎 護盾({shield})</div>}
                        {hero.id === 'tara' && hp < hero.hp && (
                            <div className="status-badge intent">🔥 戰意 +{Math.floor((hero.hp - hp) / 2)}</div>
                        )}
                    </div>
                )}

                <div className="compact-img-wrap">
                    <img
                        src={hero.image}
                        alt={hero.name}
                        className="hero-img"
                        style={hero.imageSettings || {}}
                    />
                </div>

                {/* VFX Layer */}
                {activeVfx && (
                    <div className="vfx-layer">
                        {activeVfx.type === 'damage' && <div className="damage-popup">-{activeVfx.value}</div>}
                        {activeVfx.type === 'slash' && <div className="slash-vfx"></div>}
                        {activeVfx.type === 'light' && <div className="light-vfx"></div>}
                        {activeVfx.type === 'dark' && <div className="dark-vfx"></div>}
                        {activeVfx.type === 'forest' && <div className="forest-vfx"></div>}
                        {activeVfx.type === 'shield' && <div className="shield-vfx"></div>}
                    </div>
                )}

                <div className="compact-info">
                    <h3>{hero.name}</h3>
                    {isInBattle ? (
                        <div className="hp-bar-container">
                            <div className="hp-bar-fill" style={{ width: `${(hp / hero.hp) * 100}%` }}></div>
                            <span className="hp-text">{Math.max(0, hp)}/{hero.hp}</span>
                        </div>
                    ) : (
                        <div className="click-hint">點擊查看詳情</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`hero-card-container glass-panel ${factionId} expanded floating-detail`} onClick={handleClose}>
            <div className="close-btn" onClick={handleClose}>✕</div>
            <div className="hero-card-image-wrap">
                <img
                    src={hero.image}
                    alt={hero.name}
                    className="hero-img"
                    style={hero.imageSettings || {}}
                />
            </div>

            <div className="hero-info">
                <h3>{hero.name}</h3>

                {hero.passive && (
                    <div className="hero-passive">
                        <span className="passive-tag">【{hero.passive.name}】</span>
                        <span className="passive-desc">{hero.passive.description}</span>
                    </div>
                )}

                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="label">HP</span>
                        <span className="value">{isInBattle ? hp : hero.hp}</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">SPD</span>
                        <span className="value">{hero.speed}</span>
                    </div>
                </div>

                <div className="dice-actions">
                    {/* Dynamic Row Rendering */}
                    {(() => {
                        const rows = [];
                        let currentAttackDice = [];

                        // Check for attack grouping (sequential 1-4)
                        for (let i = 1; i <= 4; i++) {
                            if (hero.diceActions[i]?.type === 'attack') {
                                currentAttackDice.push(i);
                            } else {
                                break;
                            }
                        }

                        if (currentAttackDice.length > 0) {
                            rows.push(
                                <div className="dice-row" key="atk-row">
                                    {currentAttackDice.map(d => <span className="dice-num" key={d}>{d}</span>)}
                                    <span className="action-type attack">ATK</span>
                                    <span className="action-val">
                                        {currentAttackDice.map(d => hero.diceActions[d].value).join('-')}
                                    </span>
                                </div>
                            );
                        }

                        // Process remaining dice from where attack group left off
                        const startFrom = currentAttackDice.length + 1;
                        for (let i = startFrom; i <= 6; i++) {
                            const action = hero.diceActions[i];
                            if (!action) continue;

                            // Special case: if we are at 5/6 and they are Evade/Block, maybe group them?
                            // But let's stay simple and faithful to the data.
                            rows.push(
                                <div className={`dice-row ${action.type === 'ultimate' ? 'ult' : 'utility'}`} key={`row-${i}`}>
                                    <span className="dice-num">{i}</span>
                                    <span className={`action-type ${action.type}`}>
                                        {action.type === 'attack' ? 'ATK' :
                                            action.type === 'ultimate' ? 'ULT' :
                                                action.type === 'evade' ? 'EVA' :
                                                    action.type === 'block' ? 'BLK' : action.type.toUpperCase().slice(0, 3)}
                                    </span>
                                    <span className="action-desc">
                                        {action.type === 'attack' ? `${action.value} DMG` :
                                            action.type === 'ultimate' ? (action.effect === 'HEAL_FULL' ? `${action.name}: 回復滿血` : `${action.name}: ${action.description || `${action.value} DMG`}`) :
                                                action.name || action.type}
                                    </span>
                                </div>
                            );
                        }
                        return rows;
                    })()}
                </div>

                <div className="hero-voice-footer">
                    <span>"{hero.voice}"</span>
                </div>
            </div>
        </div>
    );
};

export default HeroCard;
