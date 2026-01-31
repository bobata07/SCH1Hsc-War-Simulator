export default class FSM {
  constructor(initialState, states) {
    this.state = initialState;
    this.states = states;
    this.states[this.state].enter?.();
  }

  change(newState) {
    if (this.state === newState) return;
    this.states[this.state].exit?.();
    this.state = newState;
    this.states[this.state].enter?.();
  }

  update(context) {
    this.states[this.state].update(context);
  }
}
