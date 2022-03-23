/**
 *
 * Reldens - Skills - Attack
 *
 * This class provides a skill with damage calculation properties and methods.
 *
 */

const Skill = require('../skill');
const SkillsEvents = require('../skills-events');
const SkillsConst = require('../constants');
const { ErrorManager, sc } = require('@reldens/utils');

class Attack extends Skill
{

    constructor(props)
    {
        super(props);
        this.type = SkillsConst.SKILL_TYPE_ATTACK;
        if(!sc.get(props, 'affectedProperty', false)){
            ErrorManager.error('Missing skill affectedProperty to which the result damage will be applied.');
        }
        // the affected property is the one to which the damage calculation will have effect:
        this.affectedProperty = props.affectedProperty;
        this.allowEffectBelowZero = sc.get(props, 'allowEffectBelowZero', false);
        // hit damage value at 100%:
        this.hitDamage = sc.hasOwn(props, 'hitDamage') ? props.hitDamage : 0;
        this.applyDirectDamage = sc.hasOwn(props, 'applyDirectDamage') ? props.applyDirectDamage : false;
        // all properties are obtained from the skill owner and the target to calculate the damage:
        this.attackProperties = sc.hasOwn(props, 'attackProperties') ? props.attackProperties : [];
        this.defenseProperties = sc.hasOwn(props, 'defenseProperties') ? props.defenseProperties : [];
        // aim and dodge properties are used to determine if the skill could fail:
        this.aimProperties = sc.hasOwn(props, 'aimProperties') ? props.aimProperties : [];
        this.dodgeProperties = sc.hasOwn(props, 'dodgeProperties') ? props.dodgeProperties : [];
        // dodgeFullEnabled will make the attack fail if: dodge > ownerAim * dodgeOverAimSuccess
        this.dodgeFullEnabled = sc.hasOwn(props, 'dodgeFullEnabled') ? props.dodgeFullEnabled : true;
        this.dodgeOverAimSuccess = sc.hasOwn(props, 'dodgeOverAimSuccess') ? props.dodgeOverAimSuccess : 1;
        // specify if the damage or the critical will be affected by the aim and dodge properties:
        this.damageAffected = sc.hasOwn(props, 'damageAffected') ? props.damageAffected : false;
        this.criticalAffected = sc.hasOwn(props, 'criticalAffected') ? props.criticalAffected : false;
        // properties total calculator operators:
        // example: {
        //     {key: 'propName1', op: ModifierConst.OPS.INC},
        //     {key: 'propName2', op: ModifierConst.OPS.DEC}
        // }
        this.propertiesTotalOperators = sc.get(props, 'propertiesTotalOperators', {});
    }

    async runSkillLogic()
    {
        if(!this.validateRange(this.target)){
            // out of range, the owner or the target could moved away
            return false;
        }
        return await this.applyDamageTo(this.target);
    }

    async applyDamageTo(target)
    {
        // @NOTE: both owner and target properties values has to be calculated at the time the skill is executed, that
        //  is why we are getting the target always as parameter.
        // check if the skill can be dodged:
        let ownerAim = this.getPropertiesTotal(this.owner, this.aimProperties);
        let targetDodge = this.getPropertiesTotal(target, this.dodgeProperties);
        if(this.dodgeFullEnabled && targetDodge > (ownerAim * this.dodgeOverAimSuccess)){
            return false;
        }
        let affectedPropertyValue = this.getAffectedPropertyValue(target);
        if(!this.allowEffectBelowZero && 0 >= affectedPropertyValue){
            return false;
        }
        // dodge proportion:
        let dodgeAimDiff = this.getDiffProportion(ownerAim, targetDodge);
        let damage = this.applyDirectDamage
            ? this.hitDamage // 100%
            : this.calculateProportionDamage(target, this.hitDamage, targetDodge, ownerAim, dodgeAimDiff);
        // critical calculation:
        damage = damage + this.calculateCriticalDamage(damage, targetDodge, ownerAim, dodgeAimDiff);
        // avoid getting below 0:
        let modifiedValue = (!this.allowEffectBelowZero && affectedPropertyValue < damage)
            ? 0
            : affectedPropertyValue - damage;
        this.setAffectedPropertyValue(target, modifiedValue);
        await this.fireEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, this, target, damage, modifiedValue);
    }

    calculateCriticalDamage(damage, targetDodge, ownerAim, dodgeAimDiff)
    {
        let criticalValue = this.getCriticalDiff(damage);
        if(!this.criticalAffected || targetDodge > ownerAim){
            return criticalValue;
        }
        // calculate dodge proportion over critical damage and remove it from the critical total:
        return criticalValue - (Math.floor((criticalValue * dodgeAimDiff / 100)));
    }

    calculateProportionDamage(target, damage, targetDodge, ownerAim, dodgeAimDiff)
    {
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
        return damage;
    }

    getPropertiesTotal(object, propertiesArray)
    {
        if(0 === propertiesArray.length){
            return 0;
        }
        let totalValue = 0;
        for(let prop of propertiesArray){
            let propValue = this.propertyManager.getPropertyValue(object, prop);
            totalValue = sc.hasOwn(this.propertiesTotalOperators, prop)
                ? this.calculator.calculateNewValue(totalValue, this.propertiesTotalOperators[prop], propValue)
                : totalValue + propValue;
        }
        return totalValue;
    }

    getDiffProportion(totalValue, upProportionValue)
    {
        let propertiesDiff = upProportionValue - totalValue;
        return ((propertiesDiff * 100) / totalValue);
    }

    getAffectedPropertyValue(target)
    {
        return this.propertyManager.getPropertyValue(target, this.affectedProperty);
    }

    setAffectedPropertyValue(target, newValue)
    {
        return this.propertyManager.setOwnerProperty(target, this.affectedProperty, newValue);
    }

}

module.exports = Attack;
