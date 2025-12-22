# EVENT SYSTEM ARCHITECTURE
## @reldens/skills Package Event Flow

---

## OVERVIEW

The @reldens/skills package uses a sophisticated event-driven architecture based on `EventsManagerSingleton` from `@reldens/utils`. Understanding this system is critical for proper implementation and testing.

---

## EVENT MANAGER SINGLETON

**File:** `@reldens/utils` package
**Instance:** `EventsManagerSingleton`

### Key Characteristics

1. **Global Singleton**: Only ONE instance exists across the entire application
2. **Shared by ALL entities**: Skills, ClassPath, LevelsSet, Sender, etc. all use the SAME EventsManager
3. **removeKey Registry**: Maintains a GLOBAL registry of removeKeys that persists between listener registrations
4. **Owner-Namespaced Events**: Events are prefixed with owner identifiers to avoid cross-owner collisions

---

## EVENT NAMING CONVENTION

### Event Name Construction

```javascript
// File: lib/levels-set.js:267-272
eventFullName(eventName) {
    return this.getOwnerEventKey() + '.' + eventName;
}

getOwnerEventKey() {
    return sc.get(this.owner, 'eventsPrefix', 'skills.ownerId.' + this.getOwnerId());
}
```

### Example Event Names

Given:
- Owner ID: `'player-123'`
- Owner eventsPrefix: `'skills.ownerId.player-123'`
- Event: `'reldens.skills.levelUp'`

**Full Event Name:**
```
skills.ownerId.player-123.reldens.skills.levelUp
```

This ensures events for Player 123 don't trigger listeners registered for Player 456.

---

## LISTENER REGISTRATION

### Method Signature

```javascript
// File: lib/levels-set.js:262-265
listenEvent(eventName, callback, removeKey, masterKey) {
    return this.events.onWithKey(
        this.eventFullName(eventName),  // Full namespaced event name
        callback,                        // Function to execute
        removeKey,                       // Unique identifier for removal
        masterKey                        // Master removal key (optional)
    );
}
```

### Parameters Explained

| Parameter | Type | Required | Purpose |
|-----------|------|----------|---------|
| `eventName` | string | Yes | Base event name (e.g., `SkillsEvents.LEVEL_UP`) |
| `callback` | function | Yes | Function to execute when event fires |
| `removeKey` | string | No | **UNIQUE** identifier for this specific listener |
| `masterKey` | string | No | Master key for bulk removal (unused in current codebase) |

### Critical: removeKey Uniqueness

**IMPORTANT:** The `removeKey` parameter MUST be globally unique across your entire application!

**WHY:** EventsManagerSingleton maintains a global removeKey registry that is NOT cleared by `removeAllListeners()`.

**Bad Example (Causes Collisions):**
```javascript
// Test 1
classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, callback, 'before-listener');

// afterEach() calls EventsManagerSingleton.removeAllListeners()

// Test 2 - COLLISION!
classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, callback, 'before-listener');
// ❌ Registration fails silently - removeKey 'before-listener' already exists
```

**Good Example:**
```javascript
// Test 1
classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, callback, 'add-before-listener');

// Test 2
classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, callback, 'remove-before-listener');
// ✓ Different removeKey - works correctly
```

---

## EVENT FIRING

### Method Signature

```javascript
// File: lib/levels-set.js:257-260
async fireEvent(eventName, ...args) {
    return await this.events.emit(this.eventFullName(eventName), ...args);
}
```

### Execution Flow

1. **Build Full Event Name**: `eventFullName()` adds owner prefix
2. **Emit to EventsManager**: `emit()` finds all registered listeners for that exact event name
3. **Execute Callbacks**: All matching listeners execute (synchronously in callback, but emit is async)
4. **Return**: After all listeners complete

### Key Points

- `fireEvent` is `async` and should be `awaited`
- Callbacks execute in registration order
- If no listeners exist, emit() completes immediately (no error)
- Listeners execute **synchronously** within the emit call (despite async emit method)

---

## COMMON EVENT PATTERNS

### Pattern 1: Skill Execution Events

```javascript
// Before skill execution
await this.fireEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, this, target);

// Execute skill logic
let result = await this.doSomething();

// After skill execution
await this.fireEvent(SkillsEvents.SKILL_AFTER_EXECUTE, this, target);
```

### Pattern 2: Modifier Application Events

```javascript
// Before applying modifiers
await this.fireEvent(SkillsEvents.SKILL_APPLY_OWNER_EFFECTS, this, target);

// Apply modifiers
this.applyModifiers(this.ownerEffects, this.owner, true);

// Modifiers applied (no after event - fire within applyModifiers if needed)
```

### Pattern 3: Level Progression Events

```javascript
// Before level up
await this.fireEvent(SkillsEvents.LEVEL_UP, this);

// Apply level modifiers
await this.applyLevelModifiers();

// Level up complete (no explicit after event)
```

---

## EVENT PARAMETERS

### Common Parameter Patterns

Most events pass:
1. **`this`** - The object firing the event (Skill, ClassPath, etc.)
2. **Additional context** - Target, skills, damage, etc.

### Example Event Parameters

```javascript
// SKILL_BEFORE_EXECUTE
await this.fireEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, this, target);
// Params: (skill, target)

// SKILL_ATTACK_APPLY_DAMAGE
await this.fireEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, this, target, damage, newValue);
// Params: (skill, target, damage, newValue)

// LEVEL_EXPERIENCE_ADDED
await this.fireEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED,
    this,              // levelsSet
    number,            // xp added
    newTotalExp,       // new total
    currentLevelIndex, // index
    nextLevelIndex,    // next index
    nextLevelKey,      // next key
    nextLevel,         // next Level object
    nextLevelExp,      // xp required
    isLevelUp          // boolean
);
// Params: (levelsSet, number, newTotal, currentIdx, nextIdx, nextKey, nextLevel, nextExp, isLevelUp)
```

---

## SERVER-CLIENT EVENT SYNCHRONIZATION

### Sender Pattern (Server-Side)

**File:** `lib/server/sender.js`

The Sender class listens to ClassPath events and broadcasts them to connected clients:

```javascript
// Example: Level Up
this.classPath.listenEvent(SkillsEvents.LEVEL_UP, async (classPath) => {
    await this.sendLevelUpData(classPath);
}, this.getOwnerUniqueEventKey('sender.level.up'));
```

**Flow:**
1. Server: ClassPath.levelUp() fires LEVEL_UP event
2. Server: Sender listener catches event
3. Server: Sender.sendLevelUpData() constructs message
4. Server: Client.send() or Client.broadcast() transmits message
5. Client: Receives message
6. Client: Receiver.processMessage() handles it

### Message Format

```javascript
{
    act: 'rski.Lu',  // Action constant (LEVEL_UP)
    owner: 'player-123',
    data: {
        lvl: 5,      // Current level
        lab: 'Warrior',  // Label
        ne: 2000,    // Next level XP
        skl: ['sword', 'shield']  // Skill keys
    }
}
```

### Receiver Pattern (Client-Side)

**File:** `lib/client/receiver.js`

The Receiver processes incoming messages and maps them to handler methods:

```javascript
// In your client code:
class MyGameClient extends Receiver {
    onLevelUp(message) {
        console.log('Level up!', message.data.lvl);
        // Update UI, play animation, etc.
    }
}

// Process all incoming messages
gameServer.onMessage('*', (message) => {
    receiver.processMessage(message);
});
```

---

## TESTING ANTI-PATTERNS

### ❌ ANTI-PATTERN 1: Testing Through Events (Race Conditions)

**BAD:**
```javascript
it('should send level up message', async () => {
    let sender = new Sender(classPath, mockClient);
    sender.registerListeners();  // Registers event listener

    await classPath.levelUp();  // Fires event asynchronously

    // Race condition! Event may not have completed yet
    assert.strictEqual(mockClient.sentMessages.length, 1);  // ❌ May fail randomly
});
```

**GOOD:**
```javascript
it('should send level up message', async () => {
    let sender = new Sender(classPath, mockClient);
    sender.registerListeners();

    // Call method directly, not through events
    await sender.sendLevelUpData(classPath);  // ✓ Deterministic

    assert.strictEqual(mockClient.sentMessages.length, 1);  // ✓ Always works
});
```

### ❌ ANTI-PATTERN 2: Using sleep() to Fix Race Conditions

**BAD:**
```javascript
await classPath.levelUp();
await TestHelpers.sleep(10);  // ❌ Hack to wait for async events
assert.strictEqual(eventFired, true);
```

**GOOD:**
```javascript
await sender.sendLevelUpData(classPath);  // ✓ Call directly
assert.strictEqual(eventFired, true);
```

**When sleep() IS Appropriate:**
```javascript
// Testing actual timer features (skillDelay, castTime)
skill.validate();  // Sets skillActivationTimer
await TestHelpers.sleep(skill.skillDelay + 10);  // ✓ Testing timer behavior
assert.strictEqual(skill.canActivate, true);
```

### ❌ ANTI-PATTERN 3: Reusing removeKeys

**BAD:**
```javascript
// Test 1
classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, callback, 'listener');

// Test 2 (after clearEventListeners)
classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, callback, 'listener');
// ❌ removeKey collision!
```

**GOOD:**
```javascript
// Test 1
classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, callback, 'add-listener');

// Test 2
classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, callback, 'remove-listener');
// ✓ Unique removeKeys
```

---

## EVENT LIFECYCLE

### Skill Execution Event Sequence

```
1. VALIDATE_BEFORE
2. VALIDATE_SUCCESS (or VALIDATE_FAIL)
3. SKILL_BEFORE_EXECUTE
4. SKILL_APPLY_OWNER_EFFECTS (if ownerEffects exist)
5. SKILL_BEFORE_CAST (if castTime > 0)
6. SKILL_BEFORE_RUN_LOGIC
7. SKILL_AFTER_RUN_LOGIC
8. SKILL_AFTER_CAST (if castTime > 0)
9. SKILL_AFTER_EXECUTE
```

### Attack Skill Additional Events

```
10. SKILL_ATTACK_APPLY_DAMAGE (when damage is applied)
```

### Effect Skill Additional Events

```
10. SKILL_EFFECT_TARGET_MODIFIERS (when modifiers are applied)
```

### Physical Skill Additional Events

```
10. SKILL_PHYSICAL_ATTACK_HIT (on collision)
11. SKILL_PHYSICAL_EFFECT_HIT (on collision)
```

### Level Progression Event Sequence

```
1. INIT_LEVEL_SET_START
2. SET_LEVELS
3. GENERATED_LEVELS (for each auto-filled level range)
4. INIT_LEVEL_SET_END
5. LEVEL_EXPERIENCE_ADDED (when XP is added)
6. LEVEL_UP (when level increases)
7. LEVEL_DOWN (when level decreases)
8. LEVEL_APPLY_MODIFIERS (before modifiers are applied/reverted)
```

### ClassPath Event Sequence

```
1. INIT_CLASS_PATH_END (after initialization)
2. SET_SKILLS (after setOwnerSkills)
3. ADD_SKILLS_BEFORE
4. ADD_SKILLS_AFTER
5. REMOVE_SKILLS_BEFORE
6. REMOVE_SKILLS_AFTER
```

---

## EVENT DEBUGGING TIPS

### 1. Check Event Name Construction

```javascript
// Add logging in development
async fireEvent(eventName, ...args) {
    let fullName = this.eventFullName(eventName);
    console.log('[EVENT]', fullName, args);
    return await this.events.emit(fullName, ...args);
}
```

### 2. Verify Listener Registration

```javascript
// Log when registering
listenEvent(eventName, callback, removeKey, masterKey) {
    let fullName = this.eventFullName(eventName);
    console.log('[LISTEN]', fullName, 'key:', removeKey);
    return this.events.onWithKey(fullName, callback, removeKey, masterKey);
}
```

### 3. Check removeKey Collisions

```javascript
// Ensure all removeKeys are unique in your tests
let removeKeys = new Set();

function registerListener(event, callback, removeKey) {
    if (removeKeys.has(removeKey)) {
        throw new Error(`removeKey collision: ${removeKey}`);
    }
    removeKeys.add(removeKey);
    return classPath.listenEvent(event, callback, removeKey);
}
```

---

## CRITICAL RULES

1. **Always await fireEvent()** - It's async for a reason
2. **Use unique removeKeys** - Never reuse removeKeys across tests
3. **Test methods directly** - Don't test through events unless testing the event system itself
4. **Never use sleep() for race conditions** - Fix the test pattern instead
5. **Clear listeners properly** - Call TestHelpers.clearEventListeners() in afterEach
6. **Namespace by owner** - Event names automatically include owner prefix
7. **Pass complete context** - Include all relevant data as event parameters
8. **Document event parameters** - Comment what each event passes to listeners

---

## REFERENCES

- Event Names: `lib/skills-events.js`
- Event Methods: `lib/levels-set.js:257-272`
- Sender Integration: `lib/server/sender.js`
- Receiver Integration: `lib/client/receiver.js`
- Test Helpers: `tests/utils/test-helpers.js`
