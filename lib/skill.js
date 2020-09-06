/**
 *
 * Reldens - Skill
 *
 * Base skill class.
 *
 */

const { InteractionArea, EventsManager, ErrorManager } = require('@reldens/utils');
const { PropertyManager, Condition } = require('@reldens/modifiers');
const SkillConst = require('./constants');

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
        this.parentSkillKey = {}.hasOwnProperty.call(props, 'parentSkillKey') ? props.parentSkillKey : false;
        this.owner = props.owner;
        this.type = SkillConst.SKILL_TYPE_BASE;
        this.autoValidation = {}.hasOwnProperty.call(props, 'autoValidation') ? props.autoValidation : false;
        this.skillDelay = {}.hasOwnProperty.call(props, 'skillDelay') ? props.skillDelay : 0;
        // @TODO - Include:
        // this.skillDelayModifiers = []; // modifiers array to reduce or increase the skillDelay time.
        // this.repeat = 0; // the effects or the skill damage will be re-applied X times.
        // this.repeatTime = 0; // the time between repetitions, if not specified the skill will repeat continuously.
        // this.afterSkill = new Skill(props); // a linked skill will be executed after the current skill ends.
        // this.afterSkillTime = 0; // time between the skill end and linkedSkill starts, if 0, will run automatically.
        // this.failChance = 0; // the 0-100% chance of the skill execution fails.
        // this.failChanceCallback = () => {}; // a callback to customize the fail chance calculation.
        this.castTime = {}.hasOwnProperty.call(props, 'castTime') ? props.castTime : 0;
        this.isCasting = false;
        this.isValid = true;
        this.usesLimit = {}.hasOwnProperty.call(props, 'usesLimit') ? props.usesLimit : 0;
        this.uses = 0;
        this.canActivate = {}.hasOwnProperty.call(props, 'canActivate') ? props.canActivate : true;
        this.range = {}.hasOwnProperty.call(props, 'range') ? props.range : 0;
        // if enabled range will be validated just before execution to get the owner and target realtime positions:
        this.rangeAutomaticValidation = {}.hasOwnProperty.call(props, 'rangeAutomaticValidation') ?
            props.rangeAutomaticValidation : false;
        // @NOTE: if automatic range validation is enabled the rangePropertyX and rangePropertyY will be required and
        // used for both (owner and target) by default.
        this.rangePropertyX = {}.hasOwnProperty.call(props, 'rangePropertyX') ? props.rangePropertyX : false;
        this.rangePropertyY = {}.hasOwnProperty.call(props, 'rangePropertyY') ? props.rangePropertyY : false;
        // specify if you like to use a different range property for the target:
        this.rangeTargetPropertyX = {}.hasOwnProperty.call(props, 'rangeTargetPropertyX') ?
            props.rangeTargetPropertyX : false;
        this.rangeTargetPropertyY = {}.hasOwnProperty.call(props, 'rangeTargetPropertyY') ?
            props.rangeTargetPropertyY : false;
        // allow to target the same owner:
        this.allowSelfTarget = {}.hasOwnProperty.call(props, 'allowSelfTarget') ? props.allowSelfTarget : false;
        // we can use a fixed target or pass the target on execution:
        this.target = {}.hasOwnProperty.call(props, 'target') ? props.target : false;
        this.events = EventsManager;
        this.ownerConditions = {}.hasOwnProperty.call(props, 'ownerConditions') ? props.ownerConditions : [];
        // owner effects will be applied when the skill is executed:
        this.ownerEffects = {}.hasOwnProperty.call(props, 'ownerEffects') ? props.ownerEffects : [];
        // related skills (required to make this skill available):
        this.dependOn = {}.hasOwnProperty.call(props, 'dependOn') ? props.dependOn : [];
        // group:
        this.groupId = {}.hasOwnProperty.call(props, 'groupId') ? props.groupId : 0;
        // critical multiplier and critical chance are to specify how and if a skill hit is critical:
        this.criticalChance = {}.hasOwnProperty.call(props, 'criticalChance') ? props.criticalChance : 0;
        this.criticalMultiplier = {}.hasOwnProperty.call(props, 'criticalMultiplier') ? props.criticalMultiplier : 1;
        this.criticalFixedValue = {}.hasOwnProperty.call(props, 'criticalFixedValue') ? props.criticalFixedValue : 0;
        // helper:
        this.propertyManager = new PropertyManager();
    }

    validate()
    {
        // @NOTE: the following is tricky, we use the isValid = true so developers can change it and return a different
        // isValid value after the event "reldens.skills.validateSuccess".
        this.isValid = true;
        this.events.emit('reldens.skills.beforeValidate', this);
        // the delay is the time in milliseconds until player can use the skill again:
        if(!this.canActivate || this.isCasting){
            // @NOTE: player could be running an attack already.
            return false;
        }
        // validate conditions:
        if(!this.validateConditions()){
            return false;
        }
        if(this.usesLimit > 0 && this.uses >= this.usesLimit){
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

    validateConditions()
    {
        for(let condition of this.ownerConditions){
            if(condition instanceof Condition){
                ErrorManager.error(['Wrong Condition instance.', (typeof condition), 'was specified.']);
            }
            if(!condition.isValidOn(this.owner)){
                this.events.emit('reldens.skills.validateFail', this, condition);
                return false;
            }
        }
        return true;
    }

    validateRange(target)
    {
        if(!this.rangePropertyX || !this.rangePropertyY){
            ErrorManager.error('Missing range properties for validation.');
        }
        let ownerPosition = {
            x: this.propertyManager.getPropertyValue(this.owner, this.rangePropertyX),
            y: this.propertyManager.getPropertyValue(this.owner, this.rangePropertyY)
        };
        let targetPosition = {
            x: this.propertyManager.getPropertyValue(target, (this.rangeTargetPropertyX || this.rangePropertyX)),
            y: this.propertyManager.getPropertyValue(target, (this.rangeTargetPropertyY || this.rangePropertyY))
        };
        return this.isInRange(ownerPosition, targetPosition);
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
        this.events.emit('reldens.skills.afterIsInRange', this, interactionResult);
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
        if(
            // custom conditions:
            !this.onExecuteConditions()
            // range:
            || (
                this.rangeAutomaticValidation
                && this.rangePropertyX
                && this.rangePropertyY
                && !this.validateRange(target)
            )
            // cast validation:
            || (this.autoValidation && !this.validate())
        ){
            return false;
        }
        let skillLogicResult = false;
        if(this.castTime > 0){
            this.events.emit('reldens.skills.startCasting', this, target);
            this.isCasting = setTimeout(() => {
                skillLogicResult = this.finishExecution(target);
                this.isCasting = false;
                this.events.emit('reldens.skills.afterCast', this, target, skillLogicResult);
            }, this.castTime);
        } else {
            skillLogicResult = this.finishExecution(target);
        }
        this.uses++;
        await this.onExecuteRewards();
        this.events.emit('reldens.skills.afterExecute', this, target);
        return skillLogicResult;
    }

    finishExecution(target)
    {
        this.events.emit('reldens.skills.beforeRunLogic', this, target);
        let skillLogicResult = this.runSkillLogic();
        this.events.emit('reldens.skills.afterRanLogic', this, target);
        return skillLogicResult;
    }

    onExecuteConditions()
    {
        // implement your custom conditions here.
        return true;
    }

    runSkillLogic()
    {
        // run the skill logic here.
        return true;
    }

    async onExecuteRewards()
    {
        // implement your custom rewards here.
    }

    applyCriticalValue(normalValue)
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

    getCriticalDiff(normalValue)
    {
        let criticalValue = this.applyCriticalValue(normalValue);
        return criticalValue - normalValue;
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
