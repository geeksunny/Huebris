const RESULT = {
    continue: '_continue',
    repeat: '_repeat',
    exitError: '_error',
    exit: '_exit'
};

function isResult(value) {
    for (let key in RESULT) {
        if (RESULT[key] === value) {
            return true;
        }
    }
    return false;
}


const Stepper = function(steps = []) {
    this.steps = steps;
};

Stepper.prototype.run = async function() {
    let result;

    stepLoop:
    for (let i = 0; i < this.steps.length; /**/ ) {
        let priorResult = result;
        let step = this.steps[i];
        result = await step.action(priorResult);

        let validation;
        if (!isResult(result)) {
            validation = (typeof step.validate === 'function') ? step.validate(result) : RESULT.continue;
        } else {
            validation = result;
            result = priorResult;
        }

        switch (validation) {
            case RESULT.continue:
                i++;
                break;
            case RESULT.repeat:
                // TODO: Should original result value be preserved in this case?
                break;
            case RESULT.exit:
                break stepLoop;
            case RESULT.exitError:
            default:
                process.exit(-1);
        }
    }

    // console.log(JSON.stringify(result, null, 2));
};

Stepper.RESULT = RESULT;


module.exports = Stepper;