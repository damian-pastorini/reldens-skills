# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## File Access Permissions

**IMPORTANT: These permissions must be approved by the user at the beginning of each session.**

Once approved, you are granted the following permissions for files under `D:\dap\work\reldens\npm-packages\reldens-skills`:

✅ **ALLOWED**:
- Read ANY file under `D:\dap\work\reldens\npm-packages\reldens-skills`
- Create NEW files under `D:\dap\work\reldens\npm-packages\reldens-skills`

❌ **FORBIDDEN**:
- Edit or modify EXISTING files
- Delete files
- Move files

**When modifications to existing files are needed:**
- Provide complete NEW file artifacts with the full updated content
- User will manually replace the existing files with the new content
- Never use the Edit tool on existing files

## Code Rules & Standards

1. Read and follow ALL coding rules from `D:\dap\work\reldens\_source\ai-coding-rules.md`.
2. Apply the code rules to every single line of code you provide.
3. Self-audit every response against the rules before sending.

## Package Overview

**@reldens/skills** (v0.45.0) is a comprehensive skills, leveling, and combat system that provides:
- Level sets with automatic progression and experience management
- Class paths with skill trees and level-dependent unlocks
- Multiple skill types (base, attack, effect, physical variants)
- Combat mechanics (damage calculation, critical hits, dodge system)
- Real-time server-client synchronization via Sender/Receiver pattern
- Event-driven architecture for custom logic integration
- Modifiers system integration via @reldens/modifiers

This package is part of the Reldens MMORPG Platform ecosystem and can be attached to any entity owner with position methods.

## Key Commands

```bash
# Run tests
npm test
```

## Architecture

### Package Structure

```
lib/
├── skill.js                    # Base Skill class
├── level.js                    # Single level with modifiers
├── levels-set.js               # Level progression system
├── class-path.js               # Skill tree with class progression
├── server.js                   # SkillsServer wrapper
├── constants.js                # Shared constants and action names
├── skills-events.js            # Event name definitions
├── server/
│   └── sender.js              # Server-to-client message sender
├── client/
│   └── receiver.js            # Client message receiver
└── types/
    ├── attack.js              # Damage-based skills
    ├── effect.js              # Modifier-based skills
    ├── physical-attack.js     # Physics-enabled attacks
    ├── physical-effect.js     # Physics-enabled effects
    ├── physical-properties-validator.js
    └── physical-skill-runner.js
```

### Core Classes

**Skill** (`lib/skill.js:12`):
- Base class for all skills
- Provides validation, execution, range checking
- Event system integration
- Owner/target relationship management
- Critical hit system (chance, multiplier, fixed value)
- Cooldown/delay system (`skillDelay`, `canActivate`)
- Cast time support with `castTime` property
- Owner conditions validation
- Owner effects application
- Properties:
  - `key`: Unique skill identifier
  - `owner`: Entity that owns the skill (must have `getPosition()` method)
  - `target`: Target entity (can be fixed or passed on execution)
  - `range`: Skill range (0 = infinite range)
  - `rangeAutomaticValidation`: Auto-validate range before execution
  - `allowSelfTarget`: Allow targeting the owner
  - `usesLimit`: Maximum uses (0 = unlimited)
  - `ownerConditions`: Array of Condition instances
  - `ownerEffects`: Array of modifiers applied to owner on execution
  - `criticalChance`, `criticalMultiplier`, `criticalFixedValue`

**Level** (`lib/level.js:9`):
- Represents a single level with:
  - `key`: Integer level number
  - `modifiers`: Array of modifiers applied at this level
  - `label`: Display name for the level
  - `requiredExperience`: XP required to reach this level

**LevelsSet** (`lib/levels-set.js:11`):
- Manages level progression and experience
- Auto-fills level ranges if `autoFillRanges` enabled
- Experience-based automatic leveling
- Modifier application/reversion on level up/down
- Properties:
  - `owner`: Entity with `getPosition()` method
  - `levels`: Object of Level instances
  - `currentLevel`: Current level number
  - `currentExp`: Current experience points
  - `autoFillRanges`: Auto-generate intermediate levels
  - `autoFillExperienceMultiplier`: XP multiplier for auto-generated levels (default: 1.5)
  - `increaseLevelsWithExperience`: Auto level up when XP threshold reached
  - `levelsByExperience`: Sorted array of level keys by required XP
  - `setRequiredExperienceLimit`: Cap XP at max level requirement
- Methods:
  - `levelUp()`: Increase level, apply modifiers
  - `levelDown()`: Decrease level, revert modifiers
  - `addExperience(number)`: Add XP, auto-level if enabled
  - `getNextLevelExperience()`: Get XP required for next level

**ClassPath** (`lib/class-path.js:11`):
- Extends LevelsSet
- Provides skill tree functionality
- Level-based skill unlocking
- Dynamic label changes per level
- Properties:
  - `key`: Class path identifier
  - `label`: Base display name
  - `labelsByLevel`: Object of {levelKey: 'label'} for level-specific names
  - `currentLabel`: Active display name
  - `skillsByLevel`: Object of {levelKey: [Skill instances]}
  - `skillsByLevelKeys`: Object of {levelKey: [skill keys]}
  - `currentSkills`: Object of currently available skills
  - `affectedProperty`: Property affected by class skills (e.g., 'hp')
- Methods:
  - `addSkills(skills)`: Add skills to current set
  - `removeSkills(skills)`: Remove skills from current set
  - `setOwnerSkills(skills)`: Initialize owner's skill set based on current level

**SkillsServer** (`lib/server.js:11`):
- Server-side wrapper for ClassPath
- Integrates Sender for client communication
- Validates client has `send()` and `broadcast()` methods
- Automatically initializes ClassPath and registers listeners

### Skill Types

**Attack** (`lib/types/attack.js:14`):
- Extends Skill for damage-based skills
- Damage calculation with attack vs defense properties
- Dodge system with aim vs dodge properties
- Critical damage affected by aim/dodge ratio
- Properties:
  - `affectedProperty`: Target property to modify (e.g., 'hp')
  - `hitDamage`: Base damage at 100%
  - `applyDirectDamage`: Skip calculations, apply hitDamage directly
  - `attackProperties`: Array of owner properties for attack total
  - `defenseProperties`: Array of target properties for defense total
  - `aimProperties`: Array of owner properties for aim total
  - `dodgeProperties`: Array of target properties for dodge total
  - `dodgeFullEnabled`: Enable complete dodge if dodge > (aim * dodgeOverAimSuccess)
  - `dodgeOverAimSuccess`: Dodge threshold multiplier (default: 1)
  - `damageAffected`: Apply dodge/aim ratio to damage
  - `criticalAffected`: Apply dodge/aim ratio to critical damage
  - `propertiesTotalOperators`: Custom operators for property totals
  - `allowEffectBelowZero`: Allow negative values on affected property
- Damage Calculation:
  1. Calculate owner aim and target dodge totals
  2. Check full dodge: `dodge > (aim * dodgeOverAimSuccess)`
  3. Calculate base damage: `hitDamage` modified by attack vs defense diff
  4. Apply dodge/aim ratio if `damageAffected` enabled
  5. Calculate critical damage with dodge/aim ratio if `criticalAffected`
  6. Apply total damage to `affectedProperty`

**Effect** (`lib/types/effect.js:14`):
- Extends Skill for modifier-based skills (buffs/debuffs)
- Applies modifiers to target with critical chance
- Properties:
  - `targetEffects`: Array of modifiers applied to target
- Logic: Validates range, applies modifiers with critical calculation

**PhysicalAttack** (`lib/types/physical-attack.js:16`):
- Extends Attack for physics-enabled attacks
- Requires collision detection system
- Properties:
  - `magnitude`: Physics force/magnitude
  - `objectWidth`: Collision object width
  - `objectHeight`: Collision object height
  - `validateTargetOnHit`: Verify target matches on collision
- Requires owner to implement `executePhysicalSkill(target, skill)` method
- Uses PhysicalSkillRunner for execution
- Fires `SKILL_PHYSICAL_ATTACK_HIT` event on collision
- Calls parent `runSkillLogic()` in `executeOnHit(target)` callback

**PhysicalEffect** (`lib/types/physical-effect.js:16`):
- Extends Effect for physics-enabled effects
- Same physics properties as PhysicalAttack
- Uses PhysicalSkillRunner for execution
- Fires `SKILL_PHYSICAL_EFFECT_HIT` event on collision

### Communication System

**Sender** (`lib/server/sender.js:11`):
- Server-to-client message broadcaster
- Registers event listeners on ClassPath events
- Sends compressed data to client
- Behaviors:
  - `BEHAVIOR_SEND`: Send to owner client only
  - `BEHAVIOR_BROADCAST`: Broadcast to all clients
  - `BEHAVIOR_BOTH`: Both send and broadcast
- Registered Events:
  - `INIT_CLASS_PATH_END`: Send initial class data (level, label, XP, skills)
  - `LEVEL_UP`: Send level up data (new level, label, skills, next XP)
  - `LEVEL_EXPERIENCE_ADDED`: Send current XP
  - `SKILL_BEFORE_CAST`: Broadcast skill cast start
  - `SKILL_ATTACK_APPLY_DAMAGE`: Broadcast damage application
- Message Format:
  ```javascript
  {
    act: 'rski.ICpe', // Action constant
    owner: ownerId,   // Owner ID
    data: {          // Compressed data
      lvl: 5,        // Level
      lab: 'Warrior', // Label
      exp: 1500,     // Current XP
      ne: 2000,      // Next level XP
      skl: ['sword', 'shield'] // Skill keys
    }
  }
  ```

**Receiver** (`lib/client/receiver.js:10`):
- Client-side message processor
- Maps action constants to method names
- Validates message action prefix (`rski.`)
- Properties:
  - `actions`: Object mapping action constants to method names
  - `avoidDefaults`: Skip default action-to-method mapping
- Default Method Mapping: Each action constant maps to `on[ActionName]` method
- Usage: Extend and implement handler methods (e.g., `onLevelUp(message)`)

### Events System

All events are prefixed with `reldens.skills.` and appended with owner event key.

**Level Set Events** (fired by LevelsSet):
- `INIT_LEVEL_SET_START`: Before level set initialization
- `INIT_LEVEL_SET_END`: After level set initialization
- `SET_LEVELS`: After levels are set
- `GENERATED_LEVELS`: After auto-filling a level range
- `LEVEL_UP`: After level increases
- `LEVEL_DOWN`: After level decreases
- `LEVEL_APPLY_MODIFIERS`: Before applying level modifiers
- `LEVEL_EXPERIENCE_ADDED`: After XP added (args: number, newTotal, currentLevelIndex, nextLevelIndex, nextLevelKey, nextLevel, nextLevelExp, isLevelUp)

**Class Path Events** (fired by ClassPath):
- `INIT_CLASS_PATH_END`: After class path initialization
- `SET_SKILLS`: After owner skills set
- `ADD_SKILLS_BEFORE`: Before adding skills
- `ADD_SKILLS_AFTER`: After adding skills
- `REMOVE_SKILLS_BEFORE`: Before removing skills
- `REMOVE_SKILLS_AFTER`: After removing skills

**Skill Execution Events** (fired by Skill):
- `VALIDATE_BEFORE`: Before skill validation
- `VALIDATE_SUCCESS`: After successful validation
- `VALIDATE_FAIL`: After validation failure (args: skill, failedCondition)
- `SKILL_BEFORE_IN_RANGE`: Before range check
- `SKILL_AFTER_IN_RANGE`: After range check (args: skill, interactionResult)
- `SKILL_BEFORE_EXECUTE`: Before skill execution
- `SKILL_APPLY_OWNER_EFFECTS`: After applying owner effects
- `SKILL_BEFORE_CAST`: Before cast time starts
- `SKILL_AFTER_CAST`: After cast time completes
- `SKILL_BEFORE_RUN_LOGIC`: Before skill logic execution
- `SKILL_AFTER_RUN_LOGIC`: After skill logic execution
- `SKILL_AFTER_EXECUTE`: After skill execution complete

**Attack/Effect Events**:
- `SKILL_ATTACK_APPLY_DAMAGE`: After damage applied (args: skill, target, damage, newValue)
- `SKILL_EFFECT_TARGET_MODIFIERS`: After effect modifiers applied
- `SKILL_PHYSICAL_ATTACK_HIT`: On physical attack collision
- `SKILL_PHYSICAL_EFFECT_HIT`: On physical effect collision

**Event Naming Convention**:
Events are automatically namespaced by owner:
```javascript
// Event fired as: 'skills.ownerId.123.reldens.skills.levelUp'
skill.fireEvent(SkillsEvents.LEVEL_UP, this);

// Listen to specific owner's events:
skill.listenEvent(SkillsEvents.LEVEL_UP, callback, removeKey, masterKey);
```

### Constants

**Skill Types** (`constants.js:10`):
- `SKILL.TYPE.BASE`: Base skill (1)
- `SKILL.TYPE.ATTACK`: Attack skill (2)
- `SKILL.TYPE.EFFECT`: Effect skill (3)
- `SKILL.TYPE.PHYSICAL_ATTACK`: Physical attack (4)
- `SKILL.TYPE.PHYSICAL_EFFECT`: Physical effect (5)

**Skill States** (`constants.js:53`):
- `PHYSICAL_SKILL_INVALID_TARGET`: Target validation failed
- `PHYSICAL_SKILL_RUN_LOGIC`: Running physical skill logic
- `OUT_OF_RANGE`: Target out of range
- `CAN_NOT_ACTIVATE`: Skill on cooldown or owner casting
- `DODGED`: Attack dodged
- `APPLYING_DAMAGE`: Damage calculation in progress
- `APPLIED_DAMAGE`: Damage applied successfully
- `APPLIED_CRITICAL_DAMAGE`: Critical damage applied
- `APPLYING_EFFECTS`: Effects being applied
- `APPLIED_EFFECTS`: Effects applied successfully
- `EXECUTE_PHYSICAL_ATTACK`: Physical attack executing
- `TARGET_NOT_AVAILABLE`: Target undefined or invalid

**Action Constants** (`constants.js:7`):
All action constants use `rski.` prefix (Reldens Skills) for network messages:
- `ACTION_INIT_CLASS_PATH_END`: 'rski.ICpe'
- `ACTION_LEVEL_UP`: 'rski.Lu'
- `ACTION_LEVEL_EXPERIENCE_ADDED`: 'rski.Ea'
- (See constants.js:24-51 for complete list)

**Behaviors** (`constants.js:20`):
- `BEHAVIOR_SEND`: Send to owner only
- `BEHAVIOR_BROADCAST`: Broadcast to all
- `BEHAVIOR_BOTH`: Both send and broadcast

## Dependencies

- **@reldens/modifiers** (^0.32.0): Provides PropertyManager, Condition, Calculator, and modifier system
- **@reldens/utils** (^0.54.0): Provides Shortcuts (sc), Logger, EventsManagerSingleton, InteractionArea

## Common Development Patterns

### Creating a Custom Skill

```javascript
const { Skill } = require('@reldens/skills');

class MyCustomSkill extends Skill
{
    constructor(props)
    {
        super(props);
        // Custom properties
    }

    async runSkillLogic()
    {
        // Implement skill behavior
        // Access this.owner, this.target
        // Use this.applyModifiers(), this.applyCriticalValue()
        return true; // Success
    }

    onExecuteConditions()
    {
        // Custom validation before execution
        return true; // Valid
    }
}
```

### Setting Up a Class Path

```javascript
const { ClassPath, Level } = require('@reldens/skills');

let levels = {
    1: new Level({
        key: 1,
        modifiers: [/* modifier instances */],
        requiredExperience: 0
    }),
    5: new Level({
        key: 5,
        modifiers: [/* modifier instances */],
        requiredExperience: 1000
    })
};

let classPath = new ClassPath({
    owner: playerEntity,
    key: 'warrior',
    label: 'Warrior',
    levels: levels,
    autoFillRanges: true, // Auto-generate levels 2, 3, 4
    currentLevel: 1,
    currentExp: 0,
    skillsByLevel: {
        1: [swordSkill],
        5: [shieldSkill]
    }
});

await classPath.init({
    owner: playerEntity,
    key: 'warrior',
    levels: levels
});
```

### Server-Side Integration

```javascript
const { SkillsServer } = require('@reldens/skills');

let skillsServer = new SkillsServer({
    owner: playerEntity,
    client: roomClient, // Must have send() and broadcast() methods
    key: 'warrior',
    levels: levels,
    skillsByLevel: skillsByLevel
});
```

### Client-Side Integration

```javascript
const { Receiver } = require('@reldens/skills/lib/client/receiver');

class MySkillsUI extends Receiver
{
    onLevelUp(message)
    {
        console.log('Level up!', message.data.lvl);
        // Update UI with new level, label, skills
    }

    onLevelExperienceAdded(message)
    {
        console.log('XP gained:', message.data.exp);
        // Update XP bar
    }
}

let receiver = new MySkillsUI({owner: playerEntity});
gameClient.onMessage('*', (message) => receiver.processMessage(message));
```

### Hooking into Events

```javascript
// Listen to skill events
skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, async (skill, target) => {
    console.log('Skill executed:', skill.key);
    // Custom logic after skill execution
}, 'myUniqueKey', skill.getOwnerEventKey());

// Listen to level events
classPath.listenEvent(SkillsEvents.LEVEL_UP, async (classPath) => {
    console.log('Leveled up to:', classPath.currentLevel);
    // Award achievement, show animation, etc.
}, 'levelUpListener', classPath.getOwnerEventKey());
```

## Important Notes

- **Owner Requirements**: All owners must implement `getPosition()` returning `{x, y}` object
- **Physical Skills**: Require owner to implement `executePhysicalSkill(target, skill)` method
- **Event-Driven**: All major operations fire events for custom logic integration
- **Standalone Package**: Can be used independently from main Reldens platform
- **Server Authoritative**: For multiplayer games, always validate skills on server
- **Modifiers Integration**: Uses @reldens/modifiers Condition and Modifier instances
- **Range System**: Range 0 = infinite range, uses InteractionArea for circular validation
- **Critical System**: Independent chance, multiplier, and fixed value properties
- **Auto-Leveling**: Automatically levels up when XP threshold reached if enabled
- **Experience Cap**: Can limit XP to max level requirement with `setRequiredExperienceLimit`

## Analysis Approach

When working on code issues:
- Always investigate thoroughly before making changes
- Read related files completely before proposing solutions
- Trace execution flows and dependencies
- Provide proof for issues, never guess or assume
- Verify file contents before creating patches
- Never jump to early conclusions
- A variable with an unexpected value is not an issue, it is the result of a previous issue
