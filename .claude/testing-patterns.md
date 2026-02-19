# TESTING PATTERNS AND BEST PRACTICES
## Lessons Learned from @reldens/skills Test Suite

---

## OVERVIEW

This document captures critical testing patterns, anti-patterns, and best practices learned from debugging and fixing the @reldens/skills test suite. These patterns apply to any event-driven system using EventsManagerSingleton.

---

## CRITICAL RULES

### Rule #1: NEVER Test Through Events Unless Testing the Event System Itself

**Why:** Event firing is asynchronous and creates race conditions that make tests non-deterministic.

**❌ ANTI-PATTERN:**
```javascript
it('should send level up message to client', async () => {
    let sender = new Sender(classPath, mockClient);
    sender.registerListeners(); // Registers event listener

    // This fires LEVEL_UP event asynchronously
    await classPath.levelUp();

    // Race condition! Event listener may not have completed yet
    assert.strictEqual(mockClient.sentMessages.length, 1); // ❌ May fail randomly
});
```

**✅ CORRECT PATTERN:**
```javascript
it('should send level up message to client', async () => {
    let sender = new Sender(classPath, mockClient);
    sender.registerListeners();

    // Call the method directly, bypassing event system
    await sender.sendLevelUpData(classPath);

    // Deterministic - method has completed before assertion
    assert.strictEqual(mockClient.sentMessages.length, 1); // ✓ Always works
});
```

**When to Test Through Events:**
- When explicitly testing event firing/listening behavior
- When testing event parameter passing
- When testing event sequence/order

**Example of Valid Event Testing:**
```javascript
it('should fire LEVEL_UP event with correct parameters', async () => {
    let eventFired = false;
    let receivedClassPath = null;

    classPath.listenEvent(SkillsEvents.LEVEL_UP, (cp) => {
        eventFired = true;
        receivedClassPath = cp;
    }, 'test-level-up-event');

    await classPath.levelUp();

    assert.strictEqual(eventFired, true);
    assert.strictEqual(receivedClassPath, classPath);
});
```

---

### Rule #2: NEVER Use sleep() to Fix Race Conditions

**Why:** sleep() is a band-aid that masks the real problem. Tests should be deterministic, not time-dependent.

**❌ ANTI-PATTERN:**
```javascript
it('should update client after skill execution', async () => {
    await skill.execute(target);
    await TestHelpers.sleep(10); // ❌ Waiting for async event to complete
    assert.strictEqual(mockClient.updated, true); // Flaky test
});
```

**✅ CORRECT PATTERN:**
```javascript
it('should update client after skill execution', async () => {
    await sender.sendSkillExecutionData(skill, target); // Direct method call
    assert.strictEqual(mockClient.updated, true); // Deterministic
});
```

**When sleep() IS Appropriate:**
```javascript
it('should restore canActivate after skillDelay', async () => {
    let skill = new Skill({
        owner: mockOwner,
        skillDelay: 100 // Actual timer feature
    });

    skill.validate();
    assert.strictEqual(skill.canActivate, false);

    // ✓ Testing actual timer behavior
    await TestHelpers.sleep(150);

    assert.strictEqual(skill.canActivate, true);
});
```

**Summary:**
- ❌ Don't use sleep() to wait for async events
- ✓ Do use sleep() to test actual timer/delay features (skillDelay, castTime)

---

### Rule #3: ALWAYS Use Unique removeKeys

**Why:** EventsManagerSingleton maintains a GLOBAL removeKey registry that persists across tests even after `clearEventListeners()`.

**❌ ANTI-PATTERN:**
```javascript
// test-class-path.js
describe('ClassPath Events', () => {
    afterEach(async () => {
        await TestHelpers.clearEventListeners();
    });

    it('should fire ADD_SKILLS events', async () => {
        classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, callback, 'before-listener');
        classPath.listenEvent(SkillsEvents.ADD_SKILLS_AFTER, callback, 'after-listener');
        // Test passes
    });

    it('should fire REMOVE_SKILLS events', async () => {
        // ❌ removeKey collision! 'before-listener' already exists in global registry
        classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, callback, 'before-listener');
        classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_AFTER, callback, 'after-listener');
        // Listeners silently fail to register - test fails
    });
});
```

**✅ CORRECT PATTERN:**
```javascript
describe('ClassPath Events', () => {
    afterEach(async () => {
        await TestHelpers.clearEventListeners();
    });

    it('should fire ADD_SKILLS events', async () => {
        classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, callback, 'add-before-listener');
        classPath.listenEvent(SkillsEvents.ADD_SKILLS_AFTER, callback, 'add-after-listener');
        // Test passes
    });

    it('should fire REMOVE_SKILLS events', async () => {
        // ✓ Unique removeKeys
        classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, callback, 'remove-before-listener');
        classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_AFTER, callback, 'remove-after-listener');
        // Listeners register correctly - test passes
    });
});
```

**Best Practice - Use Descriptive, Namespaced removeKeys:**
```javascript
// Pattern: {test-suite}.{test-name}.{event-name}.{listener-purpose}
classPath.listenEvent(
    SkillsEvents.LEVEL_UP,
    callback,
    'class-path.level-progression.level-up.verify-label-change'
);
```

---

### Rule #4: ALWAYS Clear Event Listeners in afterEach

**Why:** Event listeners persist across tests and can cause unexpected side effects.

**❌ ANTI-PATTERN:**
```javascript
describe('Skill Events', () => {
    it('test 1', async () => {
        skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, callback, 'listener-1');
        // Test completes, listener still registered
    });

    it('test 2', async () => {
        await skill.execute(target);
        // ❌ Listener from test 1 still fires! Unexpected callback execution
    });
});
```

**✅ CORRECT PATTERN:**
```javascript
describe('Skill Events', () => {
    afterEach(async () => {
        await TestHelpers.clearEventListeners();
    });

    it('test 1', async () => {
        skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, callback, 'listener-1');
        // Test completes
    });
    // afterEach clears listeners

    it('test 2', async () => {
        await skill.execute(target);
        // ✓ No listeners from test 1
    });
});
```

**TestHelpers.clearEventListeners() Implementation:**
```javascript
// tests/utils/test-helpers.js
static async clearEventListeners()
{
    await EventsManagerSingleton.removeAllListeners();
}
```

**Important Note:**
- `clearEventListeners()` removes listener registrations
- It does NOT clear the removeKey registry
- This is why unique removeKeys are critical

---

### Rule #5: Test State Changes, Not Internal Implementation

**Why:** Tests should verify behavior and outcomes, not implementation details.

**❌ ANTI-PATTERN:**
```javascript
it('should call applyModifiers internally', async () => {
    let applyModifiersCalled = false;
    let originalMethod = skill.applyModifiers;
    skill.applyModifiers = function(...args) {
        applyModifiersCalled = true;
        return originalMethod.apply(this, args);
    };

    await skill.execute(target);

    assert.strictEqual(applyModifiersCalled, true); // ❌ Testing implementation
});
```

**✅ CORRECT PATTERN:**
```javascript
it('should apply target effects to target', async () => {
    let initialValue = mockTarget.stats.hp;
    let modifier = new Modifier({
        key: 'hp-buff',
        propertyKey: 'stats.hp',
        operation: '+',
        value: 20
    });
    let skill = new Effect({
        owner: mockOwner,
        targetEffects: [modifier]
    });

    await skill.execute(mockTarget);

    // ✓ Testing observable behavior
    assert.strictEqual(mockTarget.stats.hp, initialValue + 20);
});
```

---

### Rule #6: Use Fixtures for Consistent Test Data

**Why:** Reduces duplication, ensures consistency, makes tests easier to maintain.

**❌ ANTI-PATTERN:**
```javascript
it('test 1', async () => {
    let skill = new Attack({
        key: 'sword-attack',
        owner: mockOwner,
        hitDamage: 50,
        attackProperties: ['atk'],
        defenseProperties: ['def']
    });
    // Use skill
});

it('test 2', async () => {
    // ❌ Duplicate skill creation with slightly different values
    let skill = new Attack({
        key: 'sword-attack',
        owner: mockOwner,
        hitDamage: 45, // Oops, different damage
        attackProperties: ['atk'],
        defenseProperties: ['def']
    });
    // Use skill
});
```

**✅ CORRECT PATTERN:**
```javascript
// tests/fixtures/skills/attack-skills.js
export const basicSwordAttack = {
    key: 'sword-attack',
    hitDamage: 50,
    attackProperties: ['atk'],
    defenseProperties: ['def'],
    affectedProperty: 'hp'
};

// tests/unit/types/test-attack.js
import { basicSwordAttack } from '../../fixtures/skills/attack-skills.js';

it('test 1', async () => {
    let skill = new Attack({
        ...basicSwordAttack,
        owner: mockOwner
    });
    // Use skill
});

it('test 2', async () => {
    let skill = new Attack({
        ...basicSwordAttack,
        owner: mockOwner
    });
    // ✓ Consistent skill data
});
```

---

### Rule #7: Mock External Dependencies

**Why:** Unit tests should be isolated from external systems (network, database, physics engine).

**❌ ANTI-PATTERN:**
```javascript
it('should execute physical skill', async () => {
    let physicsEngine = new RealPhysicsEngine(); // ❌ Real physics engine
    let owner = new Player({physicsEngine});
    let skill = new PhysicalAttack({owner});

    await skill.execute(target); // Depends on real physics simulation
});
```

**✅ CORRECT PATTERN:**
```javascript
it('should execute physical skill', async () => {
    let mockOwner = new MockOwner();
    mockOwner.executePhysicalSkill = async (target, skill, executeOnHit) => {
        // ✓ Mock physics behavior
        await executeOnHit(target);
        return true;
    };

    let skill = new PhysicalAttack({
        owner: mockOwner,
        objectWidth: 10,
        objectHeight: 10
    });

    await skill.execute(mockTarget);
    // Deterministic, fast, isolated
});
```

**Mock Classes in @reldens/skills:**
- `MockOwner` - Mock entity with position methods
- `MockTarget` - Mock target with stats
- `MockClient` - Mock network client with send/broadcast

---

### Rule #8: Test Edge Cases and Boundary Conditions

**Why:** Edge cases reveal bugs that normal cases don't.

**Examples:**

**Boundary Values:**
```javascript
it('should handle 0 damage', async () => {
    let skill = new Attack({
        owner: mockOwner,
        hitDamage: 0
    });
    await skill.execute(mockTarget);
    // Verify behavior with zero damage
});

it('should handle infinite range', async () => {
    let skill = new Skill({
        owner: mockOwner,
        range: 0 // 0 = infinite range
    });
    assert.strictEqual(skill.owner.isInRange(skill, farAwayTarget, skill.range), true);
});
```

**Null/Undefined:**
```javascript
it('should handle undefined target', async () => {
    let skill = new Effect({owner: mockOwner});
    let result = await skill.execute(undefined);
    assert.strictEqual(result.error, SKILL.TARGET_NOT_AVAILABLE);
});
```

**Empty Collections:**
```javascript
it('should handle empty ownerEffects', async () => {
    let skill = new Skill({
        owner: mockOwner,
        ownerEffects: []
    });
    await skill.execute(mockTarget);
    // Should not throw, should skip effects application
});
```

**Maximum Values:**
```javascript
it('should not allow damage below 0 when allowEffectBelowZero is false', async () => {
    mockTarget.stats.hp = 50;
    let skill = new Attack({
        owner: mockOwner,
        hitDamage: 100,
        allowEffectBelowZero: false
    });
    await skill.execute(mockTarget);
    assert.strictEqual(mockTarget.stats.hp, 0); // Clamped to 0
});
```

---

### Rule #9: Use Descriptive Test Names

**Why:** Test names should describe what is being tested and expected outcome.

**❌ ANTI-PATTERN:**
```javascript
it('test 1', async () => {
    // What does this test?
});

it('attack works', async () => {
    // Too vague
});

it('check dodge', async () => {
    // Unclear expectation
});
```

**✅ CORRECT PATTERN:**
```javascript
it('should apply damage to target hp when attack succeeds', async () => {
    // Clear: what, when, expected outcome
});

it('should return DODGED error when target dodge > aim * dodgeOverAimSuccess', async () => {
    // Clear: condition and expected result
});

it('should apply critical damage multiplier when critical roll succeeds', async () => {
    // Clear: feature and expected behavior
});
```

**Pattern:**
```
should [action/behavior] when [condition]
should [expected outcome] [optional: given specific input]
```

---

### Rule #10: One Assertion Per Logical Concept

**Why:** Multiple unrelated assertions make it hard to identify what failed.

**❌ ANTI-PATTERN:**
```javascript
it('should execute skill correctly', async () => {
    await skill.execute(target);
    assert.strictEqual(skill.usesCount, 1); // Tests usage tracking
    assert.strictEqual(target.stats.hp, 80); // Tests damage application
    assert.strictEqual(skill.canActivate, false); // Tests cooldown
    assert.strictEqual(mockClient.messagesSent.length, 1); // Tests networking
    // If this fails, which assertion failed? What broke?
});
```

**✅ CORRECT PATTERN:**
```javascript
describe('Skill execution', () => {
    it('should increment usesCount after execution', async () => {
        await skill.execute(target);
        assert.strictEqual(skill.usesCount, 1);
    });

    it('should apply damage to target hp', async () => {
        let initialHp = target.stats.hp;
        await skill.execute(target);
        assert.strictEqual(target.stats.hp, initialHp - skill.hitDamage);
    });

    it('should set canActivate to false during cooldown', async () => {
        await skill.execute(target);
        assert.strictEqual(skill.canActivate, false);
    });

    it('should send execution message to client', async () => {
        await sender.sendSkillExecutionData(skill, target);
        assert.strictEqual(mockClient.messagesSent.length, 1);
    });
});
```

**Exception - Related Assertions:**
```javascript
it('should calculate damage correctly with attack and defense', async () => {
    mockOwner.atk = 100;
    mockTarget.def = 50;
    let result = await skill.execute(mockTarget);

    // These are all related to damage calculation
    assert.ok(result.damages);
    assert.ok(result.damages.hp);
    assert.strictEqual(typeof result.damages.hp, 'number');
    assert.ok(result.damages.hp > 0);
});
```

---

## COMMON TESTING ANTI-PATTERNS

### Anti-Pattern #1: Testing Private Methods

**❌ DON'T:**
```javascript
it('should call private _calculateDamage method', async () => {
    let damage = skill._calculateDamage(target);
    assert.ok(damage > 0);
});
```

**✅ DO:**
```javascript
it('should apply calculated damage to target', async () => {
    let initialHp = target.stats.hp;
    await skill.execute(target);
    assert.ok(target.stats.hp < initialHp);
});
```

---

### Anti-Pattern #2: Over-Mocking

**❌ DON'T:**
```javascript
it('should execute skill', async () => {
    // Mocking everything - not testing real behavior
    skill.validate = () => true;
    skill.runSkillLogic = () => ({success: true});
    skill.fireEvent = () => {};

    let result = await skill.execute(target);
    assert.strictEqual(result.success, true); // Not testing anything real
});
```

**✅ DO:**
```javascript
it('should execute skill', async () => {
    // Only mock external dependencies
    let skill = new Attack({
        owner: mockOwner, // Mock
        hitDamage: 50
    });

    let result = await skill.execute(mockTarget); // Real execution
    assert.ok(result.damages); // Real result
});
```

---

### Anti-Pattern #3: Testing Framework Code

**❌ DON'T:**
```javascript
it('should fire event through EventsManager', async () => {
    let eventFired = false;
    EventsManagerSingleton.on('test.event', () => {
        eventFired = true;
    });

    await EventsManagerSingleton.emit('test.event');
    assert.strictEqual(eventFired, true); // Testing EventsManager, not your code
});
```

**✅ DO:**
```javascript
it('should fire LEVEL_UP event when leveling up', async () => {
    let eventFired = false;
    classPath.listenEvent(SkillsEvents.LEVEL_UP, () => {
        eventFired = true;
    }, 'test-level-up');

    await classPath.levelUp(); // Testing your code
    assert.strictEqual(eventFired, true);
});
```

---

### Anti-Pattern #4: Assertion-less Tests

**❌ DON'T:**
```javascript
it('should execute skill without errors', async () => {
    await skill.execute(target);
    // No assertions - test passes even if skill is broken
});
```

**✅ DO:**
```javascript
it('should execute skill without errors', async () => {
    let result = await skill.execute(target);
    assert.ok(result); // At minimum, verify result exists
    assert.strictEqual(result.error, undefined); // Verify no error
});
```

---

### Anti-Pattern #5: Dependent Tests

**❌ DON'T:**
```javascript
let sharedSkill;

it('test 1 - create skill', async () => {
    sharedSkill = new Skill({owner: mockOwner});
});

it('test 2 - use skill', async () => {
    // ❌ Depends on test 1 running first
    await sharedSkill.execute(target);
});
```

**✅ DO:**
```javascript
it('test 1 - create skill', async () => {
    let skill = new Skill({owner: mockOwner});
    // Test skill creation
});

it('test 2 - use skill', async () => {
    let skill = new Skill({owner: mockOwner}); // ✓ Independent
    await skill.execute(target);
});
```

---

## PROVEN TESTING PATTERNS

### Pattern #1: Arrange-Act-Assert (AAA)

```javascript
it('should apply damage to target hp', async () => {
    // ARRANGE - Set up test data
    let initialHp = mockTarget.stats.hp;
    let skill = new Attack({
        owner: mockOwner,
        hitDamage: 50,
        affectedProperty: 'hp'
    });

    // ACT - Execute the behavior
    await skill.execute(mockTarget);

    // ASSERT - Verify the outcome
    assert.strictEqual(mockTarget.stats.hp, initialHp - 50);
});
```

---

### Pattern #2: Setup and Teardown

```javascript
describe('Attack Skills', () => {
    let mockOwner, mockTarget, skill;

    beforeEach(() => {
        // SETUP - Run before each test
        mockOwner = new MockOwner();
        mockTarget = new MockTarget();
        skill = new Attack({
            owner: mockOwner,
            hitDamage: 50
        });
    });

    afterEach(async () => {
        // TEARDOWN - Clean up after each test
        await TestHelpers.clearEventListeners();
    });

    it('test 1', async () => {
        // Use fresh instances
    });

    it('test 2', async () => {
        // Use fresh instances
    });
});
```

---

### Pattern #3: Parameterized Tests

```javascript
describe('Damage calculation with various stats', () => {
    const testCases = [
        {atk: 100, def: 0, expectedDamage: 50},
        {atk: 100, def: 50, expectedDamage: 25},
        {atk: 100, def: 100, expectedDamage: 0},
        {atk: 50, def: 100, expectedDamage: 0}
    ];

    testCases.forEach(({atk, def, expectedDamage}) => {
        it(`should deal ${expectedDamage} damage when atk=${atk} and def=${def}`, async () => {
            mockOwner.atk = atk;
            mockTarget.def = def;
            let skill = new Attack({
                owner: mockOwner,
                hitDamage: 50,
                attackProperties: ['atk'],
                defenseProperties: ['def']
            });

            let result = await skill.execute(mockTarget);

            assert.strictEqual(result.damages.hp, expectedDamage);
        });
    });
});
```

---

### Pattern #4: Test Doubles (Mock, Stub, Spy)

**Mock - Verify interaction:**
```javascript
it('should call executePhysicalSkill on owner', async () => {
    let called = false;
    let receivedTarget = null;

    mockOwner.executePhysicalSkill = async (target, skill, callback) => {
        called = true;
        receivedTarget = target;
        await callback(target);
    };

    let skill = new PhysicalAttack({
        owner: mockOwner,
        objectWidth: 10,
        objectHeight: 10
    });

    await skill.execute(mockTarget);

    assert.strictEqual(called, true);
    assert.strictEqual(receivedTarget, mockTarget);
});
```

**Stub - Provide controlled response:**
```javascript
it('should handle out of range result', async () => {
    mockOwner.isInRange = () => false; // Stub returns false

    let skill = new Skill({
        owner: mockOwner,
        range: 100,
        rangeAutomaticValidation: true
    });

    let result = skill.validate();

    assert.strictEqual(result, false);
});
```

**Spy - Track calls:**
```javascript
it('should fire event multiple times', async () => {
    let callCount = 0;
    let receivedArgs = [];

    skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, (...args) => {
        callCount++;
        receivedArgs.push(args);
    }, 'spy-listener');

    await skill.execute(target1);
    await skill.execute(target2);

    assert.strictEqual(callCount, 2);
    assert.strictEqual(receivedArgs.length, 2);
});
```

---

### Pattern #5: Error Testing

```javascript
it('should return error when target is out of range', async () => {
    mockOwner.isInRange = () => false;

    let skill = new Effect({
        owner: mockOwner,
        range: 100,
        rangeAutomaticValidation: true
    });

    let result = await skill.execute(mockTarget);

    assert.strictEqual(result.error, SKILL.OUT_OF_RANGE);
});

it('should return error when owner is casting', async () => {
    mockOwner.isCasting = true;

    let skill = new Skill({owner: mockOwner});
    let result = await skill.execute(mockTarget);

    assert.strictEqual(result.error, SKILL.CAN_NOT_ACTIVATE);
});
```

---

## BUG DISCOVERY PATTERNS

### Pattern: Proof Before Fix

**Process:**
1. Identify failing test
2. Read production code completely
3. Trace execution flow with debugger/logs
4. Find exact line causing issue
5. Understand why it's wrong
6. Provide proof (comparison to correct code, specification)
7. Apply fix
8. Verify fix resolves issue

**Example from Session:**

**Bug:** Skill.applyModifiers() applying critical to wrong value

**Proof Process:**
1. Test showed: Expected 100, got 120 (with 2x critical)
2. Read lib/skill.js:293-309 completely
3. Traced: modifier.value = 10, current = 80, critical = 2x
4. Found bug at line 307:
   ```javascript
   newValue = this.applyCriticalValue(newValue); // Applies to (80+10)=90
   ```
5. Compared to Attack.js:101 (correct pattern):
   ```javascript
   damage = damage + this.getCriticalDiff(damage); // Applies to damage only
   ```
6. Proof: Attack applies critical to damage value only, Effect was applying to sum
7. Applied fix using getCriticalDiff()
8. Test passed: 80 + (10*2) = 100 ✓

---

### Pattern: Explore Don't Guess

**❌ DON'T:**
```javascript
// Test is failing, let me try:
await TestHelpers.sleep(10); // Maybe timing issue?
// Still failing, let me try:
classPath.listenEvent(..., 'different-key'); // Maybe key issue?
// Still failing, let me try:
await classPath.levelUp(); await classPath.levelUp(); // Call twice?
// ❌ Guessing randomly
```

**✅ DO:**
```javascript
// Test is failing
// 1. Read the test completely
// 2. Read the production code completely
// 3. Add logging to trace execution
// 4. Find WHERE it fails
// 5. Find WHY it fails
// 6. Prove the root cause
// 7. Apply targeted fix
```

**Example from Session:**

**Issue:** REMOVE_SKILLS event listeners not firing

**Exploration:**
1. Read test completely - sees listeners registered, event fired, but flags stay false
2. Read ClassPath.listenEvent() - calls events.onWithKey()
3. Read EventsManagerSingleton - found removeKey registry
4. Read clearEventListeners() - clears listeners but NOT registry
5. Checked ADD_SKILLS test - used same removeKeys!
6. **Proof:** removeKey registry persists, causing collision
7. **Fix:** Use unique removeKeys

---

## TEST ORGANIZATION

### File Structure:
```
tests/
├── run-tests.js                    # Test runner
├── utils/
│   └── test-helpers.js            # Shared utilities
├── fixtures/
│   ├── mocks/                     # Mock classes
│   ├── skills/                    # Skill test data
│   └── levels/                    # Level test data
└── unit/
    ├── test-skill.js              # Unit tests
    ├── test-levels-set.js
    ├── types/
    │   ├── test-attack.js
    │   └── test-effect.js
    ├── server/
    │   └── test-sender.js
    └── client/
        └── test-receiver.js
```

### Test File Template:
```javascript
import {describe, it, beforeEach, afterEach} from 'node:test';
import assert from 'node:assert';
import {Skill} from '../../lib/skill.js';
import {MockOwner} from '../fixtures/mocks/mock-owner.js';
import {TestHelpers} from '../utils/test-helpers.js';

describe('Skill - Feature Description', () => {
    let mockOwner, mockTarget, skill;

    beforeEach(() => {
        mockOwner = new MockOwner();
        mockTarget = new MockTarget();
    });

    afterEach(async () => {
        await TestHelpers.clearEventListeners();
    });

    describe('Sub-feature', () => {
        it('should do X when Y', async () => {
            // Arrange
            // Act
            // Assert
        });
    });
});
```

---

## DEBUGGING CHECKLIST

When a test fails:

- [ ] Read the complete test code
- [ ] Read the complete production code being tested
- [ ] Understand what the test expects
- [ ] Understand what the production code does
- [ ] Add logging to trace execution
- [ ] Identify the exact line that produces wrong result
- [ ] Understand WHY it's wrong
- [ ] Find proof (comparison, specification, other code)
- [ ] Apply targeted fix
- [ ] Verify fix works
- [ ] Check for similar issues in other code
- [ ] Update documentation if pattern discovered

**NEVER:**
- [ ] Guess randomly
- [ ] Try multiple fixes without understanding
- [ ] Use sleep() to mask race conditions
- [ ] Delete tests instead of fixing them
- [ ] Modify tests to match broken code

---

## CRITICAL LESSONS FROM SESSION

### Lesson #1: EventsManagerSingleton removeKey Registry Persists

**Discovery:** removeKey registry is NOT cleared by removeAllListeners()

**Impact:** Tests reusing removeKeys fail silently

**Solution:** Use unique removeKeys across all tests

**Pattern:**
```javascript
'{component}.{test-suite}.{specific-test}.{event-name}'
// Example: 'class-path.events.remove-skills.before-listener'
```

---

### Lesson #2: Critical Applies to Value Only, Not Sum

**Discovery:** Critical should apply to modifier/damage value, not to (current + value)

**Impact:** Critical damage/effects were doubled incorrectly

**Solution:** Use getCriticalDiff() to calculate bonus, add to result

**Pattern:**
```javascript
let newValue = modifier.getModifiedValue(); // current + value
newValue = newValue + this.getCriticalDiff(modifier.value); // + critical bonus
```

---

### Lesson #3: Test Methods Directly, Not Through Events

**Discovery:** Testing through events creates race conditions

**Impact:** Tests fail randomly due to timing

**Solution:** Call methods directly, only test events when testing event system

**Pattern:**
```javascript
// ❌ await classPath.levelUp(); assert(client.messagesSent);
// ✓ await sender.sendLevelUpData(classPath); assert(client.messagesSent);
```

---

### Lesson #4: sleep() is for Timers, Not Race Conditions

**Discovery:** sleep() masks async issues instead of fixing them

**Impact:** Tests become time-dependent and flaky

**Solution:** Fix test pattern (direct calls), only use sleep() for timer features

**Pattern:**
```javascript
// ❌ await action(); await sleep(10); assert(result);
// ✓ await directMethod(); assert(result);
// ✓ skill.validate(); await sleep(skillDelay + 10); assert(canActivate);
```

---

## REFERENCES

- Test Runner: `tests/run-tests.js`
- Test Helpers: `tests/utils/test-helpers.js`
- Mock Classes: `tests/fixtures/mocks/`
- Event System: `.claude/event-system-architecture.md`
- Skill Execution: `.claude/skill-execution-flow.md`
