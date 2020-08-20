
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
        // all properties are obtained from the skill owner and the target to calculate the damage:
        this.attackProperties = {}.hasOwnProperty.call(props, 'attackProperties') ? props.attackProperties : [];
        this.defenseProperties = {}.hasOwnProperty.call(props, 'defenseProperties') ? props.defenseProperties : [];
        // aim and dodge properties are used to determine if the skill could fail:
        this.aimProperties = {}.hasOwnProperty.call(props, 'aimProperties') ? props.aimProperties : [];
        this.dodgeProperties = {}.hasOwnProperty.call(props, 'dodgeProperties') ? props.dodgeProperties : [];
        // specify if the critical will be affected by the aim and dodge properties:
        this.criticalAffected = {}.hasOwnProperty.call(props, 'criticalAffected') ? props.criticalAffected : false;
        // helpers:
        this.propertyManager = new PropertyManager();
        this.calc = new Calculator();
    }

    runSkillLogic(target)
    {
        this.calculateDamageTo(this.target);
    }

    calculateDamageTo(target)
    {
        let ownerAtk = this.getPropertiesTotal(this.owner, this.attackProperties);
        let targetDef = this.getPropertiesTotal(target, this.defenseProperties);
        let ownerAim = this.getPropertiesTotal(this.owner, this.aimProperties);
        let targetDodge = this.getPropertiesTotal(target, this.dodgeProperties);
        // both owner and target properties values has to be calculated at the time the skill is executed:
        if(this.allowEffectBelowZero || target[this.affectedProperty] > 0){
            // @NOTE: this is just a basic example on how using modifiers for atk and def could affect the hit damage.
            let diff = ownerAtk - targetDef;
            let damage = this.hitDamage; // 100%
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
            // @TODO: implement AIM, DODGE and CRITICAL:
            target[this.affectedProperty] -= damage;
        }
        // avoid getting below 0:
        if(target[this.affectedProperty] < 0){
            target[this.affectedProperty] = 0;
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

}

module.exports = Attack;
