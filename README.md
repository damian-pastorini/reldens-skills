[![Reldens - GitHub - Release](https://www.dwdeveloper.com/media/reldens/reldens-mmorpg-platform.png)](https://github.com/damian-pastorini/reldens)

# Reldens - Skills

## About
The idea behind this package is to provide a skills and experience systems so you can relate these to a target owner.
Note, though the package was originally build for the Reldens project it could be implemented anywhere.
 
## Features

- Skills will always have an "owner" object which will execute the skill itself.
```
let mySkill = new Skill({
    key: 'fireball',
    owner: yourPlayerObject
})
```

- Skills could have none (using a direction, only available in Physical skill types), one or multiple targets (this
would cover area skills).
```
// using direction:
let direction = {x: 123, y: 432};
mySkill.execute({direction});
// target:
mySkill.execute({target});
// multiple:
let targets = {multiple: [targetObject1, targetObject2, targetObject3]};
mySkill.execute(targets);
```

- Optional (but mostly recommended) skills could have a re-execution delay time to limit the uses over time, for
example: max 1 execution per 5 seconds.
```
let mySkill = new Skill({
    key: 'fireball',
    owner: yourPlayerObject,
    skillDelay: 5000 // delay time in ms
});
```

- Optional skills could have a uses limit.
```
let mySkill = new Skill({
    key: 'fireball',
    owner: yourPlayerObject,
    uses: 6
});
// after 6 executions
let isValid = mySkill.validate(); // will return false.
```

- Optional set the skill range, determined by X and Y positions between owner (who executes the skill) and target.
```
let mySkill = new Skill({
    key: 'fireball',
    owner: yourPlayerObject,
    range: 10 // for now range can receive a single value which will be the valid interaction margin around the object.
});
// for example:
// let ownerPosition = {x: 1, y: 1};
// let targetPosition = {x: 200, y: 1}; 
let isInRange = mySkill.isInRange(ownerPosition, targetPosition); // will return false because X is too far. 
```

- Skills could have owner attributes conditions and owner attributes effects. For example, a condition could be:
owner.MP > 20 - and the effect could be: owner.MP - 20MP. This will be archive by using "conditions" and "modifiers".
```
let mySkill = new Skill({
    key: 'fireball',
    owner: yourPlayerObject,
    range: 10,
    conditions: [
        {key: 'enoughMp', propertyKey: 'mp', condition: '>=', value: 20}
        // ... include as many as you need.
    ],
    effects: [
        // ModifierConst.OPS.DEC = 2 - this is already available in the modifiers package.
        new Modifier({key: 'lowMp', propertyKey: 'mp', operation: ModifierConst.OPS.DEC, value: 20})
        // ... include as many as you need.
    ]
});
// if the player has MP enough then the execution will succed:
mySkill.execute(target);
```

- Skills could have "conditions" and "rewards" callbacks to run custom actions. For example, a "Craft Weapon" could be
created, but the conditions for the weapon materials and the successfully created weapon item will not be considered as
part of this module scope, for that these custom callbacks will be implemented on the skill class.

```
class MySkill extends Skill
{
    // ....
    onExecuteConditions()
    {
        // implement your custom conditions here.
        return true;
    }

    async onExecuteRewards()
    {
        // implement your custom rewards here.
    }
}
```

- The possibility to create different skills types:

    - Attack: This type will have an specific set of properties and methods to calculate the damage caused to a target.
The skill will require the affected property to which the damage calculation will be applied.
About the damage calculation (ok... I'll try to keep it as simple as possible) - the idea will be to have 6 main damage
properties where you can find: attack and defense, aim and dodge, critical chance and multiplier.
None of these will be required and the calculation will be using the opposite ones where the damage received will be
less if the attack is lower than the defense, the attack could be avoided if dodge is higher than aim, and at the same
time, I would include an option to specify if the aim/dodge will affect the damage or the critical chances as well.
So this way we could specify all the skill owner and target properties related to each of the main properties to later
be used in a proportional calculation using the skill hit damage.
```
let mySkill = new Skill({
    key: 'fireball',
    owner: yourPlayerObject,
    range: 10,
    affectedProperty: 'hp',
    // these are going to be taken from the owner for damage calculation: 
    attackProperties: ['atk', 'power', 'strength'],
    // these are going to be taken from the target for the damage calculation:
    defenseProperties: ['def', 'resistance', 'strength'],
    // in the same way you could specify the aim and dodge properties:
    aimProperties: [],
    dodgeProperties: [],
    // also critical chances can be specify using a multiplier or by adding a fixed value to the result damage:
    criticalChance: 30, // int 0-100 %
    criticalMultiplier: 1.5, // result damage will be multiplied by 1.5 if the skill is critial
    // or just a fixed value that will be added to the result damage:
    // criticalFixedValue: 120,
    // critical damage result can be affected by aim and dodge properties:
    // criticalAffected: true, // if not specified the default value is false
    // conditions and effects on the owner for execution:
    conditions: [
        {key: 'enoughMp', propertyKey: 'mp', condition: '>=', value: 20}
        // ... include as many as you need.
    ],
    effects: [
        // ModifierConst.OPS.DEC = 2 - this is already available in the modifiers package.
        new Modifier({key: 'lowMp', propertyKey: 'mp', operation: ModifierConst.OPS.DEC, value: 20})
        // ... include as many as you need.
    ]
});
// if the player has MP enough then the execution will succed:
mySkill.execute(target);
```

    - Effect: This type implements "modifiers" to cause a direct effect on any target any properties. This will also
accept a time duration in case you like to create a buff type skill to be automatically reverted after the timer ends.
 
    - Physical-(Attack or Effect): These two types will require specific properties and have methods to make the skill
behave like a physical body but execute the skill only "onHit" an specific method created for this matter. For example,
let's say your player can spell a fireball in a direct line to the target, but if the target moves the fireball could
be dodged and the skill won't have any effect. For this case the attack or effect will be calculated if the physical
body hit the target (a callback method onHit will need to be used for this matter).

    - As you can see these are the 4 most basic skill types but over time we will include more types and probably more
properties on the current ones to generate new different behaviors. For example, skills for continues damage over time:
let's say a fireball can burn player making it take minor damage over X time.

- Relate skills to make them depend each other, which finally could end up in a full skills tree.

- Create multiple skills trees, this are basically skill groups and will allow you to create different skill paths.
For example: you can create a "Magician Path" tree by setting a starting point of skills, and using the skills relation
then the player will learn the new skills to follow the path.
This will allow you to create any kind of "classes" / "profession" / "paths" system.

- We will provide with a Levels manager, so we can use it for:

    - Increase player levels based on experience points.
    
    - Win new skills based on levels or just experience amount.
    
- Skills could be affected by levels, some of the options for this will be:

    - For the attack type skills we have two options, multiply by the skill damage by the level factor (a custom
property on the levels), or it could be calculated by getting a proportion of the damage using the skill owner and the
target.
    
    - Another option for any skill type will be to include a modifier on the level to be applied on the skill. This way
we will have the possibility to modify the skill result as we like.
    
    -  Last option to give even more flexibility will be to emit events or callbacks to allow apply a custom logic.

- Events will be used across the package to allow other devs get into the process, for example when the level is
increased or when a skill is executed.


---

If you are using levels to just increase the owner properties, then we could use a simple proportional damage
calculation like the following:

```
// we could include validations for the affect property on the target:
if(target.affectedProperty > 0){
    // these stats (atk and def), would be already affected by the level.
    let diff = owner.atk - target.def;
    // at this point we could use levels modifiers to change the hitDamage here.
    let damage = this.hitDamage; // this is an int that will be the damage at 100%
    if(diff > 0){
        let p = diff < target.def ? (diff * 100 / target.def) : 99;
        p = p > 99 ? 99 : p; // maximum modifier percentage to add.
        let additionalDamage = Math.ceil((p * damage / 100));
        damage = damage + additionalDamage;
    }
    if(diff < 0){
        let p = -diff < owner.atk ? (-diff * 100 / owner.atk) : 99;
        p = p > 99 ? 99 : p; // maximum modifier percentage to remove.
        let reduceDamage = Math.floor((p * damage / 100));
        damage = damage - reduceDamage;
    }
    target.affectedProperty -= damage;
    // similar to sample above we could use the owner.level and target.level to get the additional or reduced damage. 
}
// we could avoid getting the affectedProperty below 0:
if(target.affectedProperty < 0){
    target.affectedProperty = 0;
}
```

---

## Documentation

[https://www.reldens.com/documentation/skills](https://www.reldens.com/documentation/skills)

---


### [Reldens](https://github.com/damian-pastorini/reldens/ "Reldens")

##### [By DwDeveloper](https://www.dwdeveloper.com/ "DwDeveloper")
