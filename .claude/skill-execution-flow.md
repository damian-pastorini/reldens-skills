# SKILL EXECUTION FLOW
## Complete Step-by-Step Guide

---

## OVERVIEW

This document provides a detailed walkthrough of skill execution from the moment a skill is triggered until all effects are applied and events fired. Understanding this flow is critical for debugging, extending functionality, and implementing custom skills.

---

## ENTRY POINTS

### Method 1: Direct Execution
```javascript
await skill.execute(target);
```

### Method 2: With Owner Execution Hook
```javascript
// For physical skills, owner must implement this
await owner.executePhysicalSkill(target, skill);
```

---

## COMPLETE EXECUTION FLOW

### PHASE 1: PRE-VALIDATION

**File:** `lib/skill.js:106-125`

```
1. execute(target) called
2. Set this.target = target
3. Check if owner is casting (this.owner.isCasting)
   → If true: return {error: SKILL.CAN_NOT_ACTIVATE}
4. Fire SKILL_BEFORE_EXECUTE event
   → Event params: (this, target)
5. Continue to validation
```

**Events Fired:**
- `SkillsEvents.SKILL_BEFORE_EXECUTE`

**Possible Returns:**
- `{error: SKILL.CAN_NOT_ACTIVATE}` - Owner is casting another skill

---

### PHASE 2: VALIDATION

**File:** `lib/skill.js:147-187`

```
1. validate() called
2. Fire VALIDATE_BEFORE event
   → Event params: (this)
3. Check ownerConditions (if defined)
   → For each condition in this.ownerConditions:
     → condition.isValid(this.owner)
     → If any fails:
       → Fire VALIDATE_FAIL event with failedCondition
       → Return false
4. Check canActivate flag (cooldown/delay)
   → If false: Return false
5. Check range (if rangeAutomaticValidation enabled)
   → Call this.owner.isInRange(this, this.target, this.range)
   → Fire SKILL_BEFORE_IN_RANGE event
   → Fire SKILL_AFTER_IN_RANGE event with result
   → If out of range: Return false
6. Call onExecuteConditions() (hook for custom validation)
   → If returns false: Return false
7. Set canActivate = false (start cooldown)
8. Set skillActivationTimer for cooldown reset
9. Fire VALIDATE_SUCCESS event
10. Return true
```

**Events Fired:**
- `SkillsEvents.VALIDATE_BEFORE`
- `SkillsEvents.VALIDATE_FAIL` (if condition fails)
- `SkillsEvents.SKILL_BEFORE_IN_RANGE` (if range check enabled)
- `SkillsEvents.SKILL_AFTER_IN_RANGE` (if range check enabled)
- `SkillsEvents.VALIDATE_SUCCESS` (if all checks pass)

**Possible Returns:**
- `false` - Validation failed (condition, range, cooldown)
- `true` - Validation passed, ready to execute

**Hooks:**
- `onExecuteConditions()` - Override for custom validation logic

---

### PHASE 3: OWNER EFFECTS APPLICATION

**File:** `lib/skill.js:126-128`

```
1. Check if this.ownerEffects exists and has length > 0
2. If yes:
   → Fire SKILL_APPLY_OWNER_EFFECTS event
     → Event params: (this, target)
   → Call applyModifiers(this.ownerEffects, this.owner, true)
     → Note: avoidCritical = true (no crits on owner effects)
```

**Events Fired:**
- `SkillsEvents.SKILL_APPLY_OWNER_EFFECTS`

**What Happens:**
- Modifiers in ownerEffects are applied to the skill owner
- Examples: Buff owner's attack, consume mana, apply shield
- Critical damage is NOT applied to owner effects

---

### PHASE 4: CAST TIME HANDLING

**File:** `lib/skill.js:129-134`

```
1. Check if this.castTime > 0
2. If yes:
   → Fire SKILL_BEFORE_CAST event
     → Event params: (this, target)
   → Set this.owner.isCasting = true
   → await sleep(this.castTime)
   → Set this.owner.isCasting = false
   → Fire SKILL_AFTER_CAST event
     → Event params: (this, target)
3. Continue to skill logic
```

**Events Fired:**
- `SkillsEvents.SKILL_BEFORE_CAST` (if castTime > 0)
- `SkillsEvents.SKILL_AFTER_CAST` (if castTime > 0)

**State Changes:**
- `owner.isCasting` set to true during cast
- `owner.isCasting` set to false after cast completes

**Blocking:**
- If owner is already casting, execute() returns early (PHASE 1)
- Cast time blocks thread with await sleep()

---

### PHASE 5: SKILL LOGIC EXECUTION

**File:** `lib/skill.js:135-137`

```
1. Fire SKILL_BEFORE_RUN_LOGIC event
   → Event params: (this, target)
2. await this.runSkillLogic()
   → This is the main skill behavior method
   → Overridden by skill types (Attack, Effect, Physical, etc.)
3. Fire SKILL_AFTER_RUN_LOGIC event
   → Event params: (this, target)
```

**Events Fired:**
- `SkillsEvents.SKILL_BEFORE_RUN_LOGIC`
- `SkillsEvents.SKILL_AFTER_RUN_LOGIC`

**Hooks:**
- `runSkillLogic()` - MUST be overridden by skill types

---

### PHASE 6: POST-EXECUTION

**File:** `lib/skill.js:138-141`

```
1. Increment this.usesCount
2. Fire SKILL_AFTER_EXECUTE event
   → Event params: (this, target)
3. Return result (varies by skill type)
```

**Events Fired:**
- `SkillsEvents.SKILL_AFTER_EXECUTE`

**State Changes:**
- `usesCount` incremented
- If `usesLimit` reached, skill may become unavailable

---

## SKILL TYPE-SPECIFIC LOGIC

### BASE SKILL (lib/skill.js)

**runSkillLogic():**
```javascript
async runSkillLogic()
{
    // No implementation in base class
    // Must be overridden
    return true;
}
```

---

### ATTACK SKILL (lib/types/attack.js:69-143)

**runSkillLogic() Flow:**

```
1. Check if this.applyDirectDamage is true
   → If true: Skip calculations, apply hitDamage directly
   → If false: Continue to damage calculation

2. DODGE CHECK:
   → Calculate owner aim total (sum of aimProperties)
   → Calculate target dodge total (sum of dodgeProperties)
   → If dodgeFullEnabled:
     → Check if dodge > (aim * dodgeOverAimSuccess)
     → If true: Return {error: SKILL.DODGED}

3. DAMAGE CALCULATION:
   → Calculate attack total (sum of attackProperties)
   → Calculate defense total (sum of defenseProperties)
   → Base damage = hitDamage modified by attack-defense difference
   → If damageAffected:
     → Apply dodge/aim ratio to damage
   → Calculate critical damage (if not avoided)
   → If criticalAffected:
     → Apply dodge/aim ratio to critical

4. DAMAGE APPLICATION:
   → Fire SKILL_ATTACK_APPLY_DAMAGE event
     → Event params: (this, target, damage, newValue)
   → Apply damage to target.stats[affectedProperty]
   → If !allowEffectBelowZero:
     → Clamp value to 0 minimum
   → Update target property

5. Return result with damage details
```

**Events Fired:**
- `SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE`

**Return Format:**
```javascript
{
    damages: {
        [affectedProperty]: finalDamageValue
    },
    [affectedProperty]: target.stats[affectedProperty]
}
```

**Critical Calculation:**
Attack skills apply critical to the damage value BEFORE adding to current:
```javascript
// lib/types/attack.js:101
damage = damage + this.getCriticalDiff(damage);
```

---

### EFFECT SKILL (lib/types/effect.js:46-68)

**runSkillLogic() Flow:**

```
1. Check if target is defined
   → If not: Return {error: SKILL.TARGET_NOT_AVAILABLE}

2. Validate range (if rangeAutomaticValidation)
   → Check this.owner.isInRange(this, this.target, this.range)
   → If out of range: Return {error: SKILL.OUT_OF_RANGE}

3. Apply target effects:
   → Call applyModifiers(this.targetEffects, this.target)
   → Note: avoidCritical = false (crits can apply)

4. Fire SKILL_EFFECT_TARGET_MODIFIERS event
   → Event params: (this, this.target)

5. Return success result
```

**Events Fired:**
- `SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS`

**Return Format:**
```javascript
{
    error: false
}
```

**Critical Calculation:**
Effect skills apply critical to modifier value BEFORE adding to current:
```javascript
// lib/skill.js:306-308
let newValue = modifier.getModifiedValue();
if(!avoidCritical){
    newValue = newValue + this.getCriticalDiff(modifier.value);
}
```

---

### PHYSICAL ATTACK SKILL (lib/types/physical-attack.js:58-115)

**runSkillLogic() Flow:**

```
1. Validate physical properties (width, height, magnitude)
   → If invalid: Return {error: SKILL.PHYSICAL_SKILL_INVALID_TARGET}

2. Check if owner implements executePhysicalSkill()
   → If not: Return {error: SKILL.TARGET_NOT_AVAILABLE}

3. Set this.lastState = SKILL.PHYSICAL_SKILL_RUN_LOGIC

4. Define executeOnHit callback:
   → Validate target matches (if validateTargetOnHit)
   → Fire SKILL_PHYSICAL_ATTACK_HIT event
     → Event params: (this, target)
   → Call parent runSkillLogic() (Attack damage logic)
   → Return damage result

5. Call owner.executePhysicalSkill(this.target, this, executeOnHit)
   → Owner's physics system handles collision detection
   → When collision occurs, executeOnHit is called

6. Return {executed: true}
```

**Events Fired:**
- `SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT` (on collision)
- `SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE` (from parent logic)

**Owner Requirements:**
Owner must implement:
```javascript
async executePhysicalSkill(target, skill, executeOnHit)
{
    // Create physics body with skill.objectWidth, skill.objectHeight
    // Apply force with skill.magnitude
    // On collision, call executeOnHit(collidedTarget)
}
```

**Return Format:**
```javascript
{
    executed: true
}
```

---

### PHYSICAL EFFECT SKILL (lib/types/physical-effect.js:58-113)

**runSkillLogic() Flow:**

```
1. Validate physical properties (width, height, magnitude)
   → If invalid: Return {error: SKILL.PHYSICAL_SKILL_INVALID_TARGET}

2. Check if owner implements executePhysicalSkill()
   → If not: Return {error: SKILL.TARGET_NOT_AVAILABLE}

3. Set this.lastState = SKILL.PHYSICAL_SKILL_RUN_LOGIC

4. Define executeOnHit callback:
   → Validate target matches (if validateTargetOnHit)
   → Fire SKILL_PHYSICAL_EFFECT_HIT event
     → Event params: (this, target)
   → Call parent runSkillLogic() (Effect modifier logic)
   → Return effect result

5. Call owner.executePhysicalSkill(this.target, this, executeOnHit)
   → Owner's physics system handles collision detection
   → When collision occurs, executeOnHit is called

6. Return {executed: true}
```

**Events Fired:**
- `SkillsEvents.SKILL_PHYSICAL_EFFECT_HIT` (on collision)
- `SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS` (from parent logic)

**Owner Requirements:**
Same as PhysicalAttack - must implement executePhysicalSkill()

**Return Format:**
```javascript
{
    executed: true
}
```

---

## MODIFIER APPLICATION FLOW

### applyModifiers() Method

**File:** `lib/skill.js:293-313`

```
1. Initialize this.lastAppliedModifiers = {}
2. For each modifier in modifiersObjectList:
   → Set modifier.target = target
   → Call modifier.getModifiedValue()
     → This uses @reldens/modifiers Calculator
     → Returns currentValue + modifierValue
   → If !avoidCritical:
     → Calculate critical bonus: getCriticalDiff(modifier.value)
     → Add critical bonus to newValue
   → Apply newValue to target property
   → Store in lastAppliedModifiers
```

**Critical Calculation:**
```javascript
// Critical applies ONLY to modifier.value, not to currentValue
getCriticalDiff(value)
{
    let criticalValue = this.applyCriticalValue(value);
    return criticalValue - value;  // Returns the bonus amount
}

// Example:
// currentValue = 80, modifier.value = 10, critical = 2x
// getModifiedValue() returns 90 (80 + 10)
// getCriticalDiff(10) returns 10 (20 - 10)
// Final: 90 + 10 = 100
```

**Important:**
- Owner effects ALWAYS use avoidCritical = true
- Target effects use avoidCritical = false (can crit)

---

## COMPLETE SEQUENCE DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│ skill.execute(target) CALLED                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
        ╔════════════════════════╗
        ║ PHASE 1: PRE-VALIDATION ║
        ╚════════════════════════╝
                     │
                     ├─→ Check owner.isCasting
                     │   └─→ If true: Return {error: CAN_NOT_ACTIVATE}
                     │
                     ├─→ Fire: SKILL_BEFORE_EXECUTE
                     │
                     ▼
        ╔════════════════════════╗
        ║ PHASE 2: VALIDATION     ║
        ╚════════════════════════╝
                     │
                     ├─→ Fire: VALIDATE_BEFORE
                     │
                     ├─→ Check ownerConditions
                     │   └─→ If fails: Fire VALIDATE_FAIL, Return false
                     │
                     ├─→ Check canActivate (cooldown)
                     │   └─→ If false: Return false
                     │
                     ├─→ Check range (if enabled)
                     │   ├─→ Fire: SKILL_BEFORE_IN_RANGE
                     │   ├─→ Fire: SKILL_AFTER_IN_RANGE
                     │   └─→ If out of range: Return false
                     │
                     ├─→ Call onExecuteConditions()
                     │   └─→ If false: Return false
                     │
                     ├─→ Set canActivate = false
                     ├─→ Start skillActivationTimer
                     ├─→ Fire: VALIDATE_SUCCESS
                     │
                     ▼
        ╔════════════════════════╗
        ║ PHASE 3: OWNER EFFECTS  ║
        ╚════════════════════════╝
                     │
                     ├─→ If ownerEffects exist:
                     │   ├─→ Fire: SKILL_APPLY_OWNER_EFFECTS
                     │   └─→ applyModifiers(ownerEffects, owner, true)
                     │
                     ▼
        ╔════════════════════════╗
        ║ PHASE 4: CAST TIME      ║
        ╚════════════════════════╝
                     │
                     ├─→ If castTime > 0:
                     │   ├─→ Fire: SKILL_BEFORE_CAST
                     │   ├─→ Set owner.isCasting = true
                     │   ├─→ await sleep(castTime)
                     │   ├─→ Set owner.isCasting = false
                     │   └─→ Fire: SKILL_AFTER_CAST
                     │
                     ▼
        ╔════════════════════════╗
        ║ PHASE 5: SKILL LOGIC    ║
        ╚════════════════════════╝
                     │
                     ├─→ Fire: SKILL_BEFORE_RUN_LOGIC
                     │
                     ├─→ await runSkillLogic()
                     │   │
                     │   ├─→ [BASE SKILL]
                     │   │   └─→ (no implementation)
                     │   │
                     │   ├─→ [ATTACK SKILL]
                     │   │   ├─→ Check dodge
                     │   │   ├─→ Calculate damage
                     │   │   ├─→ Apply critical
                     │   │   ├─→ Fire: SKILL_ATTACK_APPLY_DAMAGE
                     │   │   └─→ Apply to affectedProperty
                     │   │
                     │   ├─→ [EFFECT SKILL]
                     │   │   ├─→ Validate range
                     │   │   ├─→ applyModifiers(targetEffects, target)
                     │   │   └─→ Fire: SKILL_EFFECT_TARGET_MODIFIERS
                     │   │
                     │   ├─→ [PHYSICAL ATTACK]
                     │   │   ├─→ Validate properties
                     │   │   ├─→ owner.executePhysicalSkill()
                     │   │   ├─→ On collision:
                     │   │   │   ├─→ Fire: SKILL_PHYSICAL_ATTACK_HIT
                     │   │   │   └─→ Call parent Attack logic
                     │   │   └─→ Return {executed: true}
                     │   │
                     │   └─→ [PHYSICAL EFFECT]
                     │       ├─→ Validate properties
                     │       ├─→ owner.executePhysicalSkill()
                     │       ├─→ On collision:
                     │       │   ├─→ Fire: SKILL_PHYSICAL_EFFECT_HIT
                     │       │   └─→ Call parent Effect logic
                     │       └─→ Return {executed: true}
                     │
                     ├─→ Fire: SKILL_AFTER_RUN_LOGIC
                     │
                     ▼
        ╔════════════════════════╗
        ║ PHASE 6: POST-EXECUTE   ║
        ╚════════════════════════╝
                     │
                     ├─→ Increment usesCount
                     ├─→ Fire: SKILL_AFTER_EXECUTE
                     │
                     ▼
        ┌─────────────────────┐
        │ Return result       │
        └─────────────────────┘
```

---

## EVENT SEQUENCE SUMMARY

### Standard Skill Execution (No Cast Time):
1. `SKILL_BEFORE_EXECUTE`
2. `VALIDATE_BEFORE`
3. `SKILL_BEFORE_IN_RANGE` (if range check enabled)
4. `SKILL_AFTER_IN_RANGE` (if range check enabled)
5. `VALIDATE_SUCCESS`
6. `SKILL_APPLY_OWNER_EFFECTS` (if ownerEffects exist)
7. `SKILL_BEFORE_RUN_LOGIC`
8. [Type-specific events]
9. `SKILL_AFTER_RUN_LOGIC`
10. `SKILL_AFTER_EXECUTE`

### With Cast Time:
(Same as above, but insert after owner effects):
- `SKILL_BEFORE_CAST`
- (wait castTime ms)
- `SKILL_AFTER_CAST`

### Attack Skill Additional Event:
- `SKILL_ATTACK_APPLY_DAMAGE` (during runSkillLogic)

### Effect Skill Additional Event:
- `SKILL_EFFECT_TARGET_MODIFIERS` (during runSkillLogic)

### Physical Attack Additional Event:
- `SKILL_PHYSICAL_ATTACK_HIT` (on collision)

### Physical Effect Additional Event:
- `SKILL_PHYSICAL_EFFECT_HIT` (on collision)

---

## COOLDOWN SYSTEM

### Timer Setup (lib/skill.js:178-184)

```javascript
this.canActivate = false;
this.skillActivationTimer = setTimeout(() => {
    this.canActivate = true;
}, this.skillDelay);
```

### How It Works:
1. When validation starts, `canActivate` is set to false
2. Timer is created for `skillDelay` milliseconds
3. When timer fires, `canActivate` is set back to true
4. If skill is executed while `canActivate = false`, validation fails

### Important:
- `skillDelay` is in milliseconds
- Default is 0 (no cooldown)
- Timer must complete before skill can be used again
- Multiple skill instances can have independent timers

---

## CRITICAL HIT SYSTEM

### Components:

1. **criticalChance** (0-1): Probability of critical hit
2. **criticalMultiplier** (default 2): Damage/effect multiplier
3. **criticalFixedValue** (default null): Fixed bonus instead of multiplier

### Calculation Methods:

**applyCriticalValue(value)** - Apply critical to a value:
```javascript
// lib/skill.js:315-328
applyCriticalValue(value)
{
    if(!this.canCriticalHit()){
        return value;
    }
    if(this.criticalFixedValue){
        return value + this.criticalFixedValue;
    }
    return value * this.criticalMultiplier;
}
```

**getCriticalDiff(value)** - Get critical bonus amount:
```javascript
// lib/skill.js:330-334
getCriticalDiff(value)
{
    let criticalValue = this.applyCriticalValue(value);
    return criticalValue - value;
}
```

**canCriticalHit()** - Roll for critical:
```javascript
// lib/skill.js:336-343
canCriticalHit()
{
    if(!this.criticalChance){
        return false;
    }
    let criticalRoll = Math.random();
    return criticalRoll <= this.criticalChance;
}
```

### Critical Application:

**Attack Skills:**
```javascript
// Applies to damage value
damage = damage + this.getCriticalDiff(damage);
```

**Effect Skills:**
```javascript
// Applies to modifier value
let newValue = modifier.getModifiedValue();
if(!avoidCritical){
    newValue = newValue + this.getCriticalDiff(modifier.value);
}
```

### Critical Affected by Dodge/Aim (Attack only):

If `criticalAffected` is enabled:
```javascript
let criticalDamage = this.getCriticalDiff(damage);
if(this.criticalAffected && totalDodge && totalAim){
    criticalDamage = criticalDamage * (totalAim / totalDodge);
}
damage = damage + criticalDamage;
```

---

## RANGE VALIDATION

### Components:

1. **range**: Maximum distance (0 = infinite)
2. **rangeAutomaticValidation**: Enable auto-check before execution
3. **owner.isInRange(skill, target, range)**: Distance check method

### Validation Points:

**During Skill Validation (if rangeAutomaticValidation):**
```javascript
// lib/skill.js:164-171
if(this.rangeAutomaticValidation){
    await this.fireEvent(SkillsEvents.SKILL_BEFORE_IN_RANGE, this);
    let interactionResult = this.owner.isInRange(this, this.target, this.range);
    await this.fireEvent(SkillsEvents.SKILL_AFTER_IN_RANGE, this, interactionResult);
    if(!interactionResult){
        return false;
    }
}
```

**During Effect Skill Logic:**
```javascript
// lib/types/effect.js:52-55
if(this.rangeAutomaticValidation && !this.owner.isInRange(this, this.target, this.range)){
    return {error: SKILL.OUT_OF_RANGE};
}
```

### Owner Requirements:

Owner must implement:
```javascript
isInRange(skill, target, range)
{
    if(range === 0){
        return true; // Infinite range
    }
    let distance = this.getDistanceTo(target);
    return distance <= range;
}
```

---

## TARGET VALIDATION

### Target Types:

1. **Fixed Target**: Set in skill constructor
2. **Dynamic Target**: Passed to execute(target)

### Validation:

**Allow Self Target:**
```javascript
// If allowSelfTarget = false and target === owner
// Validation should fail (implement in onExecuteConditions)
```

**Physical Skill Target Validation:**
```javascript
// lib/types/physical-attack.js:74-80
if(this.validateTargetOnHit && target['key'] !== this.target['key']){
    return {
        executed: true,
        error: SKILL.PHYSICAL_SKILL_INVALID_TARGET
    };
}
```

---

## USES LIMIT SYSTEM

### Properties:

1. **usesLimit**: Maximum uses (0 = unlimited)
2. **usesCount**: Current usage count

### Tracking:

```javascript
// lib/skill.js:138
this.usesCount++;
```

### Implementation Note:

The current implementation does NOT enforce usesLimit. You must implement this check manually:

```javascript
onExecuteConditions()
{
    if(this.usesLimit > 0 && this.usesCount >= this.usesLimit){
        return false; // Skill exhausted
    }
    return true;
}
```

---

## DEBUGGING SKILL EXECUTION

### Add Logging to Track Flow:

```javascript
async execute(target)
{
    console.log('[EXECUTE] Starting skill:', this.key);
    this.target = target;

    if(this.owner.isCasting){
        console.log('[EXECUTE] Owner is casting, aborting');
        return {error: SKILL.CAN_NOT_ACTIVATE};
    }

    console.log('[EXECUTE] Firing BEFORE_EXECUTE event');
    await this.fireEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, this, target);

    console.log('[EXECUTE] Starting validation');
    if(!this.validate()){
        console.log('[EXECUTE] Validation failed');
        return false;
    }
    console.log('[EXECUTE] Validation passed');

    // ... rest of execution
}
```

### Check Event Registration:

```javascript
listenEvent(eventName, callback, removeKey, masterKey) {
    let fullName = this.eventFullName(eventName);
    console.log('[LISTEN]', fullName, 'removeKey:', removeKey);
    return this.events.onWithKey(fullName, callback, removeKey, masterKey);
}
```

### Track Critical Hits:

```javascript
canCriticalHit()
{
    if(!this.criticalChance){
        return false;
    }
    let criticalRoll = Math.random();
    let isCrit = criticalRoll <= this.criticalChance;
    console.log('[CRITICAL] Roll:', criticalRoll, 'Chance:', this.criticalChance, 'Result:', isCrit);
    return isCrit;
}
```

---

## COMMON PITFALLS

### ❌ PITFALL 1: Not Awaiting execute()

**BAD:**
```javascript
skill.execute(target); // Missing await
console.log('Skill done'); // Runs immediately
```

**GOOD:**
```javascript
await skill.execute(target); // Wait for completion
console.log('Skill done'); // Runs after skill finishes
```

### ❌ PITFALL 2: Forgetting to Override runSkillLogic()

**BAD:**
```javascript
class MySkill extends Skill {
    // No runSkillLogic implementation
}
// Skill does nothing when executed
```

**GOOD:**
```javascript
class MySkill extends Skill {
    async runSkillLogic() {
        // Implement behavior
        return true;
    }
}
```

### ❌ PITFALL 3: Applying Critical to Wrong Value

**BAD:**
```javascript
// Applying critical to (currentValue + modifierValue)
let newValue = modifier.getModifiedValue(); // 80 + 10 = 90
newValue = newValue * 2; // 90 * 2 = 180 ❌
```

**GOOD:**
```javascript
// Applying critical to modifierValue only
let newValue = modifier.getModifiedValue(); // 80 + 10 = 90
newValue = newValue + this.getCriticalDiff(modifier.value); // 90 + 10 = 100 ✓
```

### ❌ PITFALL 4: Checking Range Without Validation Flag

**BAD:**
```javascript
// Range checked but rangeAutomaticValidation = false
let skill = new Skill({
    owner: owner,
    target: target,
    range: 100
    // rangeAutomaticValidation not set (defaults to false)
});
await skill.execute(target); // Range NOT checked
```

**GOOD:**
```javascript
let skill = new Skill({
    owner: owner,
    target: target,
    range: 100,
    rangeAutomaticValidation: true // Enable auto range check
});
await skill.execute(target); // Range checked
```

### ❌ PITFALL 5: Physical Skills Without Owner Implementation

**BAD:**
```javascript
let skill = new PhysicalAttack({
    owner: owner, // owner does NOT implement executePhysicalSkill
    objectWidth: 10,
    objectHeight: 10
});
await skill.execute(target); // Returns TARGET_NOT_AVAILABLE error
```

**GOOD:**
```javascript
owner.executePhysicalSkill = async function(target, skill, executeOnHit) {
    // Implement physics logic
};
let skill = new PhysicalAttack({
    owner: owner,
    objectWidth: 10,
    objectHeight: 10
});
await skill.execute(target); // Works correctly
```

---

## REFERENCES

- Base Skill: `lib/skill.js:12-348`
- Attack Logic: `lib/types/attack.js:69-143`
- Effect Logic: `lib/types/effect.js:46-68`
- Physical Attack: `lib/types/physical-attack.js:58-115`
- Physical Effect: `lib/types/physical-effect.js:58-113`
- Event Names: `lib/skills-events.js`
- Constants: `lib/constants.js`
