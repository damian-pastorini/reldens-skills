# LEVEL PROGRESSION SYSTEM
## Complete Guide to Levels, Experience, and Class Paths

---

## OVERVIEW

The @reldens/skills package provides a sophisticated level progression system with automatic leveling, experience management, modifier application, and skill unlocking. This document covers the complete flow from level creation to class path progression.

---

## ARCHITECTURE

### Core Classes

```
Level (lib/level.js)
  ↓
LevelsSet (lib/levels-set.js)
  ↓
ClassPath (lib/class-path.js)
  ↓
SkillsServer (lib/server.js)
```

### Hierarchy:
- **Level**: Single level with modifiers and XP requirement
- **LevelsSet**: Level collection with experience tracking and progression
- **ClassPath**: LevelsSet + skill trees + label management
- **SkillsServer**: ClassPath + server-client synchronization

---

## LEVEL CLASS

**File:** `lib/level.js:9-33`

### Purpose

Represents a single level in a progression system with associated modifiers and requirements.

### Properties

```javascript
{
    key: 5,                    // Level number (integer)
    label: 'Expert',           // Display name for this level
    requiredExperience: 1000,  // XP needed to reach this level
    modifiers: [               // Modifiers applied at this level
        hpModifier,
        attackModifier
    ]
}
```

### Constructor

```javascript
constructor(props)
{
    this.key = sc.get(props, 'key', false);
    this.label = sc.get(props, 'label', this.key);
    this.requiredExperience = sc.get(props, 'requiredExperience', 0);
    this.modifiers = sc.get(props, 'modifiers', []);
}
```

### Key Points

- `key` must be an integer (level number)
- `label` defaults to key if not provided
- `requiredExperience` is cumulative (total XP needed, not delta)
- `modifiers` is an array of @reldens/modifiers Modifier instances
- Level instances are immutable once created

### Example

```javascript
import {Level} from '@reldens/skills';
import {Modifier} from '@reldens/modifiers';

let level5 = new Level({
    key: 5,
    label: 'Expert Warrior',
    requiredExperience: 1000,
    modifiers: [
        new Modifier({
            key: 'level-5-hp',
            propertyKey: 'stats.hp',
            operation: '+',
            value: 50
        }),
        new Modifier({
            key: 'level-5-attack',
            propertyKey: 'stats.atk',
            operation: '+',
            value: 10
        })
    ]
});
```

---

## LEVELSSET CLASS

**File:** `lib/levels-set.js:11-298`

### Purpose

Manages level progression, experience tracking, automatic leveling, and modifier application.

### Properties

```javascript
{
    owner: playerEntity,              // Entity with getPosition() method
    key: 'warrior-progression',       // LevelsSet identifier
    levels: {                         // Object of Level instances
        1: level1,
        5: level5,
        10: level10
    },
    currentLevel: 1,                  // Current level number
    currentExp: 0,                    // Current experience points
    autoFillRanges: true,            // Auto-generate intermediate levels
    autoFillExperienceMultiplier: 1.5, // XP multiplier for auto-filled levels
    increaseLevelsWithExperience: true, // Auto level-up when XP threshold reached
    setRequiredExperienceLimit: false  // Cap XP at max level
}
```

### Initialization

**Method:** `init(props)` - File: `lib/levels-set.js:32-59`

```javascript
let levelsSet = new LevelsSet();
await levelsSet.init({
    owner: playerEntity,
    key: 'warrior-levels',
    levels: {
        1: new Level({key: 1, requiredExperience: 0}),
        5: new Level({key: 5, requiredExperience: 1000}),
        10: new Level({key: 10, requiredExperience: 5000})
    },
    currentLevel: 1,
    currentExp: 0,
    autoFillRanges: true
});
```

**Initialization Flow:**

```
1. Fire INIT_LEVEL_SET_START event
2. Set owner reference
3. Set key, events, currentLevel, currentExp
4. Call setLevels(props.levels)
   → Auto-fill level ranges if enabled
   → Sort levels by required experience
5. Apply current level modifiers
6. Fire INIT_LEVEL_SET_END event
```

### Auto-Fill Level Ranges

**Method:** `autoFillLevelRanges(levels)` - File: `lib/levels-set.js:96-160`

**Purpose:** Automatically generate intermediate levels between defined levels.

**Example:**
```javascript
// Input levels:
{
    1: Level(key: 1, requiredExp: 0),
    10: Level(key: 10, requiredExp: 5000)
}

// With autoFillRanges: true
// Generates levels 2, 3, 4, 5, 6, 7, 8, 9

// Output:
{
    1: Level(key: 1, requiredExp: 0),
    2: Level(key: 2, requiredExp: 0 * 1.5 = 0),
    3: Level(key: 3, requiredExp: 0 * 1.5 = 0),
    // ...
    9: Level(key: 9, requiredExp: calculated),
    10: Level(key: 10, requiredExp: 5000)
}
```

**Algorithm:**

```
For each gap between defined levels:
1. Identify startLevel and endLevel
2. Calculate totalGap = endLevel.requiredExp - startLevel.requiredExp
3. Calculate numberOfLevels = (endLevel.key - startLevel.key - 1)
4. For each intermediate level:
   → Calculate baseIncrease = totalGap / (numberOfLevels + 1)
   → Apply multiplier: expIncrease = baseIncrease * autoFillExperienceMultiplier^levelOffset
   → Create new Level instance
   → Fire GENERATED_LEVELS event
5. Add all levels to levels object
```

**Key Points:**
- Only fills gaps, doesn't modify defined levels
- Uses exponential growth with `autoFillExperienceMultiplier`
- Empty modifiers array for auto-generated levels
- Label defaults to level key number

---

### Experience Management

#### Adding Experience

**Method:** `addExperience(number)` - File: `lib/levels-set.js:162-224`

```javascript
// Add 500 XP
await levelsSet.addExperience(500);
```

**Flow:**

```
1. Calculate newTotalExp = currentExp + number
2. Apply experience limit if setRequiredExperienceLimit enabled
   → Cap at max level required experience
3. Set currentExp = newTotalExp
4. If increaseLevelsWithExperience enabled:
   → Get next level data
   → While currentExp >= nextLevel.requiredExperience:
     → Level up
     → Get next level data
5. Fire LEVEL_EXPERIENCE_ADDED event with:
   → this, number, newTotalExp, currentLevelIndex, nextLevelIndex,
     nextLevelKey, nextLevel, nextLevelExp, isLevelUp
6. Return newTotalExp
```

**Parameters:**
- `number` (required): Amount of XP to add
- Returns: New total experience

**Events Fired:**
- `LEVEL_EXPERIENCE_ADDED` (always)
- `LEVEL_UP` (if level increased)

**Example:**
```javascript
let levelsSet = new LevelsSet();
await levelsSet.init({
    owner: player,
    levels: {
        1: new Level({key: 1, requiredExperience: 0}),
        2: new Level({key: 2, requiredExperience: 100}),
        3: new Level({key: 3, requiredExperience: 300})
    },
    currentLevel: 1,
    currentExp: 0,
    increaseLevelsWithExperience: true
});

// Add 250 XP - will level up from 1 to 3
await levelsSet.addExperience(250);

console.log(levelsSet.currentLevel); // 3
console.log(levelsSet.currentExp);   // 250
```

#### Getting Next Level Experience

**Method:** `getNextLevelExperience()` - File: `lib/levels-set.js:226-245`

```javascript
let nextLevelXP = levelsSet.getNextLevelExperience();
console.log(`Need ${nextLevelXP} XP for next level`);
```

**Returns:**
- Next level's required experience
- `null` if at max level

**Example:**
```javascript
let levelsSet = new LevelsSet();
await levelsSet.init({
    levels: {
        1: new Level({key: 1, requiredExperience: 0}),
        2: new Level({key: 2, requiredExperience: 100})
    },
    currentLevel: 1,
    currentExp: 50
});

let nextLevelXP = levelsSet.getNextLevelExperience(); // 100
let remaining = nextLevelXP - levelsSet.currentExp;    // 50
```

---

### Level Up / Level Down

#### Level Up

**Method:** `levelUp()` - File: `lib/levels-set.js:247-257`

```javascript
await levelsSet.levelUp();
```

**Flow:**

```
1. Fire LEVEL_UP event (params: this)
2. Increment currentLevel
3. Call applyLevelModifiers()
```

**Important:**
- Does NOT check if next level exists
- Does NOT validate XP requirements
- Caller must ensure level up is valid
- Usually called from addExperience() when XP threshold reached

#### Level Down

**Method:** `levelDown()` - File: `lib/levels-set.js:259-269`

```javascript
await levelsSet.levelDown();
```

**Flow:**

```
1. Fire LEVEL_DOWN event (params: this)
2. Decrement currentLevel
3. Call applyLevelModifiers()
```

**Important:**
- Does NOT check if previous level exists
- Caller must ensure level down is valid
- Use case: Death penalty, level drain effects

---

### Modifier Application

**Method:** `applyLevelModifiers()` - File: `lib/levels-set.js:271-289`

**Purpose:** Apply current level modifiers and revert old level modifiers.

**Flow:**

```
1. Fire LEVEL_APPLY_MODIFIERS event (params: this)
2. Get previous level from previousLevel property
3. Get current level from levels[currentLevel]
4. If previousLevel exists and has modifiers:
   → Revert each modifier from owner
     → sc.revertModifier(owner, modifier)
5. If currentLevel exists and has modifiers:
   → Apply each modifier to owner
     → sc.applyModifier(owner, modifier)
6. Update previousLevel = currentLevel
```

**Example:**
```javascript
// Level 1 modifiers: +50 HP
// Level 2 modifiers: +100 HP

// Player at level 1: HP = base(100) + modifier(50) = 150

await levelsSet.levelUp(); // Goes to level 2

// After applyLevelModifiers():
// 1. Revert level 1 modifier: HP = 150 - 50 = 100
// 2. Apply level 2 modifier: HP = 100 + 100 = 200
```

**Important:**
- Modifiers are applied through @reldens/modifiers system
- Uses `sc.applyModifier()` and `sc.revertModifier()` from @reldens/utils
- Owner must have properties referenced by modifiers
- If level has no modifiers, this step is skipped

---

### Event System

**Events Fired by LevelsSet:**

| Event | When | Parameters |
|-------|------|------------|
| `INIT_LEVEL_SET_START` | Before initialization | (this) |
| `INIT_LEVEL_SET_END` | After initialization | (this) |
| `SET_LEVELS` | After levels are set | (this, levels) |
| `GENERATED_LEVELS` | After auto-filling range | (this, startLevel, endLevel, generatedLevels) |
| `LEVEL_UP` | After level increases | (this) |
| `LEVEL_DOWN` | After level decreases | (this) |
| `LEVEL_APPLY_MODIFIERS` | Before modifier changes | (this) |
| `LEVEL_EXPERIENCE_ADDED` | After XP added | (this, number, newTotal, currentIdx, nextIdx, nextKey, nextLevel, nextExp, isLevelUp) |

**Listening to Events:**

```javascript
levelsSet.listenEvent(SkillsEvents.LEVEL_UP, async (levelsSet) => {
    console.log('Leveled up!', levelsSet.currentLevel);
    // Show animation, play sound, award achievement
}, 'my-level-up-listener');

levelsSet.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, async (
    levelsSet,
    xpAdded,
    newTotal,
    currentIdx,
    nextIdx,
    nextKey,
    nextLevel,
    nextLevelXP,
    isLevelUp
) => {
    console.log(`Gained ${xpAdded} XP (total: ${newTotal})`);
    if(isLevelUp){
        console.log('LEVEL UP!');
    } else {
        console.log(`Next level at ${nextLevelXP} XP`);
    }
}, 'xp-gain-listener');
```

---

## CLASSPATH CLASS

**File:** `lib/class-path.js:11-315`

### Purpose

Extends LevelsSet to provide class-based progression with skill trees and dynamic labels.

### Additional Properties

```javascript
{
    // Inherited from LevelsSet:
    owner, key, levels, currentLevel, currentExp, ...

    // ClassPath-specific:
    label: 'Warrior',                // Base display name
    currentLabel: 'Warrior',         // Active label (changes with level)
    labelsByLevel: {                 // Level-specific labels
        1: 'Novice Warrior',
        5: 'Veteran Warrior',
        10: 'Master Warrior'
    },
    skillsByLevel: {                 // Skill instances by level
        1: [swordSkill],
        5: [shieldSkill, bashSkill],
        10: [whirlwindSkill]
    },
    skillsByLevelKeys: {             // Skill keys by level (for serialization)
        1: ['sword-attack'],
        5: ['shield-block', 'bash'],
        10: ['whirlwind']
    },
    currentSkills: {                 // Currently available skills
        'sword-attack': swordSkill,
        'shield-block': shieldSkill
    },
    affectedProperty: 'hp'           // Property affected by class skills
}
```

### Initialization

**Method:** `init(props)` - File: `lib/class-path.js:46-80`

```javascript
let classPath = new ClassPath();
await classPath.init({
    owner: playerEntity,
    key: 'warrior',
    label: 'Warrior',
    labelsByLevel: {
        1: 'Novice Warrior',
        10: 'Master Warrior'
    },
    levels: {
        1: new Level({key: 1, requiredExperience: 0}),
        10: new Level({key: 10, requiredExperience: 5000})
    },
    skillsByLevel: {
        1: [swordSkill],
        10: [masterSkill]
    },
    currentLevel: 1,
    currentExp: 0
});
```

**Initialization Flow:**

```
1. Call parent LevelsSet.init()
   → Sets up levels, XP, modifiers
2. Set label and currentLabel
3. Set labelsByLevel
4. Set skillsByLevel and skillsByLevelKeys
5. Set affectedProperty
6. Call setOwnerSkills()
   → Populates currentSkills with skills up to current level
7. Fire INIT_CLASS_PATH_END event
```

---

### Skill Management

#### Setting Owner Skills

**Method:** `setOwnerSkills(skills)` - File: `lib/class-path.js:82-123`

**Purpose:** Initialize currentSkills based on current level or provided skills.

**Flow:**

```
1. If skills parameter provided:
   → Use provided skills directly
2. Else if skillsByLevel defined:
   → Collect all skills from levels <= currentLevel
   → Build currentSkills object by skill key
3. Fire SET_SKILLS event (params: this, skills)
4. Return currentSkills
```

**Example:**
```javascript
let classPath = new ClassPath();
await classPath.init({
    owner: player,
    skillsByLevel: {
        1: [skill1, skill2],
        5: [skill3],
        10: [skill4]
    },
    currentLevel: 5
});

// currentSkills contains: skill1, skill2, skill3
// skill4 not available (requires level 10)
```

#### Adding Skills

**Method:** `addSkills(skills)` - File: `lib/class-path.js:125-145`

```javascript
await classPath.addSkills([newSkill1, newSkill2]);
```

**Flow:**

```
1. Fire ADD_SKILLS_BEFORE event (params: this, skills)
2. For each skill in skills array:
   → Add to currentSkills by skill.key
3. Fire ADD_SKILLS_AFTER event (params: this, skills)
4. Return currentSkills
```

**Use Cases:**
- Level up unlocked new skills
- Learned skill from trainer
- Equipped item grants temporary skill

#### Removing Skills

**Method:** `removeSkills(skills)` - File: `lib/class-path.js:147-170`

```javascript
await classPath.removeSkills([oldSkill1, oldSkill2]);
```

**Flow:**

```
1. Fire REMOVE_SKILLS_BEFORE event (params: this, skills)
2. For each skill in skills array:
   → Delete from currentSkills by skill.key
3. Fire REMOVE_SKILLS_AFTER event (params: this, skills)
4. Return currentSkills
```

**Use Cases:**
- Skill forgotten or replaced
- Temporary skill expired
- Unequipped item removed skill

---

### Label Management

**Labels change dynamically based on level progression.**

**Method:** `updateLabelByLevel()` - File: `lib/class-path.js:172-182`

```javascript
// Called automatically during levelUp()
classPath.updateLabelByLevel();
```

**Flow:**

```
1. Check if labelsByLevel has entry for currentLevel
2. If yes:
   → Set currentLabel = labelsByLevel[currentLevel]
3. Else:
   → Keep currentLabel unchanged
```

**Example:**
```javascript
let classPath = new ClassPath();
await classPath.init({
    label: 'Warrior',
    labelsByLevel: {
        1: 'Novice Warrior',
        5: 'Veteran Warrior',
        10: 'Master Warrior'
    },
    currentLevel: 1
});

console.log(classPath.currentLabel); // 'Novice Warrior'

await classPath.levelUp(); // Level 2
console.log(classPath.currentLabel); // 'Novice Warrior' (no label for level 2)

// Add XP to reach level 5
await classPath.addExperience(1000);
console.log(classPath.currentLabel); // 'Veteran Warrior'
```

---

### Level Up Override

**Method:** `levelUp()` - File: `lib/class-path.js:184-207`

**ClassPath extends LevelsSet.levelUp() to add skill unlocking and label updates.**

**Flow:**

```
1. Call parent LevelsSet.levelUp()
   → Fires LEVEL_UP event
   → Increments currentLevel
   → Applies level modifiers
2. Update label based on new level
   → updateLabelByLevel()
3. Check if new skills available at this level
   → If skillsByLevel[currentLevel] exists:
     → addSkills(skillsByLevel[currentLevel])
       → Fires ADD_SKILLS_BEFORE
       → Adds skills to currentSkills
       → Fires ADD_SKILLS_AFTER
```

**Example:**
```javascript
let classPath = new ClassPath();
await classPath.init({
    owner: player,
    labelsByLevel: {
        1: 'Novice',
        5: 'Expert'
    },
    skillsByLevel: {
        1: [basicSkill],
        5: [advancedSkill]
    },
    levels: {
        1: new Level({key: 1, requiredExperience: 0}),
        5: new Level({key: 5, requiredExperience: 1000})
    },
    currentLevel: 4,
    currentExp: 999
});

// Add 1 XP to trigger level up
await classPath.addExperience(1);

// Results:
// - currentLevel = 5
// - currentLabel = 'Expert'
// - currentSkills includes advancedSkill
// - Level 5 modifiers applied
```

---

### Event System

**Events Fired by ClassPath:**

All LevelsSet events PLUS:

| Event | When | Parameters |
|-------|------|------------|
| `INIT_CLASS_PATH_END` | After ClassPath initialization | (this) |
| `SET_SKILLS` | After owner skills set | (this, skills) |
| `ADD_SKILLS_BEFORE` | Before adding skills | (this, skills) |
| `ADD_SKILLS_AFTER` | After adding skills | (this, skills) |
| `REMOVE_SKILLS_BEFORE` | Before removing skills | (this, skills) |
| `REMOVE_SKILLS_AFTER` | After removing skills | (this, skills) |

**Example:**
```javascript
classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, async (classPath) => {
    console.log('Class path initialized:', classPath.key);
    console.log('Starting skills:', Object.keys(classPath.currentSkills));
}, 'init-listener');

classPath.listenEvent(SkillsEvents.ADD_SKILLS_AFTER, async (classPath, skills) => {
    console.log('New skills unlocked:');
    skills.forEach(skill => {
        console.log(`- ${skill.key}`);
    });
}, 'skill-unlock-listener');
```

---

## SKILLSSERVER CLASS

**File:** `lib/server.js:11-85`

### Purpose

Server-side wrapper for ClassPath with automatic client synchronization via Sender.

### Properties

```javascript
{
    // All ClassPath properties...

    // SkillsServer-specific:
    client: roomClient,              // Client object with send() and broadcast()
    sender: senderInstance          // Sender instance for message broadcasting
}
```

### Initialization

**Constructor:** `constructor(props)` - File: `lib/server.js:18-50`

```javascript
import {SkillsServer} from '@reldens/skills/lib/server.js';

let skillsServer = new SkillsServer({
    owner: playerEntity,
    client: roomClient, // Must have send() and broadcast() methods
    key: 'warrior',
    label: 'Warrior',
    levels: {
        1: level1,
        5: level5
    },
    skillsByLevel: {
        1: [skill1],
        5: [skill2]
    },
    currentLevel: 1,
    currentExp: 0
});
```

**Initialization Flow:**

```
1. Validate client has send() method
   → If missing: throw error
2. Validate client has broadcast() method
   → If missing: throw error
3. Call parent ClassPath.init()
   → Initializes levels, skills, XP
4. Create Sender instance
   → Pass this (ClassPath) and client
5. Call sender.registerListeners()
   → Sets up event listeners for client sync
```

**Client Validation:**
```javascript
// Client must implement:
class RoomClient {
    send(message) {
        // Send to this client only
    }

    broadcast(message) {
        // Send to all clients in room
    }
}
```

---

### Server-Client Synchronization

**SkillsServer automatically broadcasts level/skill changes to clients via Sender.**

**Registered Events (via Sender):**

| Event | Message Action | Behavior | Data Sent |
|-------|---------------|----------|-----------|
| `INIT_CLASS_PATH_END` | `ACTION_INIT_CLASS_PATH_END` | SEND | level, label, XP, skills |
| `LEVEL_UP` | `ACTION_LEVEL_UP` | SEND | level, label, skills, nextXP |
| `LEVEL_EXPERIENCE_ADDED` | `ACTION_LEVEL_EXPERIENCE_ADDED` | SEND | current XP |
| `SKILL_BEFORE_CAST` | `ACTION_SKILL_BEFORE_CAST` | BROADCAST | skill key, owner |
| `SKILL_ATTACK_APPLY_DAMAGE` | `ACTION_SKILL_ATTACK_APPLY_DAMAGE` | BROADCAST | damage, target, skill |

**Message Format:**
```javascript
{
    act: 'rski.Lu',  // Action constant (LEVEL_UP)
    owner: 'player-123',
    data: {
        lvl: 5,              // Current level
        lab: 'Expert Warrior', // Current label
        ne: 2000,            // Next level XP
        skl: ['sword', 'shield'] // Skill keys
    }
}
```

**Example Usage:**
```javascript
// Server side
let skillsServer = new SkillsServer({
    owner: player,
    client: roomClient,
    key: 'warrior',
    levels: levels,
    skillsByLevel: skillsByLevel
});

// When player gains XP:
await skillsServer.addExperience(500);

// Automatically sends message to client:
// {
//     act: 'rski.Ea',
//     owner: player.id,
//     data: {exp: 500}
// }

// If leveled up, also sends:
// {
//     act: 'rski.Lu',
//     owner: player.id,
//     data: {lvl: 2, lab: 'Novice', ne: 200, skl: ['skill1', 'skill2']}
// }
```

---

## COMPLETE PROGRESSION FLOW

### Example: Player Progression from Level 1 to 10

```javascript
import {SkillsServer} from '@reldens/skills/lib/server.js';
import {Level} from '@reldens/skills/lib/level.js';
import {Modifier} from '@reldens/modifiers';

// 1. Define levels with modifiers
let levels = {
    1: new Level({
        key: 1,
        label: 'Novice',
        requiredExperience: 0,
        modifiers: [
            new Modifier({key: 'hp-1', propertyKey: 'stats.hp', operation: '+', value: 50})
        ]
    }),
    5: new Level({
        key: 5,
        label: 'Veteran',
        requiredExperience: 1000,
        modifiers: [
            new Modifier({key: 'hp-5', propertyKey: 'stats.hp', operation: '+', value: 150}),
            new Modifier({key: 'atk-5', propertyKey: 'stats.atk', operation: '+', value: 20})
        ]
    }),
    10: new Level({
        key: 10,
        label: 'Master',
        requiredExperience: 5000,
        modifiers: [
            new Modifier({key: 'hp-10', propertyKey: 'stats.hp', operation: '+', value: 300}),
            new Modifier({key: 'atk-10', propertyKey: 'stats.atk', operation: '+', value: 50}),
            new Modifier({key: 'def-10', propertyKey: 'stats.def', operation: '+', value: 30})
        ]
    })
};

// 2. Define skills by level
let skillsByLevel = {
    1: [basicSwordSkill],
    5: [powerAttackSkill, shieldBlockSkill],
    10: [ultimateSkill]
};

// 3. Initialize SkillsServer
let skillsServer = new SkillsServer({
    owner: player,
    client: roomClient,
    key: 'warrior-path',
    label: 'Warrior',
    labelsByLevel: {
        1: 'Novice Warrior',
        5: 'Veteran Warrior',
        10: 'Master Warrior'
    },
    levels: levels,
    skillsByLevel: skillsByLevel,
    currentLevel: 1,
    currentExp: 0,
    autoFillRanges: true,
    increaseLevelsWithExperience: true
});

// 4. Player gains XP from killing monster
await skillsServer.addExperience(250);
// - currentExp = 250
// - Still level 1
// - Client receives: {act: 'rski.Ea', data: {exp: 250}}

// 5. Player gains more XP
await skillsServer.addExperience(750);
// - currentExp = 1000
// - Levels up: 1 → 2 → 3 → 4 → 5 (auto-filled levels)
// - currentLevel = 5
// - currentLabel = 'Veteran Warrior'
// - Modifiers changed: -50 HP, +150 HP, +20 ATK = net +100 HP, +20 ATK
// - Skills added: powerAttackSkill, shieldBlockSkill
// - Client receives:
//   - {act: 'rski.Ea', data: {exp: 1000}}
//   - {act: 'rski.Lu', data: {lvl: 5, lab: 'Veteran Warrior', ...}}

// 6. Player continues to level 10
await skillsServer.addExperience(4000);
// - currentExp = 5000
// - Levels up: 5 → 6 → 7 → 8 → 9 → 10
// - currentLevel = 10
// - currentLabel = 'Master Warrior'
// - Modifiers changed: -150 HP, -20 ATK, +300 HP, +50 ATK, +30 DEF
// - Skills added: ultimateSkill
// - Client receives level up messages

// 7. At max level, can still gain XP but won't level up
await skillsServer.addExperience(1000);
// - currentExp = 6000 (above max required)
// - Still level 10
// - Client receives: {act: 'rski.Ea', data: {exp: 6000}}
```

---

## COMMON PATTERNS

### Pattern #1: Multi-Class System

```javascript
let classes = {
    warrior: new SkillsServer({
        owner: player,
        client: client,
        key: 'warrior',
        label: 'Warrior',
        levels: warriorLevels,
        skillsByLevel: warriorSkills
    }),
    mage: new SkillsServer({
        owner: player,
        client: client,
        key: 'mage',
        label: 'Mage',
        levels: mageLevels,
        skillsByLevel: mageSkills
    })
};

// Level up specific class
await classes.warrior.addExperience(500);
await classes.mage.addExperience(300);
```

---

### Pattern #2: Skill Tree with Prerequisites

```javascript
let classPath = new ClassPath();
await classPath.init({
    owner: player,
    skillsByLevel: {
        1: [basicSkill],
        5: [intermediateSkill], // Requires level 5
        10: [advancedSkill]     // Requires level 10
    }
});

// Check if player meets skill requirement
function canLearnSkill(skill, classPath) {
    for(let [level, skills] of Object.entries(classPath.skillsByLevel)) {
        if(skills.includes(skill)) {
            return classPath.currentLevel >= parseInt(level);
        }
    }
    return false;
}
```

---

### Pattern #3: Prestige/Rebirth System

```javascript
async function prestigeClass(classPath) {
    // Store current level for rewards
    let prestigeLevel = classPath.currentLevel;

    // Reset to level 1
    while(classPath.currentLevel > 1) {
        await classPath.levelDown();
    }
    classPath.currentExp = 0;

    // Apply prestige bonus (permanent modifier)
    let prestigeBonus = new Modifier({
        key: `prestige-${prestigeLevel}`,
        propertyKey: 'stats.prestigeBonus',
        operation: '+',
        value: prestigeLevel * 10
    });
    sc.applyModifier(classPath.owner, prestigeBonus);

    return prestigeLevel;
}
```

---

### Pattern #4: Experience Gain with Modifiers

```javascript
function calculateXpGain(baseXp, player) {
    let xpModifier = 1.0;

    // XP boost items
    if(player.hasItem('xp-potion')) {
        xpModifier += 0.5; // +50% XP
    }

    // Party bonus
    if(player.inParty) {
        xpModifier += 0.2; // +20% XP
    }

    // Level difference penalty
    let levelDiff = player.level - monster.level;
    if(levelDiff > 5) {
        xpModifier *= 0.5; // -50% XP for easy monsters
    }

    return Math.floor(baseXp * xpModifier);
}

// Usage
let xpGained = calculateXpGain(100, player);
await classPath.addExperience(xpGained);
```

---

### Pattern #5: Skill Point System

```javascript
class SkillPointClassPath extends ClassPath {
    constructor(props) {
        super(props);
        this.skillPoints = 0;
    }

    async levelUp() {
        await super.levelUp();
        this.skillPoints += 1; // Gain 1 skill point per level
    }

    async learnSkill(skill, cost = 1) {
        if(this.skillPoints < cost) {
            return {error: 'Not enough skill points'};
        }
        this.skillPoints -= cost;
        await this.addSkills([skill]);
        return {success: true};
    }
}
```

---

## DEBUGGING LEVEL PROGRESSION

### Check Current State

```javascript
console.log('=== ClassPath State ===');
console.log('Key:', classPath.key);
console.log('Current Level:', classPath.currentLevel);
console.log('Current Label:', classPath.currentLabel);
console.log('Current XP:', classPath.currentExp);
console.log('Next Level XP:', classPath.getNextLevelExperience());
console.log('Available Skills:', Object.keys(classPath.currentSkills));
console.log('Total Levels:', Object.keys(classPath.levels).length);
```

### Track Level Changes

```javascript
classPath.listenEvent(SkillsEvents.LEVEL_UP, async (cp) => {
    console.log('[LEVEL UP]', cp.currentLevel, '-', cp.currentLabel);
    console.log('  Skills:', Object.keys(cp.currentSkills));
}, 'debug-level-up');

classPath.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, async (
    cp, xpAdded, newTotal, currentIdx, nextIdx, nextKey, nextLevel, nextXP, isLevelUp
) => {
    console.log('[XP GAIN]', `+${xpAdded}`, `(${newTotal}/${nextXP})`);
    if(isLevelUp) {
        console.log('  → LEVELED UP!');
    }
}, 'debug-xp-gain');
```

### Verify Modifier Application

```javascript
classPath.listenEvent(SkillsEvents.LEVEL_APPLY_MODIFIERS, async (cp) => {
    console.log('[MODIFIERS] Applying level', cp.currentLevel, 'modifiers');
    let level = cp.levels[cp.currentLevel];
    if(level && level.modifiers) {
        level.modifiers.forEach(mod => {
            console.log(`  ${mod.propertyKey} ${mod.operation} ${mod.value}`);
        });
    }
}, 'debug-modifiers');
```

---

## COMMON PITFALLS

### ❌ PITFALL 1: Not Awaiting Level Operations

```javascript
// BAD
classPath.levelUp(); // Missing await
console.log(classPath.currentLevel); // May not be updated yet

// GOOD
await classPath.levelUp();
console.log(classPath.currentLevel); // Guaranteed updated
```

---

### ❌ PITFALL 2: Assuming Auto-Level-Up Without Flag

```javascript
// BAD
let classPath = new ClassPath();
await classPath.init({
    levels: levels,
    currentLevel: 1
    // increaseLevelsWithExperience not set (defaults to false)
});
await classPath.addExperience(1000);
console.log(classPath.currentLevel); // Still 1! No auto-level-up

// GOOD
await classPath.init({
    levels: levels,
    currentLevel: 1,
    increaseLevelsWithExperience: true // Enable auto-level-up
});
await classPath.addExperience(1000);
console.log(classPath.currentLevel); // Leveled up correctly
```

---

### ❌ PITFALL 3: Modifying levels After Initialization

```javascript
// BAD
await classPath.init({levels: levels});
classPath.levels[20] = new Level({key: 20, requiredExperience: 10000});
// LevelsByExperience not updated! Sorting broken!

// GOOD
levels[20] = new Level({key: 20, requiredExperience: 10000});
await classPath.init({levels: levels}); // Include new level in init
```

---

### ❌ PITFALL 4: Reusing Skill Instances Across Classes

```javascript
// BAD
let sharedSkill = new Skill({owner: player});
let warriorPath = new ClassPath({skillsByLevel: {1: [sharedSkill]}});
let magePath = new ClassPath({skillsByLevel: {1: [sharedSkill]}});
// Skill has single owner reference - conflicts!

// GOOD
let warriorSkill = new Skill({owner: player, key: 'warrior-basic'});
let mageSkill = new Skill({owner: player, key: 'mage-basic'});
let warriorPath = new ClassPath({skillsByLevel: {1: [warriorSkill]}});
let magePath = new ClassPath({skillsByLevel: {1: [mageSkill]}});
```

---

## REFERENCES

- Level: `lib/level.js:9-33`
- LevelsSet: `lib/levels-set.js:11-298`
- ClassPath: `lib/class-path.js:11-315`
- SkillsServer: `lib/server.js:11-85`
- Sender: `lib/server/sender.js:11-212`
- Event Names: `lib/skills-events.js`
- Event System: `.claude/event-system-architecture.md`
- Skill Execution: `.claude/skill-execution-flow.md`
