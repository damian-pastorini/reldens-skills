# Architecture Overview

## Package Structure

```
@reldens/skills/
├── lib/
│   ├── skill.js                      # Base Skill class
│   ├── level.js                      # Single Level class
│   ├── levels-set.js                 # Level progression system
│   ├── class-path.js                 # Class with skill tree
│   ├── server.js                     # Server-side wrapper
│   ├── constants.js                  # Shared constants
│   ├── skills-events.js              # Event definitions
│   ├── server/
│   │   └── sender.js                 # Server-to-client messages
│   ├── client/
│   │   └── receiver.js               # Client message handler
│   └── types/
│       ├── attack.js                 # Damage-dealing skill
│       ├── effect.js                 # Modifier-applying skill
│       ├── physical-attack.js        # Physics-enabled attack
│       ├── physical-effect.js        # Physics-enabled effect
│       ├── physical-skill-runner.js  # Physics execution helper
│       └── physical-properties-validator.js
├── tests/
│   ├── run-tests.js                  # Test runner
│   ├── utils/                        # Test utilities
│   ├── fixtures/                     # Test data and mocks
│   └── unit/                         # Unit tests
├── .claude/
│   ├── settings.json                 # Claude permissions
│   ├── instructions.md               # Development workflow
│   ├── testing-guide.md              # Testing documentation
│   └── architecture.md               # This file
├── index.js                          # Main export
├── package.json                      # Package metadata
└── CLAUDE.md                         # Package documentation
```

## Core Classes

### Inheritance Hierarchy

```
Skill (base class)
├── Attack (damage calculations)
│   └── PhysicalAttack (physics-enabled)
└── Effect (modifier application)
    └── PhysicalEffect (physics-enabled)

LevelsSet (experience and progression)
└── ClassPath (skill tree system)
    └── SkillsServer (server wrapper)
```

## Data Flow

### Skill Execution Flow

```
1. Client Request
   └→ Player triggers skill

2. Validation Phase
   ├→ skill.validate()
   │   ├→ Check isReady
   │   ├→ Check canActivate
   │   ├→ Check isCasting
   │   ├→ Check usesLimit
   │   └→ validateConditions()
   │
   └→ skill.execute(target)
       ├→ Fire SKILL_BEFORE_EXECUTE
       ├→ Check target existence
       ├→ onExecuteConditions() (custom)
       ├→ isValidRange(target)
       ├→ applyModifiers (owner effects)
       └→ Fire SKILL_APPLY_OWNER_EFFECTS

3. Cast Time Handling
   ├→ If castTime > 0:
   │   ├→ Fire SKILL_BEFORE_CAST
   │   ├→ Set owner.isCasting = true
   │   ├→ setTimeout(castTime)
   │   └→ Fire SKILL_AFTER_CAST
   └→ Else: Execute immediately

4. Skill Logic Execution
   ├→ Fire SKILL_BEFORE_RUN_LOGIC
   ├→ runSkillLogic() (class-specific)
   │   ├→ Attack: applyDamageTo()
   │   │   ├→ Calculate aim vs dodge
   │   │   ├→ Check full dodge
   │   │   ├→ Calculate damage (atk vs def)
   │   │   ├→ Apply critical damage
   │   │   └→ Fire SKILL_ATTACK_APPLY_DAMAGE
   │   │
   │   └→ Effect: applyModifiers()
   │       ├→ Apply targetEffects[]
   │       └→ Fire SKILL_EFFECT_TARGET_MODIFIERS
   │
   └→ Fire SKILL_AFTER_RUN_LOGIC

5. Completion
   ├→ Increment skill.uses
   ├→ onExecuteRewards() (custom)
   └→ Fire SKILL_AFTER_EXECUTE

6. Server Communication (if SkillsServer)
   └→ Sender broadcasts to clients
```

### Level Progression Flow

```
1. Experience Gain
   └→ levelsSet.addExperience(amount)
       ├→ newTotalExp = currentExp + amount
       ├→ Check if threshold reached
       └→ Fire LEVEL_EXPERIENCE_ADDED

2. Auto Level Up (if enabled)
   └→ levelsSet.levelUp()
       ├→ currentLevel++
       ├→ applyLevelModifiers()
       │   ├→ Get level instance
       │   └→ Apply modifiers to owner
       └→ Fire LEVEL_UP

3. Server Notification (if SkillsServer)
   └→ Sender.onLevelUp()
       └→ Send/Broadcast level data
```

### Class Path Initialization

```
1. Construction
   └→ new ClassPath(props)
       ├→ Extends LevelsSet
       ├→ Set key, label, labelsByLevel
       ├→ Set skillsByLevel
       └→ Initialize currentSkills

2. Initialization
   └→ classPath.init(props)
       ├→ Call parent LevelsSet.init()
       ├→ Fire INIT_CLASS_PATH_END
       └→ setOwnerSkills() (populate based on level)

3. Level Changes
   └→ Override levelUp()
       ├→ Call parent LevelsSet.levelUp()
       ├→ Update currentLabel
       ├→ addSkills() (new level skills)
       └→ Fire ADD_SKILLS_AFTER

   └→ Override levelDown()
       ├→ removeSkills() (reverted level)
       ├→ Call parent LevelsSet.levelDown()
       └→ Fire REMOVE_SKILLS_AFTER
```

## Event System

### Event Namespacing

All events are automatically namespaced by owner:

```javascript
// Event pattern
ownerEventKey.reldens.skills.eventName

// Example
skills.ownerId.player-123.reldens.skills.levelUp
```

### Event Categories

1. **Validation Events**
   - VALIDATE_BEFORE
   - VALIDATE_SUCCESS
   - VALIDATE_FAIL

2. **Execution Events**
   - SKILL_BEFORE_EXECUTE
   - SKILL_AFTER_EXECUTE
   - SKILL_BEFORE_RUN_LOGIC
   - SKILL_AFTER_RUN_LOGIC

3. **Cast Events**
   - SKILL_BEFORE_CAST
   - SKILL_AFTER_CAST

4. **Combat Events**
   - SKILL_ATTACK_APPLY_DAMAGE
   - SKILL_EFFECT_TARGET_MODIFIERS
   - SKILL_PHYSICAL_ATTACK_HIT
   - SKILL_PHYSICAL_EFFECT_HIT

5. **Progression Events**
   - LEVEL_UP
   - LEVEL_DOWN
   - LEVEL_EXPERIENCE_ADDED
   - LEVEL_APPLY_MODIFIERS

6. **Class Path Events**
   - INIT_CLASS_PATH_END
   - SET_SKILLS
   - ADD_SKILLS_BEFORE/AFTER
   - REMOVE_SKILLS_BEFORE/AFTER

## Property Management

### Property Paths

Properties use path notation for nested access:

```javascript
// Flat property
propertyKey: 'hp'
// Accesses: owner.hp

// Nested property
propertyKey: 'stats/hp'
// Accesses: owner.stats.hp

// Deep nesting
propertyKey: 'stats/power/magical'
// Accesses: owner.stats.power.magical
```

### Property Manager Usage

```javascript
// Get property value
let hp = this.propertyManager.getPropertyValue(owner, 'stats/hp');

// Set property value
this.propertyManager.setOwnerProperty(owner, 'stats/hp', 90);
```

## Modifier Integration

### Modifier Application

Skills use modifiers from `@reldens/modifiers` package:

```javascript
const { Modifier, ModifierConst } = require('@reldens/modifiers');

// Create modifier
let modifier = new Modifier({
    key: 'atk-boost',
    propertyKey: 'stats/atk',
    operation: ModifierConst.OPS.INC,
    value: 5
});

// Apply to owner
modifier.apply(owner);

// Revert from owner
modifier.revert(owner);
```

### Owner vs Target Effects

```javascript
// Owner effects: Applied when skill executes
ownerEffects: [hpCostModifier, manaCostModifier]

// Target effects: Applied to target on hit
targetEffects: [damageModifier, stunModifier]
```

## Network Communication

### Sender Pattern (Server)

```javascript
// Server broadcasts skill events
sender.onSkillBeforeCast(skill, target)
    └→ client.broadcast({
        act: SkillsConst.ACTION_SKILL_BEFORE_CAST,
        owner: ownerId,
        data: {key, target}
    })
```

### Receiver Pattern (Client)

```javascript
// Client receives and processes
receiver.processMessage(message)
    └→ If action matches:
        └→ Call mapped method
            └→ this.onSkillBeforeCast(message)
```

### Message Format

```javascript
{
    act: 'rski.ICpe',        // Action constant
    owner: 'player-123',     // Owner ID
    data: {                  // Compressed data
        lvl: 5,              // Level
        lab: 'Warrior',      // Label
        exp: 1500,           // Experience
        ne: 2000,            // Next level XP
        skl: ['sword']       // Skills
    }
}
```

## Critical Calculation Flows

### Damage Calculation

```
1. Get Properties Totals
   ├→ ownerAtk = sum(attackProperties)
   ├→ targetDef = sum(defenseProperties)
   ├→ ownerAim = sum(aimProperties)
   └→ targetDodge = sum(dodgeProperties)

2. Dodge Check
   ├→ If dodgeFullEnabled && dodge > (aim * dodgeOverAimSuccess):
   └→ Return false (dodged)

3. Base Damage
   ├→ If applyDirectDamage:
   │   └→ damage = hitDamage
   └→ Else:
       └→ damage = calculateProportionDamage()

4. Attack vs Defense
   ├→ diff = ownerAtk - targetDef
   ├→ If diff > 0: Increase damage by percentage
   └→ If diff < 0: Decrease damage by percentage

5. Dodge Proportion (if damageAffected)
   ├→ dodgeAimDiff = getDiffProportion(aim, dodge)
   └→ damage = damage - (damage * dodgeAimDiff / 100)

6. Critical Damage
   ├→ critDamage = getCriticalDiff(damage)
   ├→ If criticalAffected && dodge > aim:
   │   └→ Reduce critDamage by dodge proportion
   └→ damage = damage + critDamage

7. Apply to Target
   └→ newHp = currentHp - damage
```

### Experience-Based Leveling

```
1. Check Experience
   └→ If newExp >= nextLevel.requiredExperience:

2. Level Up Loop
   └→ For each level in levelsByExperience:
       ├→ If newExp >= level.requiredExperience:
       │   └→ levelUp()
       └→ Else: break

3. Apply Modifiers
   └→ For each modifier in level.modifiers:
       └→ modifier.apply(owner)
```

## Design Patterns

### Strategy Pattern

Different skill types implement the same interface:

```javascript
class Skill {
    async runSkillLogic() { /* base implementation */ }
}

class Attack extends Skill {
    async runSkillLogic() { /* damage logic */ }
}

class Effect extends Skill {
    async runSkillLogic() { /* modifier logic */ }
}
```

### Observer Pattern

Event system allows loose coupling:

```javascript
// Register listener
skill.listenEvent(SkillsEvents.LEVEL_UP, callback);

// Fire event
skill.fireEvent(SkillsEvents.LEVEL_UP, data);
```

### Template Method Pattern

Base class defines workflow, subclasses implement steps:

```javascript
// Base workflow in Skill.execute()
async execute(target) {
    await this.fireEvent(SKILL_BEFORE_EXECUTE);
    // ... validation ...
    await this.runSkillLogic();  // Implemented by subclass
    await this.fireEvent(SKILL_AFTER_EXECUTE);
}
```

## Performance Considerations

1. **Event Listeners**: Always remove listeners when owner is destroyed
2. **Timers**: Clear skillActivationTimer and castingTimer properly
3. **Object Pooling**: Consider pooling for frequently created skills
4. **Property Caching**: Cache getPropertyValue results if called multiple times
5. **Modifier Management**: Limit number of active modifiers per entity
6. **Range Validation**: Use squared distance to avoid Math.sqrt when possible

## Extension Points

### Custom Skill Types

```javascript
class MyCustomSkill extends Skill {
    constructor(props) {
        super(props);
        this.customProperty = props.customProperty;
    }

    async runSkillLogic() {
        // Custom implementation
    }

    onExecuteConditions() {
        // Custom validation
    }
}
```

### Custom Level Progression

```javascript
class CustomLevelsSet extends LevelsSet {
    async addExperience(number) {
        // Custom XP calculation
        let modifiedXp = this.calculateBonus(number);
        return await super.addExperience(modifiedXp);
    }
}
```

### Event Hooks

```javascript
// Hook into any event for custom logic
skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, async (skill, target) => {
    // Award achievement
    // Play animation
    // Update statistics
});
```
