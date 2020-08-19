/**
 *
 * Reldens - Skill
 *
 * Base skill class.
 *
 */

const { InteractionArea, EventsManager, ErrorManager } = require('@reldens/utils');
const { SkillConst } = require('./constants');

class Skill
{

    constructor(props)
    {
        if(!{}.hasOwnProperty.call(props, 'key')){
            ErrorManager.error('Missing skill key.');
        }
        if(!{}.hasOwnProperty.call(props, 'owner')){
            ErrorManager.error('Missing skill owner.');
        }
        this.key = props.key;
        this.owner = props.owner;
        this.type = SkillConst.SKILL_TYPE_BASE;
        this.skillDelay = {}.hasOwnProperty.call(props, 'skillDelay') ? props.skillDelay : 0;
        this.castTime = {}.hasOwnProperty.call(props, 'castTime') ? props.castTime : 0;
        this.isCasting = false;
        this.isValid = true;
        this.usesLimit = {}.hasOwnProperty.call(props, 'usesLimit') ? props.usesLimit : 0;
        this.uses = 0;
        this.canActivate = {}.hasOwnProperty.call(props, 'canActivate') ? props.canActivate : true;
        this.range = {}.hasOwnProperty.call(props, 'range') ? props.range : 0;
        // allow to target the same owner:
        this.allowSelfTarget = {}.hasOwnProperty.call(props, 'allowSelfTarget') ? props.allowSelfTarget : false;
        // we can use a fixed target or pass the target on execution:
        this.target = {}.hasOwnProperty.call(props, 'target') ? props.target : false;
        this.events = EventsManager;
        // @TODO: owner conditions will have something like modifiers to validate if the skill can be executed.
        this.ownerConditions = {}.hasOwnProperty.call(props, 'ownerConditions') ? props.ownerConditions : {};
        // owner effects will be applied when the skill is executed:
        this.ownerEffects = {}.hasOwnProperty.call(props, 'ownerEffects') ? props.ownerEffects : {};
        // related skills (required to make this skill available):
        this.dependOn = {}.hasOwnProperty.call(props, 'dependOn') ? props.dependOn : {};
        // group:
        this.groupId = {}.hasOwnProperty.call(props, 'groupId') ? props.groupId : 0;
        // critical multiplier and critical chance are to specify how and if a skill hit is critical:
        this.criticalChance = {}.hasOwnProperty.call(props, 'criticalChance') ? props.criticalChance : {};
        this.criticalMultiplier = {}.hasOwnProperty.call(props, 'criticalMultiplier') ? props.criticalMultiplier : 1;
        this.criticalFixedValue = {}.hasOwnProperty.call(props, 'criticalFixedValue') ? props.criticalFixedValue : 0;
    }

    validate()
    {
        this.isValid = true;
        this.events.emit('reldens.skills.beforeValidate', this);
        // the delay is the time in milliseconds until player can use the skill again:
        if(!this.canActivate || this.isCasting){
            // @NOTE: player could be running an attack already.
            return false;
        }
        if(this.uses >= this.usesLimit){
            return false;
        }
        if(this.skillDelay > 0){
            this.canActivate = false;
            setTimeout(()=> {
                this.canActivate = true;
            }, this.skillDelay);
        } else {
            this.canActivate = true;
        }
        // with this event we could modify the isValid property if required:
        this.events.emit('reldens.skills.validateSuccess', this);
        return this.isValid;
    }

    isInRange(ownerPosition, targetPosition)
    {
        this.events.emit('reldens.skills.beforeIsInRange', this);
        // if range is 0 then the attack range is infinity:
        if(this.range === 0){
            return true;
        }
        // validate attack range:
        let interactionArea = new InteractionArea();
        interactionArea.setupInteractionArea(this.range, targetPosition.x, targetPosition.y);
        let interactionResult = interactionArea.isValidInteraction(ownerPosition.x, ownerPosition.y);
        this.events.emit('reldens.skills.beforeIsInRange', this, interactionResult);
        return interactionResult;
    }

    async execute(target)
    {
        this.events.emit('reldens.skills.beforeExecute', this, target);
        if(target){
            this.target = target;
        }
        if(!this.target){
            ErrorManager.error('Target undefined.');
        }
        if(!this.onExecuteConditions()){
            return false;
        }
        if(this.castTime > 0){
            this.isCasting = setTimeout(() => {
                this.runSkillLogic(target);
                this.isCasting = false;
            }, this.castTime);
        } else {
            this.runSkillLogic({target});
        }
        this.uses++;
        await this.onExecuteRewards();
        this.events.emit('reldens.skills.afterExecute', this, target);
        return true;
    }

    onExecuteConditions()
    {
        // implement your custom conditions here.
        return true;
    }

    runSkillLogic(props)
    {
        // run the skill logic here.
        return props;
    }

    async onExecuteRewards()
    {
        // implement your custom rewards here.
    }

    getCriticalValue(normalValue)
    {
        if(this.isCritical()){
            if(this.criticalMultiplier){
                normalValue = normalValue * this.criticalMultiplier;
            }
            if(this.criticalFixedValue){
                normalValue = normalValue + this.criticalFixedValue;
            }
        }
        return normalValue;
    }

    isCritical()
    {
        if(this.criticalChance <= 0){
            return false;
        }
        let rand = this.randomInteger(1, 100);
        return rand > this.criticalChance;
    }

    randomInteger(min, max)
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}

module.exports = Skill;
