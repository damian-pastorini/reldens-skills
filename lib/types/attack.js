
const { ErrorManager } = require('@reldens/utils');
const { PropertyManager, Calculator } = require('@reldens/modifiers');
const Skill = require('../skill');

class Attack extends Skill
{

    constructor(props)
    {
        super(props);
        if(!{}.hasOwnProperty.call(props, 'affectedProperty')){
            ErrorManager.error('Missing skill affectedProperty to which the result damage will be applied.');
        }
        // the affected property is the one to which the damage calculation will have effect:
        this.affectedProperty = props.affectedProperty;
        this.allowEffectBelowZero = {}.hasOwnProperty.call(props, 'allowEffectBelowZero')
            ? props.allowEffectBelowZero : false;
        // hit damage value at 100%:
        this.hitDamage = {}.hasOwnProperty.call(props, 'hitDamage') ? props.hitDamage : 0;
        this.applyDirectDamage = {}.hasOwnProperty.call(props, 'applyDirectDamage') ? props.applyDirectDamage : false;
        // all properties are obtained from the skill owner and the target to calculate the damage:
        this.attackProperties = {}.hasOwnProperty.call(props, 'attackProperties') ? props.attackProperties : [];
        this.defenseProperties = {}.hasOwnProperty.call(props, 'defenseProperties') ? props.defenseProperties : [];
        // aim and dodge properties are used to determine if the skill could fail:
        this.aimProperties = {}.hasOwnProperty.call(props, 'aimProperties') ? props.aimProperties : [];
        this.dodgeProperties = {}.hasOwnProperty.call(props, 'dodgeProperties') ? props.dodgeProperties : [];
        // dodgeFullEnabled will make the attack fail if: dodge > ownerAim * dodgeOverAimSuccess
        this.dodgeFullEnabled = {}.hasOwnProperty.call(props, 'dodgeFullEnabled') ? props.dodgeFullEnabled : true;
        this.dodgeOverAimSuccess = {}.hasOwnProperty.call(props, 'dodgeOverAimSuccess') ? props.dodgeOverAimSuccess : 2;
        // specify if the damage or the critical will be affected by the aim and dodge properties:
        this.damageAffected = {}.hasOwnProperty.call(props, 'damageAffected') ? props.damageAffected : false;
        this.criticalAffected = {}.hasOwnProperty.call(props, 'criticalAffected') ? props.criticalAffected : false;
        // helpers:
        this.propertyManager = new PropertyManager();
        this.calc = new Calculator();
    }

    runSkillLogic(target)
    {
        return this.applyDamageTo(this.target);
    }

    applyDamageTo(target)
    {
        // @NOTE: both owner and target properties values has to be calculated at the time the skill is executed, that
        //  is why we are getting the target as parameter and not using this.target.
        // check if the skill can be dodged:
        let ownerAim = this.getPropertiesTotal(this.owner, this.aimProperties);
        let targetDodge = this.getPropertiesTotal(target, this.dodgeProperties);
        if(this.dodgeFullEnabled && targetDodge > (ownerAim * this.dodgeOverAimSuccess)){
            return false;
        }
        if(this.allowEffectBelowZero || target[this.affectedProperty] > 0){
            let damage = this.hitDamage; // 100%
            // dodge proportion:
            let dodgeAimDiff = this.getDiffProportion(ownerAim, targetDodge);
            if(!this.applyDirectDamage){
                let ownerAtk = this.getPropertiesTotal(this.owner, this.attackProperties);
                let targetDef = this.getPropertiesTotal(target, this.defenseProperties);
                // atk and def calculation to affect the hit damage:
                let diff = ownerAtk - targetDef;
                if(diff > 0){
                    let p = diff < targetDef ? (diff * 100 / targetDef) : 99;
                    p = p > 99 ? 99 : p; // maximum modifier percentage to add.
                    let additionalDamage = Math.ceil((p * damage / 100));
                    damage = damage + additionalDamage;
                }
                if(diff < 0){
                    let p = -diff < ownerAtk ? (-diff * 100 / ownerAtk) : 99;
                    p = p > 99 ? 99 : p; // maximum modifier percentage to remove.
                    let reduceDamage = Math.floor((p * damage / 100));
                    damage = damage - reduceDamage;
                }
                if(this.damageAffected && targetDodge > ownerAim){
                    // calculate dodge proportion over damage and remove it from the total:
                    let damageProportion = Math.floor((damage * dodgeAimDiff / 100));
                    damage = damage - damageProportion;
                }
            }
            // critical calculation:
            let criticalValue = this.getCriticalDiff(damage);
            if(this.criticalAffected && targetDodge > ownerAim){
                // calculate dodge proportion over critical damage and remove it from the critical total:
                let criticalProportion = Math.floor((criticalValue * dodgeAimDiff / 100));
                criticalValue = criticalValue - criticalProportion;
            }
            damage = damage + criticalValue;
            // avoid getting below 0:
            if(!this.allowEffectBelowZero && target[this.affectedProperty] < damage){
                target[this.affectedProperty] = 0;
            } else {
                target[this.affectedProperty] -= damage;
            }
        }
    }

    getPropertiesTotal(object, propertiesArray)
    {
        let totalValue = 0;
        if(Object.keys(propertiesArray).length){
            for(let prop of propertiesArray){
                let propValue = this.propertyManager.getPropertyValue(object, prop.key);
                totalValue = this.calc.calculateNewValue(totalValue, prop.op, propValue);
            }
        }
        return totalValue;
    }

    getDiffProportion(totalValue, upProportionValue)
    {
        let propertiesDiff = upProportionValue - totalValue;
        return ((propertiesDiff * 100) / totalValue);
    }

}

module.exports = Attack;
