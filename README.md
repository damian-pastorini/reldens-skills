[![Reldens - GitHub - Release](https://www.dwdeveloper.com/media/reldens/reldens-mmorpg-platform.png)](https://github.com/damian-pastorini/reldens)

# Reldens - Skills

## About
The idea behind this package is to provide a skills and experience systems so you can relate these to a target owner.
Note, though the package was originally build for the Reldens project it could be implemented anywhere.
 
## Features

- Skills will always have an "owner" object which will execute the skill itself.

- Skills could have none (using a direction), one or multiple targets (this would cover area skills).

- Optional (but mostly recommended) skills could have a re-execution delay time to limit the uses over time, for
example: max 1 execution per 5 seconds.

- Optional skills could have a uses limit.

- Optional set the skill range, determined by X and Y positions between owner (who executes the skill) and target.

- Skills could have owner attributes conditions and owner attributes effects. For example, a condition could be:
owner.MP > 20 - and the effect could be: owner.MP - 20MP. This will be archive by using "conditions" and "modifiers".

- Skills could have "conditions" and "rewards" callbacks to run custom actions. For example, a "Craft Weapon" could be
created, but the conditions for the weapon materials and the successfully created weapon item will not be considered as
part of this module scope, for that these custom callbacks will be implemented on the skill class. 

- The possibility to create different skills types:

    - Attack: This type will require a set of properties and have methods to calculate the damage caused to a target.

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

- Increase player levels based on experience points.

- Win new skills based on levels or just experience amount.

## Documentation

[https://www.reldens.com/documentation/skills](https://www.reldens.com/documentation/skills)

---


### [Reldens](https://github.com/damian-pastorini/reldens/ "Reldens")

##### [By DwDeveloper](https://www.dwdeveloper.com/ "DwDeveloper")
