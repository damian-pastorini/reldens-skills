# CLASS HIERARCHY AND RELATIONSHIPS
## Complete Architecture Reference

---

## OVERVIEW

This document provides a comprehensive view of the @reldens/skills package architecture, including class inheritance, composition relationships, dependencies, and integration patterns.

---

## CLASS INHERITANCE HIERARCHY

```
EventsManagerSingleton (from @reldens/utils)
        ↓
        ├── Level (standalone)
        │
        ├── LevelsSet
        │       ├── init()
        │       ├── levelUp()
        │       ├── levelDown()
        │       ├── addExperience()
        │       └── applyLevelModifiers()
        │       ↓
        │   ClassPath extends LevelsSet
        │       ├── (inherits all LevelsSet methods)
        │       ├── setOwnerSkills()
        │       ├── addSkills()
        │       ├── removeSkills()
        │       └── levelUp() [overridden]
        │       ↓
        │   SkillsServer extends ClassPath
        │       ├── (inherits all ClassPath methods)
        │       └── constructor() [creates Sender]
        │
        └── Skill
                ├── execute()
                ├── validate()
                ├── runSkillLogic() [abstract]
                ├── applyModifiers()
                └── getCriticalDiff()
                ↓
            Attack extends Skill
                ├── (inherits all Skill methods)
                └── runSkillLogic() [damage calculation]
                ↓
            PhysicalAttack extends Attack
                ├── (inherits all Attack methods)
                └── runSkillLogic() [physics-based damage]

            Effect extends Skill
                ├── (inherits all Skill methods)
                └── runSkillLogic() [modifier application]
                ↓
            PhysicalEffect extends Effect
                ├── (inherits all Effect methods)
                └── runSkillLogic() [physics-based effects]
```

---

## CLASS DETAILS

### Level (lib/level.js)

**Type:** Data Container
**Extends:** None
**Dependencies:**
- @reldens/utils: `sc` (Shortcuts)

**Properties:**
```javascript
{
    key: number,              // Level number (integer)
    label: string,            // Display name
    requiredExperience: number, // Total XP needed
    modifiers: Array<Modifier>  // @reldens/modifiers instances
}
```

**Purpose:** Represents a single level with associated modifiers and XP requirement.

**Relationships:**
- **Used by:** LevelsSet, ClassPath
- **Contains:** Modifier instances (from @reldens/modifiers)

---

### LevelsSet (lib/levels-set.js)

**Type:** Base Class
**Extends:** None (uses EventsManagerSingleton)
**Dependencies:**
- @reldens/utils: `sc`, `EventsManagerSingleton`
- @reldens/modifiers: (indirectly through Level modifiers)

**Properties:**
```javascript
{
    owner: Entity,            // Entity with getPosition()
    key: string,              // LevelsSet identifier
    levels: Object<Level>,    // Level instances by key
    currentLevel: number,     // Current level number
    currentExp: number,       // Current experience
    autoFillRanges: boolean,  // Auto-generate levels
    increaseLevelsWithExperience: boolean, // Auto level-up
    events: EventsManager,    // Event system instance
    previousLevel: Level      // Last level for modifier reversion
}
```

**Methods:**
```javascript
// Initialization
async init(props)

// Level Management
async levelUp()
async levelDown()
async applyLevelModifiers()

// Experience Management
async addExperience(number)
getNextLevelExperience()

// Level Configuration
async setLevels(levels)
autoFillLevelRanges(levels)

// Event System
async fireEvent(eventName, ...args)
listenEvent(eventName, callback, removeKey, masterKey)
eventFullName(eventName)
getOwnerEventKey()
```

**Purpose:** Manages level progression, experience tracking, and modifier application.

**Relationships:**
- **Contains:** Level instances
- **Extended by:** ClassPath
- **Used by:** SkillsServer (via ClassPath)

---

### ClassPath (lib/class-path.js)

**Type:** Extended Class
**Extends:** LevelsSet
**Dependencies:**
- Same as LevelsSet
- Skill instances

**Additional Properties:**
```javascript
{
    label: string,                    // Base class label
    currentLabel: string,             // Active label
    labelsByLevel: Object<string>,    // Level-specific labels
    skillsByLevel: Object<Array<Skill>>, // Skills by level
    skillsByLevelKeys: Object<Array<string>>, // Skill keys by level
    currentSkills: Object<Skill>,     // Available skills
    affectedProperty: string          // Property for skills
}
```

**Additional Methods:**
```javascript
// Skill Management
async setOwnerSkills(skills)
async addSkills(skills)
async removeSkills(skills)

// Label Management
updateLabelByLevel()

// Overridden
async levelUp() // Extended with skill unlocking
```

**Purpose:** Extends LevelsSet with skill trees and class-specific progression.

**Relationships:**
- **Extends:** LevelsSet
- **Contains:** Skill instances
- **Extended by:** SkillsServer
- **Uses:** Sender (in SkillsServer)

---

### SkillsServer (lib/server.js)

**Type:** Server Wrapper
**Extends:** ClassPath
**Dependencies:**
- Same as ClassPath
- Sender instance

**Additional Properties:**
```javascript
{
    client: Client,           // Client with send() and broadcast()
    sender: Sender           // Message sender instance
}
```

**Additional Methods:**
```javascript
constructor(props) // Creates and initializes ClassPath + Sender
```

**Purpose:** Server-side ClassPath wrapper with automatic client synchronization.

**Relationships:**
- **Extends:** ClassPath
- **Contains:** Sender instance
- **Requires:** Client object

---

### Skill (lib/skill.js)

**Type:** Base Class
**Extends:** None (uses EventsManagerSingleton)
**Dependencies:**
- @reldens/utils: `sc`, `EventsManagerSingleton`, `InteractionArea`
- @reldens/modifiers: `Condition`

**Properties:**
```javascript
{
    key: string,                     // Unique identifier
    owner: Entity,                   // Entity with getPosition()
    target: Entity,                  // Target entity
    range: number,                   // Skill range (0 = infinite)
    rangeAutomaticValidation: boolean, // Auto-validate range
    allowSelfTarget: boolean,        // Allow self-targeting
    usesLimit: number,               // Max uses (0 = unlimited)
    usesCount: number,               // Current use count
    ownerConditions: Array<Condition>, // Owner validation conditions
    ownerEffects: Array<Modifier>,   // Effects applied to owner
    skillDelay: number,              // Cooldown in ms
    canActivate: boolean,            // Cooldown state
    castTime: number,                // Cast time in ms
    criticalChance: number,          // Critical probability (0-1)
    criticalMultiplier: number,      // Critical damage multiplier
    criticalFixedValue: number,      // Fixed critical bonus
    lastAppliedModifiers: Object,    // Last modifier results
    events: EventsManager           // Event system instance
}
```

**Methods:**
```javascript
// Execution
async execute(target)
async validate()
async runSkillLogic() // Abstract - override in subclasses

// Critical System
applyCriticalValue(value)
getCriticalDiff(value)
canCriticalHit()

// Modifier Application
applyModifiers(modifiersObjectList, target, avoidCritical)

// Hooks
onExecuteConditions() // Override for custom validation

// Event System
async fireEvent(eventName, ...args)
listenEvent(eventName, callback, removeKey, masterKey)
eventFullName(eventName)
getOwnerEventKey()
```

**Purpose:** Base class for all skill types with validation, execution, and modifier systems.

**Relationships:**
- **Extended by:** Attack, Effect
- **Used by:** ClassPath (in skillsByLevel)
- **Requires:** Owner entity
- **Uses:** Condition, Modifier (from @reldens/modifiers)

---

### Attack (lib/types/attack.js)

**Type:** Skill Type
**Extends:** Skill
**Dependencies:** Same as Skill

**Additional Properties:**
```javascript
{
    affectedProperty: string,         // Target property to damage
    hitDamage: number,                // Base damage at 100%
    applyDirectDamage: boolean,       // Skip calculations
    attackProperties: Array<string>,  // Owner attack properties
    defenseProperties: Array<string>, // Target defense properties
    aimProperties: Array<string>,     // Owner aim properties
    dodgeProperties: Array<string>,   // Target dodge properties
    dodgeFullEnabled: boolean,        // Enable complete dodge
    dodgeOverAimSuccess: number,      // Dodge threshold multiplier
    damageAffected: boolean,          // Apply dodge/aim to damage
    criticalAffected: boolean,        // Apply dodge/aim to critical
    propertiesTotalOperators: Object, // Custom operators for totals
    allowEffectBelowZero: boolean     // Allow negative values
}
```

**Overridden Methods:**
```javascript
async runSkillLogic() // Damage calculation and application
```

**Purpose:** Damage-based skills with attack/defense and dodge/aim systems.

**Relationships:**
- **Extends:** Skill
- **Extended by:** PhysicalAttack
- **Used by:** ClassPath (as skill instance)

---

### Effect (lib/types/effect.js)

**Type:** Skill Type
**Extends:** Skill
**Dependencies:** Same as Skill

**Additional Properties:**
```javascript
{
    targetEffects: Array<Modifier>    // Modifiers applied to target
}
```

**Overridden Methods:**
```javascript
async runSkillLogic() // Modifier application to target
```

**Purpose:** Modifier-based skills (buffs/debuffs).

**Relationships:**
- **Extends:** Skill
- **Extended by:** PhysicalEffect
- **Used by:** ClassPath (as skill instance)

---

### PhysicalAttack (lib/types/physical-attack.js)

**Type:** Skill Type
**Extends:** Attack
**Dependencies:**
- Same as Attack
- PhysicalPropertiesValidator
- PhysicalSkillRunner

**Additional Properties:**
```javascript
{
    magnitude: number,           // Physics force
    objectWidth: number,         // Collision body width
    objectHeight: number,        // Collision body height
    validateTargetOnHit: boolean // Verify target on collision
}
```

**Overridden Methods:**
```javascript
async runSkillLogic() // Physics-based attack execution
```

**Purpose:** Attack skills with physics/collision detection.

**Relationships:**
- **Extends:** Attack
- **Requires:** Owner implements `executePhysicalSkill()`
- **Uses:** PhysicalPropertiesValidator, PhysicalSkillRunner

---

### PhysicalEffect (lib/types/physical-effect.js)

**Type:** Skill Type
**Extends:** Effect
**Dependencies:**
- Same as Effect
- PhysicalPropertiesValidator
- PhysicalSkillRunner

**Additional Properties:**
```javascript
{
    magnitude: number,           // Physics force
    objectWidth: number,         // Collision body width
    objectHeight: number,        // Collision body height
    validateTargetOnHit: boolean // Verify target on collision
}
```

**Overridden Methods:**
```javascript
async runSkillLogic() // Physics-based effect execution
```

**Purpose:** Effect skills with physics/collision detection.

**Relationships:**
- **Extends:** Effect
- **Requires:** Owner implements `executePhysicalSkill()`
- **Uses:** PhysicalPropertiesValidator, PhysicalSkillRunner

---

## COMPOSITION RELATIONSHIPS

### LevelsSet Composition

```
LevelsSet
    ├── contains: Level[]
    │   └── Level
    │       └── contains: Modifier[] (from @reldens/modifiers)
    │
    └── uses: EventsManagerSingleton (from @reldens/utils)
```

### ClassPath Composition

```
ClassPath (extends LevelsSet)
    ├── inherits: LevelsSet composition
    │
    ├── contains: Skill[]
    │   └── Skill (Attack, Effect, PhysicalAttack, PhysicalEffect)
    │       ├── contains: Condition[] (from @reldens/modifiers)
    │       └── contains: Modifier[] (from @reldens/modifiers)
    │
    └── skillsByLevel: {level: Skill[]}
```

### SkillsServer Composition

```
SkillsServer (extends ClassPath)
    ├── inherits: ClassPath composition
    │
    ├── contains: Sender
    │   ├── listens to: ClassPath events
    │   └── uses: Client (send/broadcast)
    │
    └── uses: Client
```

---

## SERVER-CLIENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐        ┌──────────────┐                │
│  │ SkillsServer  │───────▶│  ClassPath   │                │
│  │  (wrapper)    │        │ (progression)│                │
│  └───────┬───────┘        └──────┬───────┘                │
│          │                       │                          │
│          │ creates               │ fires events             │
│          │                       │                          │
│          ▼                       ▼                          │
│  ┌───────────────┐        ┌──────────────┐                │
│  │    Sender     │◀───────│   Events     │                │
│  │ (broadcaster) │listens │   Manager    │                │
│  └───────┬───────┘        └──────────────┘                │
│          │                                                  │
│          │ sends messages                                   │
│          │                                                  │
└──────────┼──────────────────────────────────────────────────┘
           │
           │ Network (WebSocket, etc.)
           │
┌──────────▼──────────────────────────────────────────────────┐
│                       CLIENT SIDE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐        ┌──────────────┐                │
│  │   Receiver    │───────▶│  UI/Game     │                │
│  │ (processor)   │updates │   Client     │                │
│  └───────▲───────┘        └──────────────┘                │
│          │                                                  │
│          │ receives messages                                │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Message Flow Example:

```
1. SERVER: Player gains XP
   ├─▶ SkillsServer.addExperience(500)
   │   └─▶ ClassPath.addExperience(500)
   │       └─▶ Fires LEVEL_EXPERIENCE_ADDED event
   │
2. SERVER: Sender catches event
   ├─▶ Sender.sendExperienceData(classPath)
   │   └─▶ client.send({act: 'rski.Ea', data: {exp: 500}})
   │
3. NETWORK: Message transmitted
   │
4. CLIENT: Receiver processes message
   └─▶ Receiver.processMessage({act: 'rski.Ea', ...})
       └─▶ Receiver.onLevelExperienceAdded(message)
           └─▶ Update UI (XP bar, etc.)
```

---

## EXTERNAL DEPENDENCIES

### @reldens/utils

**Used by:** All classes

**Imports:**
- `sc` (Shortcuts): Property getters/setters, modifier application
- `EventsManagerSingleton`: Global event system
- `InteractionArea`: Range validation (used by Skill)
- `Logger`: Logging utility

**Key Methods Used:**
```javascript
// Shortcuts
sc.get(object, path, defaultValue)
sc.hasOwn(object, property)
sc.applyModifier(target, modifier)
sc.revertModifier(target, modifier)

// EventsManager
EventsManagerSingleton.on(eventName, callback)
EventsManagerSingleton.onWithKey(eventName, callback, removeKey, masterKey)
EventsManagerSingleton.emit(eventName, ...args)
EventsManagerSingleton.removeAllListeners()

// InteractionArea
InteractionArea.isValidInteraction(area1, area2, distance)
```

---

### @reldens/modifiers

**Used by:** Level, Skill, Attack, Effect

**Imports:**
- `Modifier`: Modifier instances for buffs/debuffs
- `Condition`: Validation conditions
- `PropertyManager`: Property management (indirect)
- `Calculator`: Modifier calculation (indirect)

**Key Patterns:**
```javascript
// Creating modifiers
let modifier = new Modifier({
    key: 'hp-buff',
    propertyKey: 'stats.hp',
    operation: '+',
    value: 50
});

// Using modifiers in skills
modifier.target = target;
let newValue = modifier.getModifiedValue(); // Returns modified value
modifier.setOwnerProperty(modifier.propertyKey, newValue);

// Creating conditions
let condition = new Condition({
    key: 'has-mana',
    propertyKey: 'stats.mp',
    operation: '>=',
    value: 50
});

// Validating conditions
let isValid = condition.isValid(owner);
```

---

## OWNER ENTITY REQUIREMENTS

### Minimum Requirements for All Classes

**For LevelsSet / ClassPath:**

```javascript
class MinimalOwner {
    constructor() {
        this.position = {x: 0, y: 0};
    }

    getPosition() {
        return this.position;
    }

    // Required for event system
    get eventsPrefix() {
        return 'skills.ownerId.' + this.id;
    }
}
```

---

### Requirements for Skills

**Basic Skills:**

```javascript
class SkillOwner extends MinimalOwner {
    isInRange(skill, target, range) {
        if(range === 0) return true;
        let distance = this.getDistanceTo(target);
        return distance <= range;
    }

    getDistanceTo(target) {
        let dx = this.position.x - target.position.x;
        let dy = this.position.y - target.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
```

---

**Skills with Cast Time:**

```javascript
class CastingOwner extends SkillOwner {
    constructor() {
        super();
        this.isCasting = false; // Required for cast time
    }
}
```

---

**Physical Skills:**

```javascript
class PhysicalOwner extends CastingOwner {
    async executePhysicalSkill(target, skill, executeOnHit) {
        // Create physics body with skill.objectWidth, skill.objectHeight
        let body = this.physicsEngine.createBody({
            width: skill.objectWidth,
            height: skill.objectHeight,
            position: this.position
        });

        // Apply force/magnitude
        body.applyForce(skill.magnitude, this.directionToTarget(target));

        // Handle collision
        body.onCollision((collidedEntity) => {
            if(collidedEntity === target) {
                executeOnHit(target);
            }
        });

        return true;
    }
}
```

---

### Requirements for Client

**SkillsServer Client:**

```javascript
class GameClient {
    send(message) {
        // Send message to this client only
        this.connection.send(JSON.stringify(message));
    }

    broadcast(message) {
        // Send message to all clients in room
        this.room.broadcast(JSON.stringify(message));
    }
}
```

---

## INTEGRATION PATTERNS

### Pattern #1: Basic Single-Class Setup

```javascript
import {ClassPath} from '@reldens/skills/lib/class-path.js';
import {Level} from '@reldens/skills/lib/level.js';
import {Skill} from '@reldens/skills/lib/skill.js';

// Create levels
let levels = {
    1: new Level({key: 1, requiredExperience: 0}),
    5: new Level({key: 5, requiredExperience: 1000})
};

// Create skills
let skill1 = new Skill({key: 'basic', owner: player});
let skill2 = new Skill({key: 'advanced', owner: player});

// Initialize class path
let classPath = new ClassPath();
await classPath.init({
    owner: player,
    key: 'warrior',
    levels: levels,
    skillsByLevel: {
        1: [skill1],
        5: [skill2]
    }
});
```

---

### Pattern #2: Server-Side Multi-Class System

```javascript
import {SkillsServer} from '@reldens/skills/lib/server.js';

class PlayerClassManager {
    constructor(player, client) {
        this.player = player;
        this.client = client;
        this.classes = {};
    }

    async createClass(key, config) {
        this.classes[key] = new SkillsServer({
            owner: this.player,
            client: this.client,
            key: key,
            label: config.label,
            levels: config.levels,
            skillsByLevel: config.skillsByLevel
        });
        return this.classes[key];
    }

    async addXP(classKey, amount) {
        if(!this.classes[classKey]) {
            throw new Error('Class not found: ' + classKey);
        }
        await this.classes[classKey].addExperience(amount);
    }

    getClass(classKey) {
        return this.classes[classKey];
    }
}
```

---

### Pattern #3: Client-Side Integration

```javascript
import {Receiver} from '@reldens/skills/lib/client/receiver.js';

class SkillsUI extends Receiver {
    constructor(owner) {
        super({owner});
        this.xpBar = document.getElementById('xp-bar');
        this.levelDisplay = document.getElementById('level');
        this.skillsContainer = document.getElementById('skills');
    }

    onLevelUp(message) {
        // Update UI on level up
        this.levelDisplay.textContent = message.data.lvl;
        this.updateSkillsDisplay(message.data.skl);
        this.showLevelUpAnimation();
    }

    onLevelExperienceAdded(message) {
        // Update XP bar
        let percentage = (message.data.exp / message.data.ne) * 100;
        this.xpBar.style.width = percentage + '%';
    }

    updateSkillsDisplay(skillKeys) {
        this.skillsContainer.innerHTML = '';
        skillKeys.forEach(key => {
            let skillButton = this.createSkillButton(key);
            this.skillsContainer.appendChild(skillButton);
        });
    }
}

// Initialize
let skillsUI = new SkillsUI(player);
gameClient.onMessage('*', (message) => {
    skillsUI.processMessage(message);
});
```

---

### Pattern #4: Custom Skill Type

```javascript
import {Skill} from '@reldens/skills/lib/skill.js';

class HealSkill extends Skill {
    constructor(props) {
        super(props);
        this.healAmount = props.healAmount || 50;
        this.affectedProperty = props.affectedProperty || 'hp';
    }

    async runSkillLogic() {
        // Validate target
        if(!this.target) {
            return {error: 'TARGET_NOT_AVAILABLE'};
        }

        // Calculate heal (with critical)
        let healAmount = this.healAmount;
        healAmount = healAmount + this.getCriticalDiff(healAmount);

        // Apply heal
        let currentValue = sc.get(this.target, this.affectedProperty, 0);
        let maxValue = sc.get(this.target, 'stats.maxHp', 100);
        let newValue = Math.min(currentValue + healAmount, maxValue);

        sc.set(this.target, this.affectedProperty, newValue);

        // Fire custom event
        await this.fireEvent('SKILL_HEAL_APPLIED', this, this.target, healAmount, newValue);

        return {
            healed: healAmount,
            [this.affectedProperty]: newValue
        };
    }
}
```

---

### Pattern #5: Persistent Storage Integration

```javascript
class PersistentClassPath extends ClassPath {
    async init(props) {
        // Load from database
        let savedData = await database.loadClassPath(props.owner.id, props.key);

        if(savedData) {
            // Restore saved state
            props.currentLevel = savedData.currentLevel;
            props.currentExp = savedData.currentExp;
        }

        await super.init(props);

        // Listen for changes to save
        this.listenEvent(SkillsEvents.LEVEL_UP, async (cp) => {
            await this.save();
        }, 'persistent-level-up');

        this.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, async (cp) => {
            await this.save();
        }, 'persistent-xp-added');
    }

    async save() {
        await database.saveClassPath(this.owner.id, this.key, {
            currentLevel: this.currentLevel,
            currentExp: this.currentExp,
            currentSkills: Object.keys(this.currentSkills)
        });
    }
}
```

---

## CLASS RESPONSIBILITY SUMMARY

| Class | Primary Responsibility | Key Methods | Events |
|-------|------------------------|-------------|--------|
| **Level** | Store level data | (constructor only) | None |
| **LevelsSet** | Manage level progression and XP | init, levelUp, addExperience | LEVEL_UP, LEVEL_EXPERIENCE_ADDED |
| **ClassPath** | Add skill trees to progression | setOwnerSkills, addSkills, removeSkills | ADD_SKILLS_*, REMOVE_SKILLS_* |
| **SkillsServer** | Server-client synchronization | (constructor) | (via Sender) |
| **Skill** | Base skill execution | execute, validate, applyModifiers | SKILL_BEFORE_EXECUTE, VALIDATE_* |
| **Attack** | Damage-based skills | runSkillLogic (damage calc) | SKILL_ATTACK_APPLY_DAMAGE |
| **Effect** | Modifier-based skills | runSkillLogic (modifiers) | SKILL_EFFECT_TARGET_MODIFIERS |
| **PhysicalAttack** | Physics-based attacks | runSkillLogic (physics) | SKILL_PHYSICAL_ATTACK_HIT |
| **PhysicalEffect** | Physics-based effects | runSkillLogic (physics) | SKILL_PHYSICAL_EFFECT_HIT |
| **Sender** | Broadcast server events to clients | register, send methods | (listens to ClassPath events) |
| **Receiver** | Process client messages | processMessage, on* methods | None |

---

## DEPENDENCY GRAPH

```
┌────────────────────────────────────────────────────────┐
│              EXTERNAL PACKAGES                         │
├────────────────────────────────────────────────────────┤
│  @reldens/utils           @reldens/modifiers          │
│  ├─ Shortcuts (sc)        ├─ Modifier                 │
│  ├─ EventsManagerSingleton├─ Condition                │
│  ├─ InteractionArea       └─ Calculator               │
│  └─ Logger                                             │
└────────┬──────────────────────────┬────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐        ┌───────────────────┐
│     Level       │◀───────│   LevelsSet       │
│  (standalone)   │contains│ (progression)     │
└─────────────────┘        └─────────┬─────────┘
                                     │ extends
                                     ▼
                           ┌───────────────────┐
                           │    ClassPath      │
                           │  (skill trees)    │
                           └─────────┬─────────┘
                                     │ extends
                                     ▼
                           ┌───────────────────┐        ┌──────────┐
                           │  SkillsServer     │◀───────│  Sender  │
                           │   (server)        │creates │(broadcast)│
                           └───────────────────┘        └──────────┘

┌──────────┐        ┌────────────┐        ┌──────────────────┐
│  Skill   │◀───────│   Attack   │◀───────│ PhysicalAttack   │
│  (base)  │extends │  (damage)  │extends │  (physics)       │
└────┬─────┘        └────────────┘        └──────────────────┘
     │ extends
     ▼
┌────────────┐        ┌──────────────────┐
│   Effect   │◀───────│ PhysicalEffect   │
│(modifiers) │extends │  (physics)       │
└────────────┘        └──────────────────┘

                      ┌──────────┐
                      │ Receiver │
                      │ (client) │
                      └──────────┘
```

---

## REFERENCES

- Level: `lib/level.js:9-33`
- LevelsSet: `lib/levels-set.js:11-298`
- ClassPath: `lib/class-path.js:11-315`
- SkillsServer: `lib/server.js:11-85`
- Skill: `lib/skill.js:12-348`
- Attack: `lib/types/attack.js:14-145`
- Effect: `lib/types/effect.js:14-70`
- PhysicalAttack: `lib/types/physical-attack.js:16-118`
- PhysicalEffect: `lib/types/physical-effect.js:16-116`
- Sender: `lib/server/sender.js:11-212`
- Receiver: `lib/client/receiver.js:10-73`
