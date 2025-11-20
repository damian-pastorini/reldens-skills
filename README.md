[![Reldens - GitHub - Release](https://www.dwdeveloper.com/media/reldens/reldens-mmorpg-platform.png)](https://github.com/damian-pastorini/reldens)

# Reldens - Skills

## About
The idea behind this package is to provide a comprehensive skills and experience system that can be attached to any target owner.
This opinionated yet flexible implementation includes class paths, leveling systems, skill trees, and experience management with full event-driven architecture.

The package offers both client and server-side functionality, including automatic level progression, skill validation, damage calculations, physical attacks, effects system, and complete real-time synchronization via Sender/Receiver pattern.


---

## Features

- **Level Sets & Experience System**: Automatic level progression with configurable experience requirements, level-based modifiers, and auto-fill ranges
- **Class Paths & Skill Trees**: Skill progression with level-dependent skill unlocks, dynamic labeling per level, and skill management
- **Multiple Skill Types**: Base skills, attacks with damage calculation, effects (buffs/debuffs), physical attacks and effects with collision detection
- **Combat Mechanics**: Critical hits (chance/multiplier/fixed), dodge calculations, range validation, attack vs defense properties, and aim vs dodge systems
- **Real-time Communication**: Built-in Sender/Receiver architecture for server-client synchronization with compressed message format
- **Event-Driven Architecture**: Comprehensive event system with 30+ events for custom logic integration, all namespaced by owner
- **Modular Design**: Flexible configuration with custom conditions, modifiers, extensible skill logic, and physics integration
- **Standalone Package**: Can be used independently from main Reldens platform with any entity that implements `getPosition()` method

Need something specific?

[Request a feature here: https://www.reldens.com/features-request](https://www.reldens.com/features-request)

---

## Installation

```bash
npm install @reldens/skills
```

## Quick Start

### Basic Skill Example

```javascript
const { Skill } = require('@reldens/skills');

// Create a simple skill
let healSkill = new Skill({
    key: 'heal',
    owner: playerEntity, // Must have getPosition() method
    range: 100,
    castTime: 1000, // 1 second cast time
    skillDelay: 5000 // 5 second cooldown
});

// Execute the skill
await healSkill.execute(targetEntity);
```

### Attack Skill with Damage

```javascript
const { Attack } = require('@reldens/skills/lib/types/attack');

let fireballSkill = new Attack({
    key: 'fireball',
    owner: playerEntity,
    affectedProperty: 'hp', // Property to damage
    hitDamage: 50,
    range: 200,
    attackProperties: ['atk', 'magicPower'], // Owner properties for attack
    defenseProperties: ['def', 'magicResist'], // Target properties for defense
    aimProperties: ['accuracy'],
    dodgeProperties: ['agility'],
    criticalChance: 20, // 20% chance
    criticalMultiplier: 2 // 2x damage on crit
});

await fireballSkill.execute(enemy);
```

### Level System with Auto-Progression

```javascript
const { LevelsSet, Level } = require('@reldens/skills');

let levels = {
    1: new Level({key: 1, modifiers: [], requiredExperience: 0}),
    5: new Level({key: 5, modifiers: [], requiredExperience: 1000})
};

let levelsSet = new LevelsSet({owner: playerEntity});
await levelsSet.init({
    owner: playerEntity,
    levels: levels,
    currentLevel: 1,
    currentExp: 0,
    autoFillRanges: true, // Auto-generate levels 2, 3, 4
    increaseLevelsWithExperience: true // Auto level up
});

// Add experience (will auto-level up at 1000 XP)
await levelsSet.addExperience(500);
await levelsSet.addExperience(600); // Levels up to 5!
```

### Class Path with Skill Tree

```javascript
const { ClassPath } = require('@reldens/skills');

let classPath = new ClassPath({owner: playerEntity});
await classPath.init({
    owner: playerEntity,
    key: 'warrior',
    label: 'Warrior',
    levels: levels,
    currentLevel: 1,
    labelsByLevel: {
        1: 'Novice Warrior',
        5: 'Experienced Warrior',
        10: 'Master Warrior'
    },
    skillsByLevel: {
        1: [swordSlashSkill],
        5: [shieldBlockSkill, battleCrySkill],
        10: [whirlwindSkill]
    }
});

// Player starts with swordSlashSkill
// At level 5: gains shieldBlockSkill and battleCrySkill
// At level 10: gains whirlwindSkill
```

### Server-Side with Client Sync

```javascript
const { SkillsServer } = require('@reldens/skills');

let skillsServer = new SkillsServer({
    owner: playerEntity,
    client: roomClient, // Colyseus client with send() and broadcast()
    key: 'mage',
    levels: levels,
    skillsByLevel: {
        1: [fireballSkill, iceSpearSkill]
    }
});

// Automatically syncs to client:
// - Initial class data (level, label, XP, skills)
// - Level ups
// - XP gains
// - Skill casts
// - Damage application
```

### Client-Side Receiver

```javascript
const { Receiver } = require('@reldens/skills/lib/client/receiver');

class SkillsUI extends Receiver
{
    constructor(props)
    {
        super(props);
    }

    onLevelUp(message)
    {
        // message.data = {lvl: 5, lab: 'Experienced Warrior', skl: ['sword', 'shield'], ne: 2000}
        updateLevelDisplay(message.data.lvl);
        updateSkillBar(message.data.skl);
    }

    onLevelExperienceAdded(message)
    {
        // message.data = {exp: 1500}
        updateXPBar(message.data.exp);
    }

    onSkillAttackApplyDamage(message)
    {
        // message.data = {d: 85}
        showDamageNumber(message.data.d);
    }
}

let receiver = new SkillsUI({owner: playerEntity});
gameClient.onMessage('*', (msg) => receiver.processMessage(msg));
```

### Event Hooks

```javascript
const SkillsEvents = require('@reldens/skills/lib/skills-events');

// Listen to level up
classPath.listenEvent(SkillsEvents.LEVEL_UP, async (classPath) => {
    console.log(`Leveled up to ${classPath.currentLevel}!`);
    awardAchievement('level_up');
}, 'levelUpListener', classPath.getOwnerEventKey());

// Listen to skill execution
skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, async (skill, target) => {
    console.log(`Skill ${skill.key} executed on ${target.name}`);
    playAnimation(skill.key);
}, 'skillExecListener', skill.getOwnerEventKey());

// Listen to damage application
attackSkill.listenEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, async (skill, target, damage) => {
    console.log(`Dealt ${damage} damage to ${target.name}`);
    showFloatingText(damage, target.position);
}, 'damageListener', attackSkill.getOwnerEventKey());
```

---

## Core Concepts

### Skill Types

1. **Skill** (`lib/skill.js`): Base class with validation, range checking, cooldowns, cast time
2. **Attack** (`lib/types/attack.js`): Damage calculation with atk/def, aim/dodge, critical hits
3. **Effect** (`lib/types/effect.js`): Applies modifiers to target (buffs/debuffs)
4. **PhysicalAttack** (`lib/types/physical-attack.js`): Physics-enabled attack with collision detection
5. **PhysicalEffect** (`lib/types/physical-effect.js`): Physics-enabled effect with collision detection

### Level Progression

- **Level**: Single level with modifiers and required XP
- **LevelsSet**: Manages multiple levels, XP tracking, auto-leveling
- **ClassPath**: Extends LevelsSet with skill trees and dynamic labels

### Communication

- **Sender** (`lib/server/sender.js`): Broadcasts skill/level events to clients with compressed messages
- **Receiver** (`lib/client/receiver.js`): Processes server messages and maps to handler methods

### Events

30+ events covering:
- Level progression (level up/down, XP added, modifiers applied)
- Class paths (init, skills added/removed)
- Skill execution (validate, cast, execute, damage/effects applied)
- Range checking, physical collisions

All events are namespaced by owner for multiplayer support.

---

## API Reference

### Skill Class

**Constructor Properties**:
- `key` (required): Unique skill identifier
- `owner` (required): Entity with `getPosition()` method
- `target`: Target entity (or pass in execute)
- `range`: Skill range (0 = infinite)
- `rangeAutomaticValidation`: Validate range before execution
- `allowSelfTarget`: Allow targeting owner
- `castTime`: Cast time in milliseconds
- `skillDelay`: Cooldown in milliseconds
- `usesLimit`: Max uses (0 = unlimited)
- `ownerConditions`: Array of Condition instances
- `ownerEffects`: Array of modifiers for owner
- `criticalChance`: 0-100 crit chance
- `criticalMultiplier`: Damage multiplier on crit
- `criticalFixedValue`: Fixed damage added on crit

**Methods**:
- `validate()`: Check if skill can be activated
- `execute(target)`: Execute the skill
- `runSkillLogic()`: Override for custom logic
- `onExecuteConditions()`: Override for custom validation
- `validateRange(target)`: Check if target in range
- `applyModifiers(modifiers, target)`: Apply modifiers with critical
- `fireEvent(eventName, ...args)`: Fire namespaced event
- `listenEvent(eventName, callback, removeKey, masterKey)`: Listen to event

### Attack Class

Extends Skill with additional properties:
- `affectedProperty` (required): Property to damage (e.g., 'hp')
- `hitDamage`: Base damage at 100%
- `applyDirectDamage`: Skip calculations
- `attackProperties`: Owner atk property names
- `defenseProperties`: Target def property names
- `aimProperties`: Owner aim property names
- `dodgeProperties`: Target dodge property names
- `dodgeFullEnabled`: Enable full dodge
- `dodgeOverAimSuccess`: Dodge threshold multiplier
- `damageAffected`: Apply dodge/aim to damage
- `criticalAffected`: Apply dodge/aim to critical
- `allowEffectBelowZero`: Allow negative values

### LevelsSet Class

**Constructor Properties**:
- `owner` (required): Entity with `getPosition()` method
- `events`: EventsManager instance

**Init Properties**:
- `levels` (required): Object of Level instances
- `currentLevel`: Starting level
- `currentExp`: Starting XP
- `autoFillRanges`: Auto-generate intermediate levels
- `autoFillExperienceMultiplier`: XP multiplier for auto-gen (default: 1.5)
- `increaseLevelsWithExperience`: Auto level up when XP threshold met
- `levelsByExperience`: Custom level order array
- `setRequiredExperienceLimit`: Cap XP at max level

**Methods**:
- `init(props)`: Initialize level set
- `levelUp()`: Increase level, apply modifiers
- `levelDown()`: Decrease level, revert modifiers
- `addExperience(number)`: Add XP, auto-level if enabled
- `getNextLevelExperience()`: Get XP for next level
- `getLevelInstance(levelKey)`: Get Level by key

### ClassPath Class

Extends LevelsSet with additional properties:
- `key` (required): Class identifier
- `label`: Display name
- `labelsByLevel`: {levelKey: 'label'} object
- `currentLabel`: Active label
- `skillsByLevel`: {levelKey: [Skill instances]} object
- `currentSkills`: Active skills object
- `affectedProperty`: Property for class skills

**Methods**:
- `addSkills(skills)`: Add skills to current set
- `removeSkills(skills)`: Remove skills by keys
- `setOwnerSkills(skills)`: Initialize skills based on level

---

## Documentation

[https://www.reldens.com/documentation/skills](https://www.reldens.com/documentation/skills)

---

## License

MIT

---

### [Reldens](https://github.com/damian-pastorini/reldens/ "Reldens")

##### [By DwDeveloper](https://www.dwdeveloper.com/ "DwDeveloper")
