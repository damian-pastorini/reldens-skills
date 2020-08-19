
const { ErrorManager } = require('@reldens/utils');
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
    }

    runSkillLogic(target)
    {
        this.calculateDamageTo(this.target);
    }

    calculateDamageTo(target)
    {
        let ownerPropsValues = this.getPropertiesValues(this.owner);
        let targetPropsValues = this.getPropertiesValues(target);
        let ownerAtk = 1;
        let targetDef = 1;
        let ownerAim = 1;
        let targetDodge = 1;
        if(Object.keys(this.attackProperties).length){
            for(let i of Object.keys(this.attackProperties)) {
                let property = this.attackProperties[i];
            }
        }
        if(Object.keys(this.defenseProperties).length){

        }
        if(Object.keys(this.aimProperties).length){

        }
        if(Object.keys(this.dodgeProperties).length){

        }
        // both owner and target properties values has to be calculated at the time the skill is executed:
        if(this.allowEffectBelowZero || target[this.affectedProperty] > 0){
            // @NOTE: this is just a basic example on how using modifiers for atk and def could affect the hit damage.
            let diff = this.owner.atk - target.def;
            let damage = this.hitDamage; // 100%
            if(diff > 0){
                let p = diff < target.def ? (diff * 100 / target.def) : 99;
                p = p > 99 ? 99 : p; // maximum modifier percentage to add.
                let additionalDamage = Math.ceil((p * damage / 100));
                damage = damage + additionalDamage;
            }
            if(diff < 0){
                let p = -diff < this.owner.atk ? (-diff * 100 / this.owner.atk) : 99;
                p = p > 99 ? 99 : p; // maximum modifier percentage to remove.
                let reduceDamage = Math.floor((p * damage / 100));
                damage = damage - reduceDamage;
            }
            target[this.affectedProperty] -= damage;
        }
        // avoid getting below 0:
        if(target[this.affectedProperty] < 0){
            target[this.affectedProperty] = 0;
        }
    }

    getPropertiesValues(object, propertiesArray)
    {
        let values = [];
        if(Object.keys(propertiesArray).length){

        }
        return values;
    }

}

module.exports = Attack;
