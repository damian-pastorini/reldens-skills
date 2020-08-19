

class Calculator
{

    run(owner, target)
    {

    }

    basicDamage(owner, target)
    {
        // @TODO: modify the damage calculation to involve any other player attribute (like speed, dodge, etc).
        if(target.stats.hp > 0){
            // @NOTE: this is just a basic example on how using modifiers for atk and def could affect the hit damage.
            let diff = owner.stats.atk - target.stats.def;
            let damage = this.hitDamage; // 100%
            if(diff > 0){
                let p = diff < target.stats.def ? (diff * 100 / target.stats.def) : 99;
                p = p > 99 ? 99 : p; // maximum modifier percentage to add.
                let additionalDamage = Math.ceil((p * damage / 100));
                damage = damage + additionalDamage;
            }
            if(diff < 0){
                let p = -diff < owner.stats.atk ? (-diff * 100 / owner.stats.atk) : 99;
                p = p > 99 ? 99 : p; // maximum modifier percentage to remove.
                let reduceDamage = Math.floor((p * damage / 100));
                damage = damage - reduceDamage;
            }
            target.stats.hp -= damage;
        }
        // avoid getting below 0:
        if(target.stats.hp < 0){
            target.stats.hp = 0;
        }
    }

}

module.exports = Calculator;