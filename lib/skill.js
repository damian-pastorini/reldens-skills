/**
 *
 * Reldens - Skill
 *
 * Base skill class.
 *
 */

const { InteractionArea, EventsManagerSingleton, ErrorManager, sc } = require('@reldens/utils');
const { PropertyManager, Condition, Calculator } = require('@reldens/modifiers');
const SkillsConst = require('./constants');
const SkillsEvents = require('./skills-events');

class Skill
{

    constructor(props)
    {
        if(!sc.hasOwn(props, 'key')){
            ErrorManager.error('Missing skill key.');
        }
        if(!sc.hasOwn(props, 'owner')){
            ErrorManager.error('Missing skill owner.');
        }
        if(typeof props.owner.getPosition !== 'function'){
            ErrorManager.error('Undefined owner position method.');
        }
        this.key = props.key;
        this.owner = props.owner;
        this.ownerIdProperty = sc.hasOwn(props, 'ownerIdProperty') ? props.ownerIdProperty : 'id';
        this.type = SkillsConst.SKILL_TYPE_BASE;
        this.customData = sc.hasOwn(props, 'customData') ? props.customData : false;
        this.autoValidation = sc.hasOwn(props, 'autoValidation') ? props.autoValidation : false;
        this.skillDelay = sc.hasOwn(props, 'skillDelay') ? props.skillDelay : 0;
        // @TODO - BETA - Include the following properties and behaviors for skills.
        // this.targetConditions = sc.hasOwn(props, 'targetConditions') ? props.targetConditions : [];
        // this.skillDelayModifiers = []; // modifiers array to reduce or increase the skillDelay time.
        // this.repeat = 0; // the effects or the skill damage will be re-applied X times.
        // this.repeatTime = 0; // the time between repetitions, if not specified the skill will repeat continuously.
        // this.afterSkill = new Skill(props); // a linked skill will be executed after the current skill ends.
        // this.afterSkillTime = 0; // time between the skill end and linkedSkill starts, if 0, will run automatically.
        // this.failChance = 0; // the 0-100% chance of the skill execution fails.
        // this.failChanceCallback = () => {}; // a callback to customize the fail chance calculation.
        this.castTime = sc.hasOwn(props, 'castTime') ? props.castTime : 0;
        this.owner.isCasting = false;
        this.isValid = true;
        this.usesLimit = sc.hasOwn(props, 'usesLimit') ? props.usesLimit : 0;
        this.uses = 0;
        this.canActivate = sc.hasOwn(props, 'canActivate') ? props.canActivate : true;
        this.range = sc.hasOwn(props, 'range') ? props.range : 0;
        // if enabled range will be validated just before execution to get the owner and target realtime positions:
        this.rangeAutomaticValidation = sc.hasOwn(props, 'rangeAutomaticValidation') ?
            props.rangeAutomaticValidation : false;
        // @NOTE: if automatic range validation is enabled the rangePropertyX and rangePropertyY will be required and
        // used for both (owner and target) by default.
        this.rangePropertyX = sc.hasOwn(props, 'rangePropertyX') ? props.rangePropertyX : false;
        this.rangePropertyY = sc.hasOwn(props, 'rangePropertyY') ? props.rangePropertyY : false;
        // specify if you like to use a different range property for the target:
        this.rangeTargetPropertyX = sc.hasOwn(props, 'rangeTargetPropertyX') ?
            props.rangeTargetPropertyX : false;
        this.rangeTargetPropertyY = sc.hasOwn(props, 'rangeTargetPropertyY') ?
            props.rangeTargetPropertyY : false;
        // allow to target the same owner:
        this.allowSelfTarget = sc.hasOwn(props, 'allowSelfTarget') ? props.allowSelfTarget : false;
        // we can use a fixed target or pass the target on execution:
        this.target = sc.hasOwn(props, 'target') ? props.target : false;
        this.events = sc.hasOwn(props, 'events') ? props.events : EventsManagerSingleton;
        this.ownerConditions = sc.hasOwn(props, 'ownerConditions') ? props.ownerConditions : [];
        // owner effects will be applied when the skill is executed:
        this.ownerEffects = sc.hasOwn(props, 'ownerEffects') ? props.ownerEffects : [];
        // groups:
        this.groups = sc.hasOwn(props, 'groups') ? props.groups : [];
        // critical multiplier and critical chance are to specify how and if a skill hit is critical:
        this.criticalChance = sc.hasOwn(props, 'criticalChance') ? props.criticalChance : 0;
        this.criticalMultiplier = sc.hasOwn(props, 'criticalMultiplier') ? props.criticalMultiplier : 1;
        this.criticalFixedValue = sc.hasOwn(props, 'criticalFixedValue') ? props.criticalFixedValue : 0;
        // helper:
        this.propertyManager = new PropertyManager();
        this.calculator = new Calculator();
    }

    validate()
    {
        // @NOTE: the following is tricky, we use the isValid = true so developers can change it and return a different
        // isValid value after the event "validateSuccess".
        this.isValid = true;
        this.fireEvent(SkillsEvents.VALIDATE_BEFORE, this);
        // the delay is the time in milliseconds until player can use the skill again:
        if(!this.canActivate || this.owner.isCasting){
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
        this.fireEvent(SkillsEvents.VALIDATE_SUCCESS, this);
        return this.isValid;
    }

    validateConditions()
    {
        for(let condition of this.ownerConditions){
            if(!(condition instanceof Condition)){
                ErrorManager.error(['Wrong Condition instance.', (typeof condition), 'was specified.']);
            }
            if(!condition.isValidOn(this.owner)){
                this.fireEvent(SkillsEvents.VALIDATE_FAIL, this, condition);
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
        this.fireEvent(SkillsEvents.SKILL_BEFORE_IN_RANGE, this);
        // if range is 0 then the attack range is infinity:
        if(this.range === 0){
            return true;
        }
        // validate attack range:
        let interactionArea = new InteractionArea();
        interactionArea.setupInteractionArea(this.range, targetPosition.x, targetPosition.y);
        let interactionResult = interactionArea.isValidInteraction(ownerPosition.x, ownerPosition.y);
        this.fireEvent(SkillsEvents.SKILL_AFTER_IN_RANGE, this, interactionResult);
        return interactionResult;
    }

    async execute(target)
    {
        await this.fireEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, this, target);
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
                && !(await this.validateRange(target))
            )
            // cast validation:
            || (this.autoValidation && !this.validate())
            // @TODO - BETA - Auto validation doesn't work, check ActionsMessageActions.parseMessageAndRunActions.
        ){
            return false;
        }
        let skillLogicResult = false;
        if(this.ownerEffects){
            this.applyModifiers(this.ownerEffects, this.owner, true);
            await this.fireEvent(SkillsEvents.SKILL_APPLY_OWNER_EFFECTS, this, target);
        }
        if(this.castTime > 0){
            await this.fireEvent(SkillsEvents.SKILL_BEFORE_CAST, this, target);
            this.owner.isCasting = setTimeout(() => {
                skillLogicResult = this.finishExecution(target);
                this.owner.isCasting = false;
                this.fireEvent(SkillsEvents.SKILL_AFTER_CAST, this, target, skillLogicResult);
            }, this.castTime);
        } else {
            skillLogicResult = await this.finishExecution(target);
        }
        this.uses++;
        await this.onExecuteRewards();
        await this.fireEvent(SkillsEvents.SKILL_AFTER_EXECUTE, this, target);
        return skillLogicResult;
    }

    async finishExecution(target)
    {
        await this.fireEvent(SkillsEvents.SKILL_BEFORE_RUN_LOGIC, this, target);
        let skillLogicResult = await this.runSkillLogic();
        await this.fireEvent(SkillsEvents.SKILL_AFTER_RUN_LOGIC, this, target);
        return skillLogicResult;
    }

    onExecuteConditions()
    {
        // implement your custom conditions here.
        return true;
    }

    async runSkillLogic()
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

    applyModifiers(modifiersObjectList, target, avoidCritical = false)
    {
        for(let i of Object.keys(modifiersObjectList)){
            let modifier = modifiersObjectList[i];
            modifier.target = target;
            let newValue = modifier.getModifiedValue();
            if(!avoidCritical){
                newValue = this.applyCriticalValue(newValue);
            }
            modifier.setOwnerProperty(modifier.propertyKey, newValue);
        }
    }

    getOwnerId()
    {
        return this.owner[this.ownerIdProperty];
    }

    getOwnerEventKey()
    {
        return sc.getDef(this.owner, 'eventsPrefix', '')+this.getOwnerId();
    }

    async fireEvent(eventName, ...args)
    {
        // @NOTE: we append the current level set owner ID to the event name so we can pick up this event only for this
        // owner automatically:
        return await this.events.emit(this.eventFullName(eventName), ...args);
    }

    listenEvent(eventName, callback, removeKey, masterKey)
    {
        return this.events.onWithKey(this.eventFullName(eventName), callback, removeKey, masterKey);
    }

    eventFullName(eventName)
    {
        return this.getOwnerEventKey()+'.'+eventName;
    }

}

module.exports = Skill;
