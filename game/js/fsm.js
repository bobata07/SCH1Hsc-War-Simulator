class State {
    constructor(name) {
        this.name = name;
    }

    enter(entity) {
        console.log(`${entity.name} entering state: ${this.name}`);
    }

    execute(entity) {
        // Run every frame
    }

    exit(entity) {
        console.log(`${entity.name} exiting state: ${this.name}`);
    }
}

class StateMachine {
    constructor(entity) {
        this.entity = entity;
        this.currentState = null;
    }

    changeState(newState) {
        if (this.currentState) {
            this.currentState.exit(this.entity);
        }
        this.currentState = newState;
        this.currentState.enter(this.entity);
    }

    update() {
        if (this.currentState) {
            this.currentState.execute(this.entity);
        }
    }
}
