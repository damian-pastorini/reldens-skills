/**
 *
 * Reldens - Skills - Skill
 *
 */

const SkillsConst = require('./constants');
const SkillsEvents = require('./skills-events');
const { PropertyManager, Condition, Calculator } = require('@reldens/modifiers');
const { InteractionArea, EventsManagerSingleton, Logger, sc } = require('@reldens/utils');

class Skill
{

    constructor(props)
    {
        this.isReady = true;
        if(!sc.hasOwn(props, 'key')){
            Logger.error('Missing skill key.');
            this.isReady = false;
        }
        if(!sc.hasOwn(props, 'owner')){
            Logger.error('Missing skill owner.');
            this.isReady = false;
        }
        if(typeof props.owner.getPosition !== 'function'){
            Logger.error('Undefined owner position method.');
            this.isReady = false;
        }
        this.key = props.key;
        this.owner = props.owner;
        this.ownerIdProperty = sc.get(props, 'ownerIdProperty', 'id');
        this.type = SkillsConst.SKILL.TYPE.BASE;
        this.customData = sc.get(props, 'customData', false);
        this.autoValidation = sc.get(props, 'autoValidation', false);
        this.skillDelay = sc.get(props, 'skillDelay', 0);
        // @TODO - BETA - Include the following properties and behaviors for skills.
        // this.targetConditions = sc.hasOwn(props, 'targetConditions') ? props.targetConditions : [];
        // this.skillDelayModifiers = []; // modifiers array to reduce or increase the skillDelay time.
        // this.repeat = 0; // the effects or the skill damage will be re-applied X times.
        // this.repeatTime = 0; // the time between repetitions, if not specified the skill will repeat continuously.
        // this.afterSkill = new Skill(props); // a linked skill will be executed after the current skill ends.
        // this.afterSkillTime = 0; // time between the skill end and linkedSkill starts, if 0, will run automatically.
        // this.failChance = 0; // the 0-100% chance of the skill execution fails.
        // this.failChanceCallback = () => {}; // a callback to customize the fail chance calculation.
        this.castTime = sc.get(props, 'castTime', 0);
        this.owner.isCasting = false;
        this.owner.castingTimer = false;
        this.isValid = true;
        this.usesLimit = sc.get(props, 'usesLimit', 0);
        this.uses = 0;
        this.canActivate = sc.get(props, 'canActivate', true);
        this.range = sc.get(props, 'range', 0);
        this.skillActivationTimer = false;
        this.lastState = '';
        this.groups = sc.get(props, 'groups', []);
        this.lastAppliedModifiers = {};
        // if enabled, range will be validated just before execution to get the owner and target realtime positions:
        this.rangeAutomaticValidation = sc.get(props, 'rangeAutomaticValidation', false);
        // @NOTE: if automatic range validation is enabled, the rangePropertyX and rangePropertyY will be required and
        // used for both (owner and target) by default.
        this.rangePropertyX = sc.get(props, 'rangePropertyX', false);
        this.rangePropertyY = sc.get(props, 'rangePropertyY', false);
        // specify if you like to use a different range property for the target:
        this.rangeTargetPropertyX = sc.get(props, 'rangeTargetPropertyX', false);
        this.rangeTargetPropertyY = sc.get(props, 'rangeTargetPropertyY', false);
        // allow targeting the same owner:
        this.allowSelfTarget = sc.get(props, 'allowSelfTarget', false);
        // we can use a fixed target or pass the target on execution:
        this.target = sc.get(props, 'target', false);
        this.events = sc.get(props, 'events', EventsManagerSingleton);
        this.ownerConditions = sc.get(props, 'ownerConditions', []);
        // owner effects will be applied when the skill is executed:
        this.ownerEffects = sc.get(props, 'ownerEffects', []);
        // critical multiplier and critical chance are to specify how and if a skill hit is critical:
        this.criticalChance = sc.get(props, 'criticalChance', 0);
        this.criticalMultiplier = sc.get(props, 'criticalMultiplier', 1);
        this.criticalFixedValue = sc.get(props, 'criticalFixedValue', 0);
        // helper:
        this.propertyManager = new PropertyManager();
        this.calculator = new Calculator();
    }

    validate()
    {
        if(!this.isReady){
            Logger.error('Skill is not ready for validation.', this.key);
            return false;
        }
        // @NOTE: the following is tricky, we use the isValid = true so developers can change it and return a different
        // isValid value after the event "validateSuccess".
        this.isValid = true;
        // @TODO - BETA - Replace catch.
        this.fireEvent(SkillsEvents.VALIDATE_BEFORE, this).catch((err) => {
            Logger.error(err);
        });
        // the delay is the time in milliseconds until the player can use the skill again:
        if(!this.canActivate || this.owner.isCasting){
            this.lastState = SkillsConst.SKILL_STATES.CAN_NOT_ACTIVATE;
            // @NOTE: player could be running an attack already.
            return false;
        }
        // validate conditions:
        if(!this.validateConditions()){
            return false;
        }
        if(0 < this.usesLimit && this.uses >= this.usesLimit){
            return false;
        }
        this.canActivate = true;
        if(0 < this.skillDelay){
            this.canActivate = false;
            this.skillActivationTimer = setTimeout(()=> {
                this.canActivate = true;
            }, this.skillDelay);
        }
        // with this event we could modify the isValid property if required:
        // @TODO - BETA - Replace catch.
        this.fireEvent(SkillsEvents.VALIDATE_SUCCESS, this).catch((err) => {
            Logger.error(err);
        });
        return this.isValid;
    }

    validateConditions()
    {
        for(let condition of this.ownerConditions){
            if(!(condition instanceof Condition)){
                Logger.critical('Wrong Condition instance was specified.', (typeof condition));
                return false;
            }
            if(!condition.isValidOn(this.owner)){
                // @TODO - BETA - Replace catch.
                this.fireEvent(SkillsEvents.VALIDATE_FAIL, this, condition).catch((err) => {
                    Logger.error(err);
                });
                return false;
            }
        }
        return true;
    }

    validateRange(target)
    {
        if(!this.rangePropertyX || !this.rangePropertyY){
            Logger.error('Missing range properties for validation.');
            return false;
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
        // @TODO - BETA - Replace catch.
        this.fireEvent(SkillsEvents.SKILL_BEFORE_IN_RANGE, this).catch((err) => {
            Logger.error(err);
        });
        // if range is 0 then the attack range is infinity:
        if(this.range === 0){
            return true;
        }
        // validate attack range:
        let interactionArea = new InteractionArea();
        interactionArea.setupInteractionArea(this.range, targetPosition.x, targetPosition.y);
        let interactionResult = interactionArea.isValidInteraction(ownerPosition.x, ownerPosition.y);
        // @TODO - BETA - Replace catch.
        this.fireEvent(SkillsEvents.SKILL_AFTER_IN_RANGE, this, interactionResult).catch((err) => {
            Logger.error(err);
        });
        return interactionResult;
    }

    async execute(target)
    {
        if(!this.isReady){
            Logger.error('Skill is not ready to be executed.', this.key);
            return false;
        }
        await this.fireEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, this, target);
        if(target){
            this.target = target;
        }
        if(!this.target){
            Logger.error('Target undefined.');
            return false;
        }
        if(
            // custom conditions:
            !this.onExecuteConditions()
            // range:
            || await this.isValidRange(target)
            // cast validation:
            || (this.autoValidation && !this.validate())
            // @TODO - BETA - Auto validation doesn't work, check ActionsMessageActions.parseMessageAndRunActions.
        ){
            return false;
        }
        if(this.ownerEffects){
            this.applyModifiers(this.ownerEffects, this.owner, true);
            await this.fireEvent(SkillsEvents.SKILL_APPLY_OWNER_EFFECTS, this, target);
        }
        let skillLogicResult = await this.applySkillLogicOnTarget(target);
        this.uses++;
        await this.onExecuteRewards();
        await this.fireEvent(SkillsEvents.SKILL_AFTER_EXECUTE, this, target);
        return skillLogicResult;
    }

    async applySkillLogicOnTarget(target)
    {
        if(0 < this.castTime){
            await this.fireEvent(SkillsEvents.SKILL_BEFORE_CAST, this, target);
            this.owner.isCasting = true;
            this.owner.castingTimer = setTimeout(async () => {
                let skillLogicResult = await this.finishExecution(target);
                this.owner.isCasting = false;
                await this.fireEvent(SkillsEvents.SKILL_AFTER_CAST, this, target, skillLogicResult);
            }, this.castTime);
            return false;
        }
        return await this.finishExecution(target);
    }

    async isValidRange(target)
    {
        return this.rangeAutomaticValidation
            && this.rangePropertyX
            && this.rangePropertyY
            && !(await this.validateRange(target));
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
        // implement any custom conditions here.
        return true;
    }

    async runSkillLogic()
    {
        // run the skill logic here.
        return true;
    }

    async onExecuteRewards()
    {
        // implement any custom rewards here.
    }

    applyCriticalValue(normalValue)
    {
        if(!this.isCritical()){
            return normalValue;
        }
        if(sc.isNumber(this.criticalMultiplier)){
            normalValue = normalValue * this.criticalMultiplier;
        }
        if(sc.isNumber(this.criticalFixedValue)){
            normalValue = normalValue + this.criticalFixedValue;
        }
        return normalValue;
    }

    getCriticalDiff(normalValue)
    {
        return this.applyCriticalValue(normalValue) - normalValue;
    }

    isCritical()
    {
        if(this.criticalChance <= 0){
            return false;
        }
        return sc.randomInteger(1, 100) <= this.criticalChance;
    }

    applyModifiers(modifiersObjectList, target, avoidCritical = false)
    {
        this.lastAppliedModifiers = {};
        for(let i of Object.keys(modifiersObjectList)){
            let modifier = modifiersObjectList[i];
            modifier.target = target;
            let newValue = modifier.getModifiedValue();
            if(!avoidCritical){
                newValue = newValue + this.getCriticalDiff(modifier.value);
            }
            modifier.setOwnerProperty(modifier.propertyKey, newValue);
            this.lastAppliedModifiers[modifier.propertyKey] = newValue;
        }
    }

    getOwnerId()
    {
        return this.owner[this.ownerIdProperty];
    }

    getOwnerEventKey()
    {
        return sc.get(this.owner, 'eventsPrefix', 'skill.ownerId.'+this.getOwnerId());
    }

    getOwnerUniqueEventKey(suffix)
    {
        let uniqueKey = sc.isFunction(this.owner.eventUniqueKey)
            ? this.owner.eventUniqueKey()
            : 'skills.ownerId.' + this.getOwnerId() + '.uKey.' + sc.getTime();
        return uniqueKey+(suffix ? '.'+suffix : '');
    }


    async fireEvent(eventName, ...args)
    {
        // @NOTE: we append the current level set owner ID to the event name, so we can pick up this event only for
        // this owner automatically:
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
